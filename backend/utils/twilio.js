import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export async function sendSMS({ to, body }) {
  if (!client) {
    console.log(`📱 [MOCK SMS DISPATCH] (TWILIO credentials missing)`);
    console.log(`-----------------------------------------------`);
    console.log(`To: ${to}`);
    console.log(`Body: ${body}`);
    console.log(`-----------------------------------------------`);
    return { success: true, message: "Mock SMS logged successfully" };
  }

  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    console.log(`📱 Twilio SMS dispatched to ${to} successfully:`, message.sid);
    return { success: true, data: message };
  } catch (error) {
    console.error(`📱 Twilio SMS dispatch to ${to} failed:`, error);
    return { success: false, error: error.message };
  }
}
