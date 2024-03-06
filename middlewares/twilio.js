const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const twilioPhoneNumber = process.env.twilioPhoneNumber;

const client = require("twilio")(accountSid, authToken);

const sendSMS = async (number, otp) => {
  try {
    const message = `Your OTP verification code is ${otp}`;
    const response = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: `+91${number}`,
    });
    console.log(`Message sent. SID: ${response.sid}`);

    return otp;
  } catch (error) {
    console.error(`Error sending SMS: ${error.message}`);
  }
};

module.exports = {
  sendSMS,
};
