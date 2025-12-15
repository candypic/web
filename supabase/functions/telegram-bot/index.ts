import { serve } from "std/http/server.ts"
import { createClient } from '@supabase/supabase-js'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ---------------------------------------------------------
// ⚙️ CONFIGURATION
// ---------------------------------------------------------
const TEAM_MEMBERS = [
  { name: "Prajnan", id: "@S164527" },
  { name: "Chandan", id: "Chandan" },
  { name: "Rahul", id: "Rahul" }
];

const EVENT_TYPES = [
  "Wedding", "Pre-Wedding", "Engagement", "Haldi", "Maternity", "Baby Shoot", "Other"
];
// ---------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  const url = new URL(req.url)

  // 1. DATABASE TRIGGER (New Website Enquiry)
  if (req.method === 'POST' && url.searchParams.get('type') === 'notify') {
    return handleDatabaseNotification(req)
  }

  // 2. TELEGRAM INTERACTION
  try {
    const update = await req.json()

    if (update.callback_query) {
      await handleCallback(update.callback_query)
    } else if (update.message && update.message.text) {
      await handleMessage(update.message)
    }

  } catch (err) {
    console.error(err)
  }

  return new Response('OK', { status: 200 })
})

// ------------------------------------------------------------------
// 🔔 DATABASE NOTIFICATION HANDLER (Modified for Custom vs Full)
// ------------------------------------------------------------------
async function handleDatabaseNotification(req: Request) {
    try {
      const payload = await req.json()
      const booking = payload.record
      if (!booking) return new Response('No record', { status: 400 })

      // Check Clashes (Exclude self)
      const { data: clashData } = await supabase
          .from('bookings')
          .select('client_name, assigned_to')
          .eq('booking_date', booking.booking_date)
          .eq('status', 'confirmed')
          .neq('id', booking.id) // Exclude current booking
          .maybeSingle()

      // --- DETERMINE MESSAGE STYLE ---
      const eventType = booking.event_type || "General Inquiry";
      let header = "<b>✨ NEW ENQUIRY ✨</b>";
      let icon = "📷";
      
      // 1. FULL PACKAGE
      if (eventType.includes("Full Wedding Collection")) {
          header = "<b>💎 PREMIUM PACKAGE BOOKING 💎</b>";
          icon = "💍";
      } 
      // 2. CUSTOM REQUEST
      else if (eventType.includes("Custom")) {
          header = "<b>🛠 CUSTOM QUOTE REQUEST 🛠</b>";
          icon = "📝";
      }

      // --- BUILD MESSAGE ---
      let message = `${header}\n`
      
      if (clashData) {
          const assignee = clashData.assigned_to ? clashData.assigned_to : "Unassigned"
          message += `\n🚨 <b>CLASH ALERT:</b> Date booked for ${clashData.client_name} (${assignee}).\n`
      }
      
      message += `\n👤 <b>Client:</b> ${booking.client_name}`
      if (booking.client_phone) {
          const formattedPhone = formatPhoneForDisplay(booking.client_phone);
          message += `\n📞 <b>Phone:</b> <code>${formattedPhone}</code>`
      }
      message += `\n🗓 <b>Date:</b> ${booking.booking_date}`
      if (booking.booking_end_date && booking.booking_end_date !== booking.booking_date) {
        message += ` to ${booking.booking_end_date}`
      }

      // Show Assigned To
      if (booking.assigned_to) {
          message += `\n\n📸 <b>Assigned Team:</b>\n${booking.assigned_to.split(', ').map((a: string) => `• ${a}`).join('\n')}`
      }

      // Show Additional Info
      // Show Additional Info (Custom Quote Details)
      if (booking.additional_info && eventType.includes("Custom")) {
          message += `\n\n${icon} <b>Selected Items:</b>\n${booking.additional_info}\n\n<b>Total: ${eventType.match(/\(Total:.*?₹.*?\)/g) || ''}</b>`
      } else if (booking.additional_info) {
           message += `\n\n📝 <b>Notes:</b>\n<i>${booking.additional_info}</i>`
      }
      
      // Show specific details for Full Package (if no custom info)
      else if (eventType && eventType !== "General Inquiry") {
        message += `\n\n${icon} <b>Request:</b> ${eventType}`
      }

      // Only show action buttons if NO TEAM is assigned yet
      if (!booking.assigned_to) {
          message += `\n\n<i>Select an action below:</i>`
          const keyboard = {
            inline_keyboard: [[ { text: "✅ Approve / Assign", callback_data: `menu_${booking.id}` }, { text: "❌ Reject", callback_data: `reject_${booking.id}` } ]]
          }
          await sendMessage(CHAT_ID, message, keyboard)
      } else {
          // If already assigned, just send the notification without buttons
          await sendMessage(CHAT_ID, message)
      }
      return new Response('Notification Sent', { status: 200 })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      return new Response(JSON.stringify({ error: errorMessage }), { status: 500 })
    }
}

