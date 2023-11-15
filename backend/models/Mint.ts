import { v4 as uuidv4 } from "uuid";
import prisma_client from "../utils/prisma_client";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";

export default class Mint {
  private id: string;
  private amount: number;
  private price: number;
  private txid_in: string;
  private txid_out: string;
  private user_id: string;
  private launch_id: string;
  private created_at: Date | null;
  private updated_at: Date | null;

  constructor(
    id: string,
    amount: number,
    price: number,
    txid_in: string,
    txid_out: string,
    user_id: string,
    launch_id: string,
    created_at?: Date | null,
    updated_at?: Date | null
  ) {
    this.id = id;
    this.amount = amount;
    this.price = price;
    this.txid_in = txid_in;
    this.txid_out = txid_out;
    this.user_id = user_id;
    this.launch_id = launch_id;
    this.created_at = created_at || null;
    this.updated_at = updated_at || null;
  }

  public static async send_and_confirm_tx(
    owner_address: string,
    user_address: string,
    signature: Uint8Array,
    total: number
  ) {
    try {
      console.log("Total: ", total);
      const connection = new Connection(
        process.env.SOLANA_RPC || "",
        "confirmed"
      );

      const new_tx: any = Transaction.from(signature);

      const tx_hash = await connection.sendRawTransaction(new_tx.serialize(), {
        skipPreflight: true,
      });

      const latestBlockHash = await connection.getLatestBlockhash();

      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: tx_hash,
      });

      // Get transaction instructions and parse them to get the source and destination
      const tx_instructions = [];
      const parsedTx: any = await connection.getParsedTransaction(tx_hash);
      const tx_count = parsedTx?.transaction.message.instructions.length;

      for (let i = 0; i < tx_count; i++) {
        tx_instructions.push(
          parsedTx?.transaction.message.instructions[i].parsed.info
        );
      }

      const from_key = tx_instructions[0].source;
      const to_key = tx_instructions[0].destination;
      const amount = tx_instructions[0].lamports;

      const fee_key = tx_instructions[1].destination;
      const fee = tx_instructions[1].lamports;

      if (user_address !== from_key.toString()) {
        console.log(user_address, from_key.toString());
        console.log("Invalid TX. From key does not match user address.");
        throw new Error("User address does not match from key.");
      }

      if (owner_address !== to_key.toString()) {
        console.log("Invalid TX. From key does not match owner address.");
        throw new Error("Unauthorized.");
      }

      if (fee_key.toString() !== process.env.FEE_WALLET_ADDRESS) {
        console.log("Invalid TX. Fee key does not match fee address.");
        throw new Error("Invalid TX. Fee key does not match fee address.");
      }

      if (Number(fee) + Number(amount) < Number(total - 5000)) {
        console.log("Invalid TX. Fee + Amount does not match total.");
        throw new Error("Invalid TX. Fee + Amount does not match total.");
      }

      console.log("Signature: ", tx_hash);
      console.log("From: ", from_key.toString());
      console.log("To: ", to_key.toString());
      console.log("Fee Key: ", fee_key.toString());
      console.log("Fee Amount: ", fee);
      console.log("Amount", amount);

      return tx_hash;
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  public static async validate_input(req: any) {
    try {
      const { amount, tx } = req.body;

      if (!req.session.user || !req.session.address) {
        console.log("Unauthorized.");
        throw new Error("Unauthorized.");
      }

      if (isNaN(amount) || !amount || !tx) {
        console.log("Please enter an amount and txid_in.");
        throw new Error("Please enter an amount and txid_in.");
      }

      if (Number(amount) <= 0) {
        console.log("Please enter a valid amount.");
        throw new Error("Please enter a valid amount.");
      }

      return true;
    } catch (error: any) {}
  }

  public save(): any {
    const saved_mint = prisma_client.mint.create({
      data: {
        id: this.id,
        amount: this.amount,
        price: this.price,
        txid_in: this.txid_in,
        txid_out: this.txid_out,
        user_id: this.user_id,
        launch_id: this.launch_id,
      },
    });

    return saved_mint;
  }
}
