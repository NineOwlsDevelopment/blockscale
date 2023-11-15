import dotenv from "dotenv";
dotenv.config();
import "./server/middleware";
import "./server/routes";
import "./server/socket";
import server from "./server/server";

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
