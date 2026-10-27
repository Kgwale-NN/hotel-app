import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    csrfToken?: string;

    googleAuth?: {
      state: string;
      nonce: string;
      codeVerifier: string;
      createdAt: number;
    };
  }
}