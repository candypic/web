// supabase/functions/telegram-bot/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ---------------- CONFIGURATION ----------------
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

serve(async (req) => {
  const url = new URL(req.url)

  // ==================================================================
  // CASE 1: NOTIFY (Triggered by Database Webhook on new INSERT)
  // ==================================================================
  if (req.method === 'POST' && url.searchParams.get('type') === 'notify') {
    const payload = await req.json()
    const booking = payload.record 

    if (!booking) return new Response('No record', { status: 400 })

    // 1. CHECK FOR CLASHES
    // We look for ANY other booking on this date that is 'confirmed'
    const { data: clashData } = await supabase
      .from('bookings')
      .select('id, client_name')
      .eq('booking_date', booking.booking_date)
      .eq('status', 'confirmed')
      .maybeSingle()

    const hasClash = !!clashData

    // 2. PREPARE MESSAGE
    let message = `📸 *New Booking Enquiry!*`
    
    if (hasClash) {
      message += `\n\n⚠️ *WARNING: DATE CLASH DETECTED!*`
      message += `\nAlready booked for: ${clashData.client_name}`
    }

    message += `\n\n👤 *Name:* ${booking.client_name}`
    message += `\n📞 *Phone:* \`${booking.client_phone}\``
    message += `\n🗓 *Date:* ${booking.booking_date}`
    message += `\n──────────────`

    // 3. PREPARE BUTTONS
    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `approve_${booking.id}` },
          { text: "❌ Reject", callback_data: `reject_${booking.id}` }
        ]
      ]
    }

    // 4. SEND TO TELEGRAM
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    })

    return new Response('Notification Sent', { status: 200 })
  }


  // ==================================================================
  // CASE 2: HANDLE BUTTON CLICKS (Webhook from Telegram)
  // ==================================================================
  try {
    const update = await req.json()

    // Check if this is a Button Click (Callback Query)
    if (update.callback_query) {
      const query = update.callback_query
      const data = query.data // e.g., "approve_12"
      const messageId = query.message.message_id
      const chatId = query.message.chat.id

      const [action, bookingId] = data.split('_')

      // 1. UPDATE SUPABASE
      let newStatus = ''
      let responseText = ''

      if (action === 'approve') {
        newStatus = 'confirmed'
        responseText = `✅ *Booking Approved!*`
      } else if (action === 'reject') {
        newStatus = 'rejected'
        responseText = `🚫 *Booking Rejected.*`
      }

      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      // 2. EDIT THE TELEGRAM MESSAGE (Remove buttons, show result)
      if (!error) {
        // Reconstruct the message to show final status
        const originalText = query.message.text.split('──────────────')[0] // Keep original details
        const finalMessage = `${originalText}\n──────────────\n${responseText}`

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: finalMessage,
            parse_mode: 'Markdown'
          })
        })
      }

      // 3. ANSWER QUERY (Stop the button loading animation)
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: query.id,
          text: error ? "Error updating database" : "Updated successfully"
        })
      })
    }
  } catch (err) {
    console.error(err)
  }

  return new Response('OK', { status: 200 })
})