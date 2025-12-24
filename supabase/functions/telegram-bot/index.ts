import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');

// ---------------------------------------------------------
// 🔑 ENVIRONMENT VARIABLES
// ---------------------------------------------------------
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')! // Legacy API Key (Deprecated)

// ---------------------------------------------------------
// ⚙️ CONFIGURATION
// ---------------------------------------------------------
const EVENT_TYPES = [
  "Wedding", "Pre-Wedding", "Engagement", "Haldi", "Maternity", "Baby Shoot", "Other"
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  const url = new URL(req.url)

  // 0. DEBUG ENDPOINT
  if (url.searchParams.get('type') === 'debug') {
    return handleDebugCommand()
  }

  // 1. DATABASE TRIGGER
  if (req.method === 'POST') {
      const type = url.searchParams.get('type')
      if (type === 'notify') return handleDatabaseNotification(req)
      if (type === 'booking_update') return handleBookingUpdate(req)
      if (type === 'device_register') return handleDeviceRegister(req)
  }

  // 2. TELEGRAM INTERACTION
  try {
    const update = await req.json()

    if (update.callback_query) {
      await handleCallback(update.callback_query)
    } else if (update.message) {
      await handleMessage(update.message)
    }

  } catch (err) {
    console.error("Handler Error:", err)
  }

  return new Response('OK', { status: 200 })
})

// ------------------------------------------------------------------
// 🐞 DEBUG HANDLER
// ------------------------------------------------------------------
async function handleDebugCommand() {
    try {
        console.log("Debug command received");
        await sendMessage(CHAT_ID, "🐛 <b>DEBUG MESSAGE</b>\n\nIf you receive this, the bot is working correctly.");
        return new Response('Debug message sent', { status: 200 })
    } catch (err) {
        console.error("Debug Error:", err)
        return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
    }
}

// ------------------------------------------------------------------
// 🔔 DATABASE NOTIFICATION HANDLER
// ------------------------------------------------------------------
async function handleDatabaseNotification(req: Request) {
    try {
      const payload = await req.json()
      console.log("Database Notification Payload:", JSON.stringify(payload, null, 2))
      const booking = payload.record 
      if (!booking) return new Response('No record', { status: 400 })

      // Check Clashes
      const { data: clashData } = await supabase.from('bookings').select('client_name, assigned_to').eq('booking_date', booking.booking_date).eq('status', 'confirmed').maybeSingle()

      const eventType = booking.event_type || "General Inquiry";
      let header = "<b>✨ NEW ENQUIRY ✨</b>";
      let icon = "📷";
      
      if (eventType.includes("Full Wedding")) { header = "<b>💎 PREMIUM PACKAGE 💎</b>"; icon = "💍"; }
      else if (eventType.includes("Custom")) { header = "<b>🛠 CUSTOM REQUEST 🛠</b>"; icon = "📝"; }

      let message = `${header}\n`
      if (clashData) {
          const assignee = clashData.assigned_to ? clashData.assigned_to : "Unassigned"
          message += `\n🚨 <b>CLASH ALERT:</b> Date booked for ${clashData.client_name} (${assignee}).\n`
      }
      
      message += `\n👤 <b>Client:</b> ${booking.client_name}`
      message += `\n📞 <b>Phone:</b> <code>${booking.client_phone}</code>`
      message += `\n🗓 <b>Date:</b> ${booking.booking_date}`
      if(booking.booking_end_date && booking.booking_end_date !== booking.booking_date) {
          message += ` to ${booking.booking_end_date}`
      }
      message += `\n${icon} <b>Details:</b> ${eventType}`
      message += `\n\n<i>Select an action below:</i>`

      const keyboard = {
        inline_keyboard: [[ { text: "✅ Approve / Assign", callback_data: `assign_${booking.id}` }, { text: "❌ Reject", callback_data: `reject_${booking.id}` } ]]
      }

      await sendMessage(CHAT_ID, message, keyboard)
      return new Response('Notification Sent', { status: 200 })
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
    }
}

