import express from "express";
import "express-session";

declare global {
  namespace Express {
    interface Request {
      user?: Record<string, any>;
      io?: any;
      file?: any;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    user: string;
    address: string;
  }
}
