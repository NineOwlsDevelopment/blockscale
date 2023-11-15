import { v4 as uuidv4 } from "uuid";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  token,
} from "@metaplex-foundation/js";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";

import prisma_client from "../utils/prisma_client";

export default class Launch {
  private id: string;
  private mint_address: string;
  private owner_address: string;
  private user_id: string;
  private image: string;
  private name: string;
  private symbol: string;
  private description: string;
  private max_supply: number;
  private current_supply: number;
  private premint: number;
  private decimals: number;
  private price: number;
  private start_date: Date;
  private end_date: Date;
  private status: string;
  private website: string;
  private twitter: string;
  private telegram: string;
  private discord: string;
  private created_at: Date | undefined;
  private updated_at: Date | undefined;

  constructor(
    id: string,
    mint_address: string,
    owner_address: string,
    user_id: string,
    image: string,
    name: string,
    symbol: string,
    description: string,
    max_supply: number,
    current_supply: number,
    premint: number,
    decimals: number,
    price: number,
    start_date: Date,
    end_date: Date,
    status: string,
    website?: string | undefined,
    twitter?: string | undefined,
    telegram?: string | undefined,
    discord?: string | undefined,
    created_at?: Date | undefined,
    updated_at?: Date | undefined
  ) {
    this.id = id;
    this.mint_address = mint_address;
    this.owner_address = owner_address;
    this.user_id = user_id;
    this.image = image;
    this.name = name;
    this.symbol = symbol;
    this.description = description;
    this.max_supply = max_supply;
    this.current_supply = current_supply;
    this.premint = premint;
    this.decimals = decimals;
    this.price = price;
    this.start_date = start_date;
    this.end_date = end_date;
    this.status = status || "upcoming";
    this.website = website || "";
    this.twitter = twitter || "";
    this.telegram = telegram || "";
    this.discord = discord || "";
    this.created_at = created_at || undefined;
    this.updated_at = updated_at || undefined;
  }