// ------------------------------------------------------------------
// 📩 MESSAGE HANDLER
// ------------------------------------------------------------------
async function handleMessage(msg: any) {
  const chatId = msg.chat.id
  const text = msg.text

  // --- COMMANDS ---
  if (text === '/calendar') { await handleCalendarCommand(chatId); return; }
  if (text === '/create_booking') {
    const keyboard = { inline_keyboard: EVENT_TYPES.map(type => [{ text: type, callback_data: `new_evt_${type}` }]) }
    await sendMessage(chatId, "🛠 <b>Create New Booking</b>\n\nStep 1: Select <b>Event Type</b>:", keyboard)
    return
  }

  // --- HANDLE REPLIES ---
  if (msg.reply_to_message) {
    const replyText = msg.reply_to_message.text
    
    // A. ASSIGNMENT LOOP (Modified for 2-Message Flow)
    if (replyText.includes("ASSIGNMENT MODE") || replyText.includes("Share next contact")) {
        const match = replyText.match(/\[ID:(\d+)\]/)
        const bookingId = match ? match[1] : null
        if (!bookingId) return

        let newName = ""
        let contactPhone = ""

        if (msg.contact) {
            const firstName = msg.contact.first_name
            const lastName = msg.contact.last_name || ""
            newName = `${firstName} ${lastName}`.trim()
            contactPhone = msg.contact.phone_number || ""
        } else if (text) {
            newName = text
        }

        if (newName) {
            // 1. Fetch & Append
            const { data: current } = await supabase.from('bookings').select('assigned_to, client_name, booking_date').eq('id', bookingId).single()
            let updatedList = current?.assigned_to || ""
            
            if (!updatedList.includes(newName)) {
                updatedList = updatedList ? `${updatedList}, ${newName}` : newName
                
                await supabase.from('bookings').update({ status: 'confirmed', assigned_to: updatedList }).eq('id', bookingId)
                
                // 2. Push Notification
        if (contactPhone && current) {
            console.log(`[Assignment] Sending push to ${contactPhone} for booking ${bookingId}`);
            await sendPushToPhone(contactPhone, `You have been assigned to: ${current.client_name} on ${current.booking_date}`)

            // Update bookings with assigned phone
            const { data: booking } = await supabase.from('bookings').select('assigned_phones').eq('id', bookingId).single()
            let updatedPhones = booking?.assigned_phones || []
            if (!updatedPhones.includes(contactPhone)) {
              updatedPhones.push(contactPhone)
              await supabase.from('bookings').update({ assigned_phones: updatedPhones }).eq('id', bookingId)
            }
        }

        // 3. SEND TWO MESSAGES (Fix for missing button)
                
                // Message 1: Confirmation + DONE Button
                const doneKeyboard = {
                    inline_keyboard: [[{ text: "🏁 DONE / FINISH", callback_data: `finish_${bookingId}` }]]
                }
                await sendMessage(chatId, `✅ Added: <b>${newName}</b>`, doneKeyboard)

                // Message 2: Prompt for NEXT contact (Force Reply)
                // We keep the [ID:...] tag hidden here so the next reply works
                await sendMessage(chatId, `👇 Share next contact or click DONE above.\n\n[ID:${bookingId}]`, null, true)

            } else {
                await sendMessage(chatId, `⚠️ <b>${newName}</b> is already added.`, null, true)
            }
        }
    }

    // B. WIZARD FLOW (Manual Creation)
    else if (replyText.includes("Reply with the START DATE")) {
      if (!validateDate(text)) return sendError(chatId, "Invalid Date.", msg.message_id)
      const context = extractContext(replyText) 
      const [evt, team] = context.split('|')
      const keyboard = { inline_keyboard: [ [{ text: "Same as Start", callback_data: `new_end_same_${evt}_${team}_${text}` }], [{ text: "Select Different", callback_data: `new_end_diff_${evt}_${team}_${text}` }] ] }
      await sendMessage(chatId, `Step 4: Select <b>End Date</b>:\n\n[CTX:${context}|${text}]`, keyboard)
    }
    else if (replyText.includes("Reply with the END DATE")) {
      if (!validateDate(text)) return sendError(chatId, "Invalid Date.", msg.message_id)
      const context = extractContext(replyText)
      askForName(chatId, `${context}|${text}`)
    }
    else if (replyText.includes("Reply with CLIENT NAME")) {
      const context = extractContext(replyText)
      askForPhone(chatId, `${context}|${text}`)
    }
    else if (replyText.includes("Reply with CLIENT PHONE")) {
      const context = extractContext(replyText)
      const [evt, team, start, end, name] = context.split('|')
      const phone = text

      if (!start || !name || !phone) return sendError(chatId, "Missing data.", msg.message_id)

      const { error } = await supabase.from('bookings').insert([{
        client_name: name, client_phone: phone, booking_date: start, booking_end_date: end, event_type: evt, assigned_to: team, status: 'confirmed'
      }])

      if (error) await sendMessage(chatId, `❌ DB Error: ${error.message}`)
      else await sendMessage(chatId, `✅ <b>Booking Created!</b>\n\n👤 ${name}\n🗓 ${start}\n📸 ${evt}`)
    }
  }
}

