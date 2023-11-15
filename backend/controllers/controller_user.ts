import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User";

// @route GET api/users/
// @desc get current user
// @access Private
export const get_current_user = async (req: Request, res: Response) => {
  try {
    const user = await User.find_by_id(req.session.user as string);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send(user);
  } catch (error: any) {
    return res.status(500).send({ error: error.message });
  }
};

// @route GET api/users/:id
// @desc get a user by id
// @access Public
export const get_user = async (req: Request, res: Response) => {
  try {
    const user = await User.find_by_id(req.params.id);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send(user);
  } catch (error: any) {
    return res.status(500).send({ error: error.message });
  }
};

// @route DELETE api/users/
// @desc Delete a user
// @access Private
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { passcode } = req.body;

    if (passcode !== process.env.PASSCODE) {
      return res.status(401).send({ error: "Unauthorized." });
    }

    const user = "";
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).send({ error: error.message });
  }
};
