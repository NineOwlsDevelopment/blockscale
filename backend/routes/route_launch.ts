import express from "express";
import {
  get_launches,
  get_launch_by_id,
  query_launches,
} from "../controllers/controller_launch";

const router = express.Router();

// @route GET api/launches/
// @desc Get all launches
// @access Public
router.get("/", get_launches);

// @route GET api/launches/:id
// @desc Get a launch by id
// @access Public
router.get("/:id", get_launch_by_id);

// @route GET api/launches/query
// @desc Get a launch by value
// @access Public
router.post("/query", query_launches);

export default router;