// ------------------------------------------------------------------
// 🖱 BUTTON HANDLER (Callbacks)
// ------------------------------------------------------------------
async function handleCallback(query: any) {
  const data = query.data 
  const chatId = query.message.chat.id
  const msgId = query.message.message_id
  const parts = data.split('_')
  const action = parts[0] 

  // --- START ASSIGNMENT ---
  if (action === 'assign') {
      const bookingId = parts[1]
      await editMessage(chatId, msgId, query.message.text, undefined) // Clean up old message
      
      const keyboard = { inline_keyboard: [[{ text: "🏁 DONE / FINISH", callback_data: `finish_${bookingId}` }]] }
      
      // Start the loop
      await sendMessage(chatId, 
        `👥 <b>ASSIGNMENT MODE ACTIVE</b>\nBooking #${bookingId}\n\n1. Share <b>Contact</b> (📎)\n2. Or type Name\n3. Repeat for multiple people\n\n[ID:${bookingId}]`, 
        keyboard, true
      )
  }
  
  // --- FINISH ASSIGNMENT ---
  else if (action === 'finish') {
      const bookingId = parts[1]
      const { data: booking } = await supabase.from('bookings').select('assigned_to').eq('id', bookingId).single()
      const finalList = booking?.assigned_to || "No one assigned"
      
      // Remove the "Done" button
      await editMessage(chatId, msgId, `✅ <b>Assignments Saved</b>`, undefined)
      
      // Final confirmation
      await sendMessage(chatId, `📸 <b>Final Team for Booking #${bookingId}:</b>\n${finalList}`)
  }

  // --- REJECT ---
  else if (action === 'reject') {
      const bookingId = parts[1]
      await supabase.from('bookings').update({ status: 'rejected' }).eq('id', bookingId)
      const originalText = query.message.text.split('\n\nSelect')[0]
      await editMessage(chatId, msgId, `${originalText}\n\n🚫 <b>REJECTED</b>`, undefined)
  }

  // --- WIZARD FLOW ---
  else if (action === "new") {
    const step = parts[1]
    if (step === "evt") {
      const evtType = parts[2]
      await sendMessage(chatId, `Event: ${evtType}\n\nStep 2: Reply with the <b>PHOTOGRAPHER NAME</b> (Optional - Type 'None' to skip):\n\n[CTX:${evtType}]`, null, true)
    }
    else if (step === "end" && parts[2] === "same") {
       const [_, __, ___, evt, team, start] = parts
       askForName(chatId, `${evt}|${team}|${start}|${start}`)
    }
    else if (step === "end" && parts[2] === "diff") {
       const [_, __, ___, evt, team, start] = parts
       await sendMessage(chatId, `Start: ${start}\n\nStep 4: Reply with the <b>END DATE</b> (YYYY-MM-DD):\n\n[CTX:${evt}|${team}|${start}]`, null, true)
    }
  }

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: query.id })
  })
}

