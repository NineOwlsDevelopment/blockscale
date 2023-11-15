import app from "./app";
import express from "express";
import http from "http";
import path from "path";

const server = http.createServer(app);

// Redirect http to https and remove www from URL (for production)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    // Redirect http to https
    if (req.header("x-forwarded-proto") !== "https") {
      return res.redirect(`https://${req.header("host")}${req.url}`);
    }

    // Replace www with non-www
    if (req.header("host")?.startsWith("www.")) {
      return res.redirect(
        301,
        `https://${req.header("host")?.replace("www.", "")}${req.url}`
      );
    }

    next();
  });
}

// Point the server to the build folder of the app
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../client/build")));

  app.get("*", (_, res) => {
    res.sendFile(
      path.resolve(__dirname, "../../client", "build", "index.html")
    );
  });
}

export default server;
