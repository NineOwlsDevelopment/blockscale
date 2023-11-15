import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import prisma_client from "../utils/prisma_client";
import User from "../models/User";

// @route POST api/auth/login
// @desc Create a user
// @access Public
export const login_user = async (req: Request, res: Response) => {
  try {
    const id = uuidv4();
    const wallet_address: string = req.body.wallet_address;
    const signature: Uint8Array | any = req.body.signature;
    const created_at = new Date();
    const updated_at = new Date();

    User.verify_login_signature({
      address: wallet_address,
      signature,
    });

    let user: any = await User.find_by_wallet_address(wallet_address);

    if (user) {
      req.session.user = user.id;
      req.session.address = wallet_address;
      return res.status(200).send(user);
    }

    user = new User(id, wallet_address);

    req.session.user = user.get_id();
    req.session.address = wallet_address;

    await prisma_client.$transaction([user.save()]);

    return res.status(201).send(user);
  } catch (error: any) {
    console.log(error);
    res.status(500).send({ error: "User creation failed." });
  }
};
