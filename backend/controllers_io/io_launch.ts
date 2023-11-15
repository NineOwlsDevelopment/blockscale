import { Socket } from "socket.io";
import { parse_buffer_to_image, upload_to_s3 } from "../utils/utils_aws";
import Launch from "../models/Launch";
import Mint from "../models/Mint";
import { v4 as uuidv4 } from "uuid";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { queue } from "../utils/queue";

export const create_launch = async (socket: any, data: any) => {
  try {
    const user_id = socket.request.session.user;
    const owner_address = socket.request.session.address;

    if (!user_id || !owner_address) {
      throw new Error("Unauthorized.");
    }

    // get owner_address balance
    const solanaUrl: string = process.env.SOLANA_RPC || "";
    const connection: Connection = new Connection(solanaUrl, "confirmed");
    const balance = await connection.getBalance(new PublicKey(owner_address));
    const launch_fee = Number(process.env.LAUNCH_FEE) * LAMPORTS_PER_SOL;

    if (balance < launch_fee) throw new Error("Not enough SOL to pay fee.");

    const image = await parse_buffer_to_image(data.image);
    const name = data.name;
    const symbol = data.symbol;
    const description = data.description;
    const max_supply = Math.ceil(Number(data.max_supply));
    const premint = Number(data.premint);
    const decimals = Number(data.decimals);
    const price = Number(data.price);
    const start_date = new Date(data.start_date);
    const end_date = new Date(data.end_date);
    const website = data.website;
    const twitter = data.twitter;
    const telegram = data.telegram;
    const discord = data.discord;
    const signature = data.signature;

    if (!image) throw new Error("Image is required");
    if (!name) throw new Error("Name is required");
    if (!symbol) throw new Error("Symbol is required");
    if (!description) throw new Error("Description is required");
    if (!max_supply) throw new Error("Max supply is required");
    if (!decimals) throw new Error("Decimals is required");
    if (!price) throw new Error("Price is required");
    if (!start_date) throw new Error("Start date is required");
    if (!end_date) throw new Error("End date is required");
    if (!signature) throw new Error("Signature is required");

    const already_exist = await Launch.find_by_name_or_symbol(name, symbol);

    if (already_exist) throw new Error("Name or symbol already exist");

    if (name.length > 50)
      throw new Error("Name must be less than 50 characters");

    if (symbol.length > 5)
      throw new Error("Symbol must be less than 5 characters");

    if (start_date > end_date)
      throw new Error("Start date must be before end date");

    if (start_date < new Date())
      throw new Error("Start date must be in the future");

    if (max_supply <= 0) throw new Error("Max supply must be greater than 0");

    if (max_supply <= premint)
      throw new Error("Max supply must be greater than premint");

    if (premint < 0) throw new Error("premint must be greater than 0");

    if (price <= 0) throw new Error("Price must be greater than 0");

    if (decimals <= 0 || decimals > 6)
      throw new Error("Decimals must be between 1 and 6");

    // Check that the fee has been paid
    const tx_hash = await Launch.validate_launch_fee(signature, owner_address);

    if (!tx_hash) throw new Error("Invalid signature.");

    await upload_to_s3(image);

    const mint_address = await Launch.generate_onchain_token(
      owner_address,
      name,
      symbol,
      decimals,
      `${process.env.AWS_BASE_URL}${image.key}`,
      description
    );

    if (!mint_address) throw new Error("Failed to generate token.");

    if (premint > 0) {
      const mint = await Launch.mint_tokens(
        premint,
        owner_address,
        mint_address,
        decimals
      );

      if (!mint) throw new Error("Failed to mint tokens.");
    }

    const launch = new Launch(
      uuidv4(),
      mint_address,
      owner_address,
      user_id,
      image.key,
      name,
      symbol,
      description,
      max_supply,
      premint, // current supply
      premint, // actual premint
      decimals,
      Math.round(Number(price) * LAMPORTS_PER_SOL),
      start_date,
      end_date,
      "upcoming",
      website,
      twitter,
      telegram,
      discord
    );

    await launch.save();

    // console.log(mint_address);

    const response = {
      message: "Launch created.",
    };

    return socket.emit("/api/launch/result", response);
  } catch (error: any) {
    console.log(error);
    const response = {
      error: error.message,
    };

    return socket.emit("/api/launch/error", response);
  }
};

