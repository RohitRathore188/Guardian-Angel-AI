import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log(`✉️ [MOCK EMAIL DISPATCH] (RESEND_API_KEY missing)`);
    console.log(`-----------------------------------------------`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log(`-----------------------------------------------`);
    return { success: true, message: "Mock email logged successfully" };
  }

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject,
      html,
    });
    console.log(`✉️ Resend email dispatched to ${to} successfully:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`✉️ Resend email dispatch to ${to} failed:`, error);
    return { success: false, error: error.message };
  }
}
