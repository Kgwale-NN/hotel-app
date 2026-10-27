import "../types/session";
import { createHash, randomBytes } from "node:crypto";
import { Request, Response } from "express";
import {
  googleClient,
  googleClientId,
} from "../config/google";
import pool from "../config/db";
import { findOrCreateGoogleUser } from "../services/auth.service";

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

    const userId = await findOrCreateGoogleUser({
      providerUserId: profile.sub,
      email: profile.email,
      fullName:
        profile.name?.trim().slice(0, 150) || "Hotel Haven Guest",
      avatarUrl: profile.picture ?? null,
    });

    // Replace the pre-login session ID after successful authentication.
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    req.session.userId = userId;

    await new Promise<void>((resolve, reject) => {
      req.session.save((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.redirect("/api/auth/me");

  } catch {
    console.error("Google identity verification failed.");

    res.status(401).json({
      message: "Google sign-in failed. Please start again.",
    });
  }
}

export async function getCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({
      message: "You must sign in first.",
    });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        email,
        full_name,
        phone,
        avatar_url,
        role,
        created_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      req.session.destroy(() => {
        res.clearCookie("hotel_haven.sid", { path: "/" });

        res.status(401).json({
          message: "Your account is unavailable. Please sign in again.",
        });
      });
      return;
    }

    res.status(200).json({
      data: result.rows[0],
    });
  } catch {
    console.error("Unable to retrieve the current user.");

    res.status(500).json({
      message: "Unable to retrieve your account.",
    });
  }
}