  public static async generate_onchain_token(
    owner_address: string,
    name: string,
    symbol: string,
    decimals: number,
    image: string,
    description: string
  ) {
    try {
      const solanaUrl: string = process.env.SOLANA_RPC || "";
      const connection: Connection = new Connection(solanaUrl, "confirmed");
      const keypair = Keypair.fromSecretKey(
        bs58.decode(process.env.HOT_WALLET_SECRET || "")
      );

      const metaplex: Metaplex = Metaplex.make(connection)
        .use(keypairIdentity(keypair))
        .use(
          process.env.SOLANA_NETWORK === "devnet"
            ? bundlrStorage({
                address: "https://devnet.bundlr.network",
                providerUrl: solanaUrl,
                timeout: 60000,
              })
            : bundlrStorage()
        );

      const { uri } = await metaplex.nfts().uploadMetadata({
        name: name,
        description: description,
        image: image,
      });

      const token = await metaplex.nfts().createSft({
        updateAuthority: keypair,
        mintAuthority: keypair,
        uri: uri,
        name: name,
        sellerFeeBasisPoints: 0,
        tokenStandard: TokenStandard.Fungible,
        symbol: symbol,
        decimals: decimals,
        creators: [
          {
            address: keypair.publicKey,
            authority: keypair,
            share: 0,
          },
          {
            address: new PublicKey(owner_address),
            authority: keypair,
            share: 100,
          },
        ],
      });

      return token.sft.address.toBase58();
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  public static async mint_tokens(
    amount: number,
    recipient: string,
    mint_address: string,
    decimals: number
  ) {
    try {
      if (amount <= 0) throw new Error("Amount must be greater than 0.");
      if (!recipient) throw new Error("Recipient is required.");
      if (!mint_address) throw new Error("Mint address is required.");
      if (!decimals) throw new Error("Decimals is required.");

      const solanaUrl: string = process.env.SOLANA_RPC || "";
      const connection: Connection = new Connection(solanaUrl, "confirmed");

      const keypair = Keypair.fromSecretKey(
        bs58.decode(process.env.HOT_WALLET_SECRET || "")
      );

      const metaplex: Metaplex = Metaplex.make(connection)
        .use(keypairIdentity(keypair))
        .use(
          process.env.SOLANA_NETWORK === "devnet"
            ? bundlrStorage({
                address: "https://devnet.bundlr.network",
                providerUrl: solanaUrl,
                timeout: 60000,
              })
            : bundlrStorage()
        );

      const sft: any = {
        address: new PublicKey(mint_address),
        tokenStandard: 2,
      };

      const txid_out = await metaplex.nfts().mint({
        nftOrSft: sft,
        toOwner: new PublicKey(recipient),
        amount: token(amount * Math.pow(10, decimals)),
      });

      if (!txid_out.response.signature) {
        console.log("Token minting failed.");
        throw new Error("Token minting failed.");
      }

      return txid_out.response.signature;
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  public static async validate_launch_fee(
    signature: Uint8Array,
    owner_address: string
  ) {
    try {
      const connection = new Connection(
        process.env.SOLANA_RPC || "",
        "confirmed"
      );

      const launch_fee = Number(process.env.LAUNCH_FEE) * LAMPORTS_PER_SOL;

      const new_tx: any = Transaction.from(signature);

      const tx_hash = await connection.sendRawTransaction(new_tx.serialize(), {
        skipPreflight: true,
      });

      const latestBlockHash = await connection.getLatestBlockhash();

      const is_confirmed = await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: tx_hash,
      });

      if (!is_confirmed) {
        throw new Error("Transaction not confirmed.");
      }

      // wait for transaction to be confirmed
      let parsedTx: any = null;

      const interval = setInterval(async () => {
        parsedTx = await connection.getParsedTransaction(tx_hash);

        if (parsedTx) {
          clearInterval(interval);
        }
      }, 1000);

      while (!parsedTx) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      // end wait for transaction to be confirmed

      // const tx_count = parsedTx?.transaction.message.instructions.length;
      // const account_keys = parsedTx?.transaction.message.accountKeys;

      // console.log(parsedTx);
      // console.log(tx_count);
      // console.log(account_keys);
      // console.log(instructions[instructions.length - 1]);
      // console.log(instructions);

      const tx_instructions = [];
      const instructions = parsedTx?.transaction.message.instructions;
      tx_instructions.push(instructions[instructions.length - 1].parsed.info);

      const from_key = tx_instructions[0].source;
      const to_key = tx_instructions[0].destination;
      const amount = tx_instructions[0].lamports;

      if (from_key.toString() !== owner_address) {
        throw new Error("Invalid transaction. Wrong source.");
      }

      if (to_key.toString() !== process.env.FEE_WALLET_ADDRESS) {
        throw new Error("Invalid transaction. Wrong destination.");
      }

      if (amount < launch_fee) {
        throw new Error("Invalid transaction. Wrong amount.");
      }

      return tx_hash;
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  public static async get_all_launches(
    page: number,
    limit: number
  ): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const launches = await prisma_client.launch.findMany({
        where: {
          status: {
            in: ["upcoming", "live"],
          },
        },
        orderBy: {
          current_supply: "desc",
        },
        take: Number(limit),
        skip: Number(skip),
      });

      launches.forEach((launch: any) => {
        launch.price = Number(launch.price.toString());
      });

      return launches;
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  // query launch by value
  public static async find_by_value(value: string): Promise<any> {
    try {
      const launches: any = await prisma_client.launch.findMany({
        where: {
          status: {
            in: ["upcoming", "live"],
          },
          OR: [
            {
              name: {
                contains: value,
                mode: "insensitive",
              },
            },
            {
              symbol: {
                contains: value,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: {
          current_supply: "desc",
        },
        // take: Number(6),
        // skip: Number(1),
      });

      if (!launches) return null;

      launches.forEach((launch: any) => {
        launch.price = Number(launch.price.toString());
      });

      return launches;
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  public static async find_by_id(id: string): Promise<any> {
    try {
      if (!id) return null;

      const launch: any = await prisma_client.launch.findUnique({
        where: {
          id: id,
        },
      });

      if (!launch) return null;

      launch.price = Number(launch.price.toString());

      return launch;
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  // find by name or symbol
  public static async find_by_name_or_symbol(
    name: string,
    symbol: string
  ): Promise<any> {
    try {
      if (!name && !symbol) return null;

      const launch: any = await prisma_client.launch.findFirst({
        where: {
          OR: [
            {
              name: name,
            },
            {
              symbol: symbol,
            },
          ],
        },
      });

      if (!launch) return null;

      launch.price = Number(launch.price.toString());

      return launch;
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  // update supply
  public static async update_supply(
    id: string,
    current_supply: number
  ): Promise<any> {
    try {
      if (!id) return null;

      const updated_launch: any = await prisma_client.launch.update({
        where: {
          id: id,
        },
        data: {
          current_supply: current_supply,
        },
      });

      updated_launch.price = Number(updated_launch.price.toString());

      return updated_launch;
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  public static async update_status(id: string, status: string): Promise<any> {
    try {
      if (!id) return null;

      const updated_launch: any = await prisma_client.launch.update({
        where: {
          id: id,
        },
        data: {
          status: status,
        },
      });

      updated_launch.price = Number(updated_launch.price.toString());

      return updated_launch;
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  public get_id(): string {
    return this.id;
  }

  public save(): any {
    const saved_launch = prisma_client.launch.create({
      data: {
        id: uuidv4(),
        mint_address: this.mint_address,
        owner_address: this.owner_address,
        user_id: this.user_id,
        image: this.image,
        name: this.name,
        symbol: this.symbol,
        description: this.description,
        max_supply: this.max_supply,
        current_supply: this.current_supply,
        premint: this.premint,
        decimals: this.decimals,
        price: this.price,
        start_date: this.start_date,
        end_date: this.end_date,
        status: this.status,
        website: this.website,
        twitter: this.twitter,
        telegram: this.telegram,
        discord: this.discord,
      },
    });

    return saved_launch;
  }
}
