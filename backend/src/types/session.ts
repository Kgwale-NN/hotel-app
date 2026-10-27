import "express-session";

declare module "express-session" {
  interface SessionData {
    googleAuth?: {
      state: string;
      nonce: string;
      codeVerifier: string;
      createdAt: number;
    };
  }
}