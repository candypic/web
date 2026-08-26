import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, crewName, clientName, eventType, date, slot, venue, clientPhone, link, type = "shoot-assigned" } = await req.json();

    if (!to) {
      return new Response(JSON.stringify({ error: "Missing recipient email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtppro.zoho.in";
    const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465", 10);
    const SMTP_USER = Deno.env.get("SMTP_USER") || "chandan@candypic.com";
    const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
    const SMTP_FROM = Deno.env.get("SMTP_FROM") || `Chandan Naik | Candy Pic <${SMTP_USER}>`;

    if (!SMTP_PASS) {
      console.warn("SMTP_PASS secret is not configured in Supabase. Email sending skipped.");
      return new Response(
        JSON.stringify({ success: false, message: "SMTP_PASS not configured in Supabase secrets" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const isApproval = type === "profile-approved";
    const subject = isApproval
      ? `🎉 Welcome to Candy Pic Crew — Profile Approved!`
      : `📸 New Shoot Assignment: ${eventType || "Wedding Shoot"} on ${date || "Upcoming Date"}`;

    const portalUrl = link || `https://www.candypic.com/crew/calendar?email=${encodeURIComponent(to)}`;

    const html = isApproval
      ? `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0b1f24; color: #f5f5f5; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #0f2c33; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="background: linear-gradient(135deg, #133942 0%, #0b1f24 100%); padding: 30px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
              <h1 style="color: #d4af37; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">CANDY PIC</h1>
              <p style="color: #a0aec0; margin: 6px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px;">Studio Crew Portal</p>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">🎉 Profile Approved!</h2>
              <p style="color: #cbd5e0; line-height: 1.6; font-size: 14px;">
                Hi <strong>${crewName || "Team Member"}</strong>,<br><br>
                Chandan has reviewed and approved your crew profile. You are now officially on the Candy Pic studio roster.
              </p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="${portalUrl}" style="background: #d4af37; color: #0b1f24; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">
                  Open Crew Schedule →
                </a>
              </div>
              <p style="color: #718096; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
                Tapping the button above will automatically log you into your private Crew Calendar with zero hassle.
              </p>
            </div>
          </div>
        </div>
      `
      : `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0b1f24; color: #f5f5f5; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #0f2c33; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="background: linear-gradient(135deg, #133942 0%, #0b1f24 100%); padding: 30px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
              <h1 style="color: #d4af37; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">CANDY PIC</h1>
              <p style="color: #a0aec0; margin: 6px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px;">Shoot Assignment Itinerary</p>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Hi ${crewName || "Photographer"},</h2>
              <p style="color: #cbd5e0; font-size: 14px; margin-bottom: 20px;">
                You have been assigned by Chandan Naik to an upcoming photoshoot:
              </p>
              
              <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 8px 0; color: #d4af37; font-weight: 600; width: 120px;">💍 Event Type:</td>
                    <td style="padding: 8px 0; color: #ffffff;">${eventType || "Wedding Photography"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #d4af37; font-weight: 600;">👥 Couple / Client:</td>
                    <td style="padding: 8px 0; color: #ffffff; font-weight: 600;">${clientName || "Client"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #d4af37; font-weight: 600;">📅 Date:</td>
                    <td style="padding: 8px 0; color: #ffffff;">${date || "TBD"}</td>
                  </tr>
                  ${slot ? `<tr><td style="padding: 8px 0; color: #d4af37; font-weight: 600;">⏰ Slot:</td><td style="padding: 8px 0; color: #ffffff;">${slot}</td></tr>` : ""}
                  ${venue ? `<tr><td style="padding: 8px 0; color: #d4af37; font-weight: 600;">📍 Venue:</td><td style="padding: 8px 0; color: #ffffff;">${venue}</td></tr>` : ""}
                  ${clientPhone ? `<tr><td style="padding: 8px 0; color: #d4af37; font-weight: 600;">📞 Client Phone:</td><td style="padding: 8px 0; color: #ffffff;">${clientPhone}</td></tr>` : ""}
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${portalUrl}" style="background: #d4af37; color: #0b1f24; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; display: inline-block;">
                  View Shoot Brief in Portal →
                </a>
              </div>

              <p style="color: #718096; font-size: 11px; text-align: center; margin: 20px 0 0;">
                Candy Pic Kumta • Contact: +91 97431 74487 • chandan@candypic.com
              </p>
            </div>
          </div>
        </div>
      `;

    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log(`[CandyPic Email] ✅ Email sent successfully to ${to}`);

    return new Response(JSON.stringify({ success: true, message: `Email delivered to ${to}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CandyPic Email] ❌ SMTP Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