// ------------------------------------------------------------------
// 🚀 PUSH NOTIFICATION (FCM V1 API)
// ------------------------------------------------------------------
async function getAccessToken() {
  try {
    // Import the private key
    const pem = serviceAccount.private_key;
    const binaryKey = Uint8Array.from(
      atob(pem.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, "")),
      (c) => c.charCodeAt(0)
    );
    
    const key = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const jwt = await create(
      { alg: "RS256", typ: "JWT" },
      {
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      key
    );

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const data = await res.json();
    return data.access_token;
  } catch (err) {
    console.error("Error generating Access Token:", err);
    return null;
  }
}

async function sendPushToPhone(phoneNumber: string, messageBody: string) {
    console.log(`[Push] Attempting to send push to: ${phoneNumber}`);
    
    // Get Access Token for V1 API
    const accessToken = await getAccessToken();
    if (!accessToken) {
        console.error("[Push] Failed to get FCM Access Token");
        return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    console.log(`[Push] Cleaned phone: ${cleanPhone}`);

    const { data: devices, error } = await supabase.from('team_devices').select('push_token').ilike('phone', `%${cleanPhone}`) 
    
    if (error) {
        console.error("[Push] Error fetching devices:", error);
        return;
    }

    if (!devices || devices.length === 0) {
        console.log(`[Push] No devices found for phone: ${cleanPhone}`);
        return;
    }

    console.log(`[Push] Found ${devices.length} devices. Sending...`);

    const projectId = serviceAccount.project_id;

    const promises = devices.map(async d => {
        try {
            const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${accessToken}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    message: {
                        token: d.push_token,
                        notification: {
                            title: "📅 New Assignment",
                            body: messageBody
                        },
                        webpush: {
                          fcm_options: {
                            link: "https://candy-pic.vercel.app/calendar"
                          },
                          notification: {
                            icon: "https://candy-pic.vercel.app/logo-nonsquare.png"
                          }
                        }
                    }
                })
            });
            const text = await res.text();
            console.log(`[Push] FCM Response for ${d.push_token.slice(0, 10)}...: ${res.status} - ${text}`);
            return text;
        } catch (e) {
            console.error(`[Push] Fetch error for ${d.push_token.slice(0, 10)}...:`, e);
            return null;
        }
    });
    await Promise.all(promises);
}

// ------------------------------------------------------------------
// UTILS
// ------------------------------------------------------------------
async function handleCalendarCommand(chatId: number) {
    const today = new Date().toISOString().split('T')[0]
    const { data: bookings } = await supabase.from('bookings').select('*').eq('status', 'confirmed').gte('booking_date', today).order('booking_date').limit(10)
    let msg = "<b>📅 UPCOMING SCHEDULE</b>\n\n"
    if (!bookings || bookings.length === 0) msg += "<i>No upcoming bookings.</i>"
    else {
        bookings.forEach(b => {
            const assignee = b.assigned_to || "Unassigned"
            msg += `🗓 <code>${b.booking_date}</code>\n👤 ${b.client_name} → <b>${assignee}</b>\n──────────────\n`
        })
    }
    await sendMessage(chatId, msg)
}

function askForName(chatId: number, ctx: string) { sendMessage(chatId, `Step 5: Reply with <b>CLIENT NAME</b>:\n\n[CTX:${ctx}]`, null, true) }
function askForPhone(chatId: number, ctx: string) { sendMessage(chatId, `Step 6: Reply with <b>PHONE</b>:\n\n[CTX:${ctx}]`, null, true) }
function validateDate(d: string) { return /^\d{4}-\d{2}-\d{2}$/.test(d) }
function extractContext(t: string) { return (t.match(/\[CTX:(.*?)\]/) || [])[1] || "" }

