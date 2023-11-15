import app from "./app";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import prisma_client from "../utils/prisma_client";

const sessionMiddleware: any = session({
  store: new PrismaSessionStore(prisma_client, {
    checkPeriod: 2 * 60 * 1000, //ms
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
  }),
  secret: process.env.SESSION_SECRET || "dev",
  name: "sid",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: true, // Restrict access to cookies via JavaScript
    sameSite: "strict", // Protect against CSRF attacks
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  },
});

export default sessionMiddleware;