// ------------------------------------------------------------------
// 📩 MESSAGE HANDLER (Text Inputs)
// ------------------------------------------------------------------
async function handleMessage(msg: { text: string; chat: { id: number }; reply_to_message?: { text: string }; message_id: number }) {
  const text = msg.text
  const chatId = msg.chat.id

  // --- COMMAND: /create_booking ---
  if (text === '/create_booking') {
    const keyboard = {
      inline_keyboard: EVENT_TYPES.map(type => [{ text: type, callback_data: `new_evt_${type}` }])
    }
    await sendMessage(chatId, "🛠 <b>Create New Booking</b>\n\nStep 1: Select <b>Event Type</b>:", keyboard)
    return
  }

  // --- COMMAND: /calendar ---
  if (text === '/calendar') {
    await handleCalendarCommand(chatId)
    return
  }

  // --- WIZARD FLOW (REPLIES) ---
  if (msg.reply_to_message) {
    const replyText = msg.reply_to_message.text
    
    // 1. START DATE -> END DATE
    if (replyText.includes("Reply with the START DATE")) {
      if (!validateDate(text)) return sendError(chatId, "Invalid Date. Use YYYY-MM-DD.", msg.message_id)

      const context = extractContext(replyText) 
      const [evt, team] = context.split('|')

      const keyboard = {
        inline_keyboard: [
          [{ text: "Same as Start Date", callback_data: `new_end_same_${evt}_${team}_${text}` }],
          [{ text: "Select Different Date", callback_data: `new_end_diff_${evt}_${team}_${text}` }]
        ]
      }
      await sendMessage(chatId, `Step 4: Select <b>End Date</b> logic:\n\n[CTX:${context}|${text}]`, keyboard)
    }

    // 2. END DATE -> NAME
    else if (replyText.includes("Reply with the END DATE")) {
      if (!validateDate(text)) return sendError(chatId, "Invalid Date. Use YYYY-MM-DD.", msg.message_id)
      const context = extractContext(replyText)
      askForName(chatId, `${context}|${text}`)
    }

    // 3. NAME -> PHONE
    else if (replyText.includes("Reply with CLIENT NAME")) {
      const context = extractContext(replyText)
      askForPhone(chatId, `${context}|${text}`)
    }

    // 4. PHONE -> SAVE
    else if (replyText.includes("Reply with CLIENT PHONE")) {
      const context = extractContext(replyText)
      const [evt, team, start, end, name] = context.split('|')
      const phone = text

      if (!start || !name || !phone) {
         return sendError(chatId, "Missing data. Please restart /create_booking", msg.message_id)
      }

      const { error } = await supabase.from('bookings').insert([{
        client_name: name,
        client_phone: phone,
        booking_date: start,
        booking_end_date: end,
        event_type: evt,
        assigned_to: team,
        status: 'confirmed'
      }])

      if (error) {
        await sendMessage(chatId, `❌ Database Error: ${error.message}`)
      } else {
        await sendMessage(chatId, `✅ <b>Booking Created Successfully!</b>\n\n👤 ${name}\n📞 ${phone}\n🗓 ${start} to ${end}\n📸 ${evt} (Assigned to ${team})`)
      }
    }
  }
}