async function sendMessage(chatId: string | number, text: string, markup?: any, forceReply = false, replyToMsgId?: number) {
    const body: any = { chat_id: chatId, text: text, parse_mode: 'HTML' }
    if (markup) body.reply_markup = markup
    if (forceReply) body.reply_markup = { force_reply: true, input_field_placeholder: "Type here..." }
    if (replyToMsgId) body.reply_to_message_id = replyToMsgId

    console.log("📤 Sending to Telegram:", JSON.stringify(body)) // Log what we send

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    const result = await res.json()
    
    // CRITICAL: Log the result from Telegram
    console.log("📥 Telegram Response:", JSON.stringify(result))

    if (!result.ok) {
        // Throw error so it shows up as 500 in logs
        throw new Error(`Telegram API Error: ${result.description}`)
    }
}

async function editMessage(chatId: string|number, msgId: number, text: string, markup?: any) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ chat_id: chatId, message_id: msgId, text, parse_mode: 'HTML', reply_markup: markup }) })
}

async function sendError(chatId: number, text: string, replyToMsgId: number) { await sendMessage(chatId, `⚠️ ${text}`, null, true) }

// ------------------------------------------------------------------
// 🔔 BOOKING UPDATE HANDLER (Push + Pending)
// ------------------------------------------------------------------
async function handleBookingUpdate(req: Request) {
    try {
        const payload = await req.json()
        const booking = payload.record
        
        // If no assigned phones, nothing to do
        if (!booking || !booking.assigned_phones || booking.assigned_phones.length === 0) {
            console.log("No assigned phones for booking", booking?.id)
            return new Response('No phones assigned', { status: 200 })
        }

        console.log(`[BookingUpdate] Processing ${booking.assigned_phones.length} phones for booking ${booking.id}`)

        const messageBody = `You have been assigned to: ${booking.client_name} on ${booking.booking_date}`;
        
        for (const phone of booking.assigned_phones) {
            const cleanPhone = phone.replace(/\D/g, '').slice(-10);
            
            // Check if device exists
            const { data: devices } = await supabase.from('team_devices').select('id').ilike('phone', `%${cleanPhone}`)
            
            if (devices && devices.length > 0) {
                // Device exists -> Send Push
                console.log(`[BookingUpdate] Device found for ${cleanPhone}, sending push.`)
                await sendPushToPhone(phone, messageBody) 
            } else {
                // Device missing -> Store Pending
                console.log(`[BookingUpdate] No device for ${cleanPhone}, storing pending notification.`)
                await supabase.from('pending_notifications').insert({
                    phone: phone,
                    title: "📅 New Assignment",
                    body: messageBody,
                    booking_id: booking.id,
                    status: 'pending'
                })
            }
        }
        return new Response('Processed Booking Update', { status: 200 })
    } catch (e) {
        console.error("BookingUpdate Error:", e)
        return new Response(String(e), { status: 500 })
    }
}

// ------------------------------------------------------------------
// 📲 DEVICE REGISTRATION HANDLER (Flush Pending)
// ------------------------------------------------------------------
async function handleDeviceRegister(req: Request) {
    try {
        const payload = await req.json()
        const device = payload.record
        if (!device || !device.phone) return new Response('Invalid Record', { status: 400 })

        const cleanPhone = device.phone.replace(/\D/g, '').slice(-10);
        console.log(`[DeviceRegister] Checking pending notifications for ${cleanPhone}`)

        // Fetch all pending notifications
        // Note: We fetch all pending because we need to fuzzy match the phone number
        // Optimization: In a large system, we would store clean_phone column.
        const { data: pendings } = await supabase.from('pending_notifications')
            .select('*')
            .eq('status', 'pending')
        
        if (!pendings || pendings.length === 0) {
             return new Response('No pending notifications', { status: 200 })
        }

        const matches = pendings.filter((n: any) => n.phone.replace(/\D/g, '').slice(-10) === cleanPhone);
        
        console.log(`[DeviceRegister] Found ${matches.length} pending notifications.`)

        for (const notif of matches) {
            await sendPushToPhone(device.phone, notif.body);
            await supabase.from('pending_notifications').update({ status: 'sent' }).eq('id', notif.id);
        }

        return new Response(`Flushed ${matches.length} notifications`, { status: 200 })
    } catch (e) {
        console.error("DeviceRegister Error:", e)
        return new Response(String(e), { status: 500 })
    }
}
