import express from "express";
import { login_user } from "../controllers/controller_auth";

const router = express.Router();

// @route POST api/auth/login
// @desc Login or register a user
// @access Public
router.post("/login", login_user);

export default router;
