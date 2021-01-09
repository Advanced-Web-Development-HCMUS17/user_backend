require('dotenv').config();
const Authenticator = require('./service-authenticator');
const nodemailer = require('nodemailer');

exports.send = async (targetEmail, subject, content) => {
  try {
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_SERVER_ADDRESS,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: await Authenticator.getAccessToken(),
      }
    });
    const mailOptions = {
      from: `Customer Service <${process.env.GMAIL_SERVER_ADDRESS}>`,
      to: `${targetEmail}`,
      subject: `${subject}`,
      html: `${content}`,
    };
    return await transport.sendMail(mailOptions);
  } catch (e) {
    console.log(e);
  }
  return null;
}
