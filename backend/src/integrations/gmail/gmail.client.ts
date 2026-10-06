 import { google } from "googleapis";


 export const gmailAuthClient = new google.auth.OAuth2(
    process.env.BOSSY_CLIENT_ID,
    process.env.BOSSY_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI

 );