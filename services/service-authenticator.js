require('dotenv').config();
const {google} = require('googleapis');

const OAuth2Client = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET, process.env.GMAIL_REDIRECT_URL);
OAuth2Client.setCredentials({refresh_token: process.env.GMAIL_REFRESH_TOKEN});

exports.getAccessToken = async () => {
  try {
    return await OAuth2Client.getAccessToken();
  } catch (e) {
    console.log(e);
  }
}