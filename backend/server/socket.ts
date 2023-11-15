import app from "./app";
import { Server } from "socket.io";
import server from "./server";
import sessionMiddleware from "./user_session";
import {
  create_launch,
  mint_tokens,
  create_token,
} from "../controllers_io/io_launch";

const originList: string[] = [process.env.CLIENT_URL || ""];

const io: Server = new Server(server, {
  cors: {
    origin: originList,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // count number of sockets connected
  console.log(io.engine.clientsCount);

  console.log("User connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("/api/create-launch", (data) => {
    create_launch(socket, data);
  });

  socket.on("/api/launch/mint", (data) => {
    mint_tokens(socket, data);
  });

  socket.on("/api/token/create", (data) => {
    create_token(socket, data);
  });
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// add io instance to req object
app.use((req, res, next) => {
  req.io = io;
  next();
});
