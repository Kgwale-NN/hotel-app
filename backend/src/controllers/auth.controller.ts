import "../types/session";
import { createHash, randomBytes } from "node:crypto";
import { Request, Response } from "express";
import {
  googleClient,
  googleClientId,
} from "../config/google";

export async function startGoogleLogin(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const state = randomBytes(32).toString("hex");
    const nonce = randomBytes(32).toString("hex");
    const codeVerifier = randomBytes(32).toString("base64url");

    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    req.session.googleAuth = {
      state,
      nonce,
      codeVerifier,
      createdAt: Date.now(),
    };

    const url = new URL(
      googleClient.generateAuthUrl({
        scope: ["openid", "email", "profile"],
        state,
        prompt: "select_account",
      })
    );

    url.searchParams.set("nonce", nonce);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");

    await new Promise<void>((resolve, reject) => {
      req.session.save((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.redirect(url.toString());
  } catch {
    console.error("Unable to start Google sign-in.");

    res.status(500).json({
      message: "Unable to start Google sign-in. Please try again.",
    });
  }
}

export async function googleCallback(
  req: Request,
  res: Response
): Promise<void> {
  const attempt = req.session.googleAuth;
  const { code, state, error: googleError } = req.query;

  if (
    !attempt ||
    typeof state !== "string" ||
    state !== attempt.state ||
    Date.now() - attempt.createdAt > 10 * 60 * 1000
  ) {
    res.status(400).json({
      message: "Invalid or expired sign-in request. Please start again.",
    });
    return;
  }

  try {
    // Consume the attempt before exchanging the authorization code.
    delete req.session.googleAuth;

    await new Promise<void>((resolve, reject) => {
      req.session.save((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    if (googleError) {
      res.status(400).json({
        message: "Google sign-in was not completed.",
      });
      return;
    }

    if (typeof code !== "string") {
      res.status(400).json({
        message: "The Google authorization code is missing.",
      });
      return;
    }

    const { tokens } = await googleClient.getToken({
      code,
      codeVerifier: attempt.codeVerifier,
    });

    if (!tokens.id_token) {
      throw new Error("Missing ID token.");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleClientId,
    });

    const profile = ticket.getPayload();

    if (
      !profile ||
      !profile.sub ||
      !profile.email ||
      profile.email_verified !== true ||
      !("nonce" in profile) ||
      profile.nonce !== attempt.nonce
    ) {
      throw new Error("Invalid Google identity.");
    }

    // Temporary response while we verify the Google integration.
    // Database account creation comes in the next section.
    res.status(200).json({
      message: "Google identity verified successfully.",
      data: {
        name: profile.name ?? "",
        email: profile.email,
      },
    });
  } catch {
    console.error("Google identity verification failed.");

    res.status(401).json({
      message: "Google sign-in failed. Please start again.",
    });
  }
}