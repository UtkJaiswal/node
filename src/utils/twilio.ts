import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const accountSid: string = process.env.TWILIO_ACCOUNT_SID!;
const authToken: string = process.env.TWILIO_AUTH_TOKEN!;
const serviceSid: string = process.env.TWILIO_VERIFICATION_SERVICE_SID!;

const client = twilio(accountSid, authToken);

export const sendVerificationCode = async (phoneNumber: string): Promise<string | void> => {
    try {
      const verification = await client.verify.services(serviceSid)
        .verifications
        .create({ to: phoneNumber, channel: 'sms' });
  
      console.log(`Verification sid: ${verification.sid}`);
      return verification.sid;
    } catch (err) {
      console.error("Error sending verification code", err);
    }
}

export const verifyCode = async (phoneNumber: string, code: string): Promise<boolean | undefined> => {
    try {
        const verification = await client.verify.services(serviceSid)
        .verificationChecks
        .create({ to: phoneNumber, code });

        return verification.valid;
    } catch (err) {
        console.error("Error verifying code", err);
    }
}