// ------------------------------------------------------------------
// 🖱 BUTTON HANDLER (Callbacks)
// ------------------------------------------------------------------
async function handleCallback(query: { id: string; data: string; message: { chat: { id: number }; message_id: number; text: string } }) {
  const data = query.data
  const chatId = query.message.chat.id
  const msgId = query.message.message_id
  
  const parts = data.split('_')
  const action = parts[0] 

  // --- WIZARD FLOW ---
  if (action === "new") {
    const step = parts[1]
    
    if (step === "evt") {
      const evtType = parts[2]
      const teamButtons = TEAM_MEMBERS.map(m => [{ text: m.name, callback_data: `new_team_${evtType}_${m.id}` }])
      await editMessage(chatId, msgId, `Event: ${evtType}\n\nStep 2: Assign <b>Team Member</b>:\n\n[CTX:${evtType}]`, { inline_keyboard: teamButtons })
    }
    else if (step === "team") {
      const evtType = parts[2]
      const teamId = parts.slice(3).join('_')
      await sendMessage(chatId, `Event: ${evtType}\nTeam: ${teamId}\n\nStep 3: Reply with the <b>START DATE</b> (YYYY-MM-DD):\n\n[CTX:${evtType}|${teamId}]`, null, true)
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

  // --- APPROVE/REJECT FLOW ---
  else if (action === 'menu') {
      const bookingId = parts[1]
      const teamButtons = TEAM_MEMBERS.map(m => ([{ text: `👤 Assign to ${m.name}`, callback_data: `set_${bookingId}_${m.id}` }]))
      teamButtons.push([{ text: "🔙 Cancel", callback_data: `cancel_${bookingId}` }])
      await editMessage(chatId, msgId, query.message.text, { inline_keyboard: teamButtons })
  }
  else if (action === 'set') {
      const bookingId = parts[1]
      const assignee = parts.slice(2).join('_')
      await supabase.from('bookings').update({ status: 'confirmed', assigned_to: assignee }).eq('id', bookingId)
      const originalText = query.message.text.split('\n\nSelect an action')[0]
      await editMessage(chatId, msgId, `${originalText}\n\n✅ <b>CONFIRMED</b>\n📸 <b>Assigned to:</b> ${assignee}`, undefined)
  }
  else if (action === 'reject') {
      const bookingId = parts[1]
      await supabase.from('bookings').update({ status: 'rejected' }).eq('id', bookingId)
      const originalText = query.message.text.split('\n\nSelect an action')[0]
      await editMessage(chatId, msgId, `${originalText}\n\n🚫 <b>REJECTED</b>`, undefined)
  }
  else if (action === 'cancel') {
     const bookingId = parts[1]
     const keyboard = { inline_keyboard: [[ { text: "✅ Approve / Assign", callback_data: `menu_${bookingId}` }, { text: "❌ Reject", callback_data: `reject_${bookingId}` } ]] }
     await editMessage(chatId, msgId, query.message.text, keyboard)
  }

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: query.id })
  })
}

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

async function handleCalendarCommand(chatId: number) {
    const today = new Date().toISOString().split('T')[0]
    const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_date, booking_end_date, client_name, assigned_to, event_type')
        .eq('status', 'confirmed')
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .limit(10)

    let responseMsg = "<b>📅 UPCOMING SCHEDULE</b>\n\n"
    if (!bookings || bookings.length === 0) responseMsg += "<i>No upcoming confirmed bookings.</i>"
    else {
        bookings.forEach(b => {
            const assignee = b.assigned_to ? b.assigned_to : "Unassigned"
            const endTxt = b.booking_end_date && b.booking_end_date !== b.booking_date ? ` ➝ ${b.booking_end_date}` : ""
            const typeTxt = b.event_type ? `(${b.event_type})` : ""
            responseMsg += `🗓 <code>${b.booking_date}${endTxt}</code>\n`
            responseMsg += `👤 ${b.client_name} ${typeTxt} → <b>${assignee}</b>\n`
            responseMsg += `──────────────\n`
        })
    }
    
    await sendMessage(chatId, responseMsg)
}

function askForName(chatId: number, contextString: string) {
    sendMessage(chatId, `Step 5: Reply with <b>CLIENT NAME</b>:\n\n[CTX:${contextString}]`, null, true)
}

function askForPhone(chatId: number, contextString: string) {
    sendMessage(chatId, `Step 6: Reply with <b>PHONE NUMBER</b>:\n\n[CTX:${contextString}]`, null, true)
}

function validateDate(dateStr: string) { return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) }

function extractContext(text: string) {
    const match = text.match(/\[CTX:(.*?)\]/)
    return match ? match[1] : ""
}

async function sendMessage(chatId: string | number, text: string, markup?: unknown, forceReply = false, replyToMsgId?: number) {
    const body: Record<string, unknown> = { chat_id: chatId, text: text, parse_mode: 'HTML' }
    if (markup) body.reply_markup = markup
    if (forceReply) body.reply_markup = { force_reply: true, input_field_placeholder: "Type here..." }
    if (replyToMsgId) body.reply_to_message_id = replyToMsgId

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
}

function formatPhoneForDisplay(phone: string) {
    // 1. Remove all whitespace
    let clean = phone.replace(/\s+/g, '');
    
    // 2. Check for +91 prefix
    if (!clean.startsWith('+91')) {
        // If it starts with 91 but no plus, add plus (optional, but safer)
        if (clean.startsWith('91') && clean.length > 10) {
             clean = '+' + clean;
        } else {
             clean = '+91' + clean;
        }
    }
    return clean;
}

async function sendError(chatId: number, text: string, replyToMsgId: number) {
    await sendMessage(chatId, `⚠️ ${text}`, null, true, replyToMsgId)
}

async function editMessage(chatId: string | number, msgId: number, text: string, markup?: unknown) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: msgId, text: text, parse_mode: 'HTML', reply_markup: markup })
    })
}