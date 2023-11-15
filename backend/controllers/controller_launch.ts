import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import prisma_client from "../utils/prisma_client";
import { v4 as uuidv4 } from "uuid";
import { upload_to_s3, parse_image } from "../utils/utils_aws";
import Launch from "../models/Launch";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// @route GET api/launches/
// @desc Get all launches
// @access Public
export const get_launches = async (req: Request, res: Response) => {
  try {
    const page: any = Number(req.query.page) || 1;
    const limit: any = Number(req.query.limit) || 6;

    const launches = await Launch.get_all_launches(page, limit);

    return res.status(200).send(launches);
  } catch (error: any) {
    console.log(error);
    return res.status(500).send({ error: error.message });
  }
};

// @route GET api/launches/:id
// @desc Get a launch by id
// @access Public
export const get_launch_by_id = async (req: Request, res: Response) => {
  try {
    const launch = await Launch.find_by_id(req.params.id);

    if (!launch) {
      return res.status(404).send({ error: "Launch not found." });
    }

    return res.status(200).send(launch);
  } catch (error: any) {
    return res.status(500).send({ error: error.message });
  }
};

// @route POST api/launches/query/
// @desc Get a launch by value
// @access Public
export const query_launches = async (req: Request, res: Response) => {
  try {
    const launches = await Launch.find_by_value(req.body.value);

    if (!launches) {
      return res.status(404).send({ error: "Launches not found." });
    }

    return res.status(200).send(launches);
  } catch (error: any) {
    return res.status(500).send({ error: error.message });
  }
};

// @route PUT api/launches/:id
// @desc Update a launch
// @access Private
export const update_launch = async (req: Request, res: Response) => {
  try {
    const prisma_client = new PrismaClient();
    const id = req.params.id;

    const data = {
      price: req.body.price,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      project_id: req.body.project_id,
    };

    const launch = await prisma_client.launch.update({
      where: {
        id: id,
      },
      data: data,
    });

    return res.status(200).send(launch);
  } catch (error: any) {
    return res.status(500).send({ error: error.message });
  }
};

// @route DELETE api/launches/:id
// @desc Delete a launch
// @access Private
export const delete_launch = async (req: Request, res: Response) => {
  try {
    const prisma_client = new PrismaClient();
    const id = req.params.id;

    const launch = await prisma_client.launch.delete({
      where: {
        id: id,
      },
    });

    return res.status(200).send(launch);
  } catch (error: any) {
    return res.status(500).send({ error: error.message });
  }
};
