import "dotenv/config";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pool from "./db";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET must be configured with at least 32 characters."
  );
}

const PgSessionStore = connectPgSimple(session);

export const sessionMiddleware = session({
  name: "hotel_haven.sid",

  store: new PgSessionStore({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: false,
  }),

  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
});