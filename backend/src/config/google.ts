import "dotenv/config";
import { OAuth2Client } from "google-auth-library";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_CALLBACK_URL;

if (!clientId || !clientSecret || !redirectUri) {
  throw new Error("Google OAuth environment variables are missing.");
}

export const googleClientId = clientId;

export const googleClient = new OAuth2Client({
  clientId,
  clientSecret,
  redirectUri,
});