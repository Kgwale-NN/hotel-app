import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;

    googleAuth?: {
      state: string;
      nonce: string;
      codeVerifier: string;
      createdAt: number;
    };
  }
}