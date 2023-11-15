import app from "./app";
import ExpressRateLimit from "express-rate-limit";
import route_auth from "../routes/route_auth";
import route_user from "../routes/route_user";
import route_launch from "../routes/route_launch";

const rateLimiter = ExpressRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
});

app.use("/api/auth", rateLimiter, route_auth);
app.use("/api/users", rateLimiter, route_user);
app.use("/api/launches", rateLimiter, route_launch);
