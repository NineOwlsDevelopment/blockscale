import express from "express";
import { get_current_user } from "../controllers/controller_user";

const router = express.Router();

// @route POST api/users/
// @desc get current user
// @access Private
router.get("/", get_current_user);

export default router;
