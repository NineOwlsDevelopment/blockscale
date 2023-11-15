import app from "./app";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import sessionMiddleware from "./user_session";

const server = app;

server.use(
  cors({
    origin: [
      process.env.CLIENT_URL ||
        "http://127.0.0.1:3000" ||
        "http://localhost:3000" ||
        "http://localhost:80" ||
        "http://127.0.0.1:80",
    ],
    credentials: true,
  })
);
server.use(sessionMiddleware);
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json({ limit: "10mb" }));
server.use(cookieParser());
server.use(express.json());

export default server;