export const mint_tokens = async (socket: any, data: any) => {
  const mint_task = async () => {
    try {
      const user_id = socket.request.session.user;
      const user_address = socket.request.session.address;

      if (!user_id || !user_address) {
        throw new Error("Unauthorized.");
      }

      const launch_id = data.launch_id;
      const amount = Number(data.mint_amount);
      const signature = data.signature;

      if (!launch_id) throw new Error("Launch ID is required");
      if (!amount) throw new Error("Amount is required");
      if (!signature) throw new Error("Signature is required");
      if (amount <= 0) throw new Error("Amount must be greater than 0");

      const launch = await Launch.find_by_id(launch_id);

      if (!launch) throw new Error("Launch not found.");

      const end_date = new Date(launch.end_date);
      const start_date = new Date(launch.start_date);
      const now = new Date();

      const current_supply = Number(launch.current_supply);
      const max_supply = Number(launch.max_supply);

      const total = Number(Math.round(amount * launch.price));

      // check if launch is active
      if (start_date > now) {
        throw new Error("Launch has not started yet.");
      }

      if (end_date < now) {
        throw new Error("Launch has ended.");
      }

      // check if supply is maxed out
      if (current_supply === max_supply) {
        throw new Error("Max supply reached.");
      }

      if (Number(current_supply + amount) > max_supply) {
        throw new Error("Mint amount exceeds max supply.");
      }

      const tx_hash = await Mint.send_and_confirm_tx(
        launch.owner_address,
        user_address,
        signature,
        total
      );

      if (!tx_hash) throw new Error("Failed to mint tokens.");

      const mint_txid = await Launch.mint_tokens(
        amount,
        user_address,
        launch.mint_address,
        launch.decimals
      );

      if (!mint_txid) throw new Error("Failed to mint tokens.");

      const mint = new Mint(
        uuidv4(),
        amount,
        total,
        tx_hash,
        mint_txid,
        user_id,
        launch_id
      );

      let new_supply = Number(current_supply) + Number(amount);

      if (Math.round(new_supply) >= max_supply) {
        await Launch.update_status(launch_id, "finished");
      }

      const updated_launch = await Launch.update_supply(launch_id, new_supply);

      if (!updated_launch) throw new Error("Failed to update current supply.");

      await mint.save();

      return socket.emit("/api/launch/mint/result", updated_launch);
    } catch (error: any) {
      console.log(error);
      const response = {
        message: error.message,
      };

      return socket.emit("/api/launch/mint/error", response);
    }
  };

  await queue.add(mint_task);
};

export const create_token = async (socket: any, data: any) => {
  try {
    const user_id = socket.request.session.user;
    const owner_address = socket.request.session.address;

    if (!user_id || !owner_address) {
      throw new Error("Unauthorized.");
    }

    // get owner_address balance
    const solanaUrl: string = process.env.SOLANA_RPC || "";
    const connection: Connection = new Connection(solanaUrl, "confirmed");
    const balance = await connection.getBalance(new PublicKey(owner_address));
    const launch_fee = Number(process.env.LAUNCH_FEE) * LAMPORTS_PER_SOL;

    if (balance < launch_fee) throw new Error("Not enough SOL to pay fee.");

    const image = await parse_buffer_to_image(data.image);
    const name = data.name;
    const symbol = data.symbol;
    const description = data.description;
    const max_supply = Number(data.max_supply);
    const decimals = Number(data.decimals);
    const signature = data.signature;

    if (!image) throw new Error("Image is required");
    if (!name) throw new Error("Name is required");
    if (!symbol) throw new Error("Symbol is required");
    if (!description) throw new Error("Description is required");
    if (!max_supply) throw new Error("Max supply is required");
    if (!decimals) throw new Error("Decimals is required");
    if (!signature) throw new Error("Signature is required");

    if (name.length > 50)
      throw new Error("Name must be less than 50 characters");

    if (symbol.length > 5)
      throw new Error("Symbol must be less than 5 characters");

    if (max_supply <= 0) throw new Error("Max supply must be greater than 0");

    if (decimals <= 0 || decimals > 6)
      throw new Error("Decimals must be between 1 and 6");

    // Check that the fee has been paid
    const tx_hash = await Launch.validate_launch_fee(signature, owner_address);

    if (!tx_hash) throw new Error("Invalid signature.");

    await upload_to_s3(image);

    const mint_address = await Launch.generate_onchain_token(
      owner_address,
      name,
      symbol,
      decimals,
      `${process.env.AWS_BASE_URL}${image.key}`,
      description
    );

    if (!mint_address) throw new Error("Failed to generate token.");

    const mint = await Launch.mint_tokens(
      max_supply,
      owner_address,
      mint_address,
      decimals
    );

    if (!mint) throw new Error("Failed to mint tokens.");

    return socket.emit("/api/token/result", mint_address);
  } catch (error: any) {
    console.log(error);

    const response = {
      error: error.message,
    };

    return socket.emit("/api/token/error", response);
  }
};
