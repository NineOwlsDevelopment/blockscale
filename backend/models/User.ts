import prisma_client from "../utils/prisma_client";
import bs58 from "bs58";
import nacl from "tweetnacl";

interface WalletVerification {
  address: string;
  signature: Uint8Array | any;
}

export default class User {
  private id: string;
  private wallet_address: string;
  private mints: any;
  private created_at: Date | null;
  private updated_at: Date | null;

  constructor(
    id: string,
    wallet_address: string,
    created_at?: Date | null,
    updated_at?: Date | null
  ) {
    this.id = id;
    this.wallet_address = wallet_address;
    this.created_at = created_at || null;
    this.updated_at = updated_at || null;
  }

  public get_id() {
    return this.id;
  }

  public get_wallet_address() {
    return this.wallet_address;
  }

  public get_mints() {
    return this.mints;
  }

  public static async find_by_wallet_address(wallet_address: string) {
    const user = await prisma_client.user.findFirst({
      where: {
        wallet_address: wallet_address,
      },
    });

    return user;
  }

  public static async find_by_id(id: string) {
    const user = await prisma_client.user.findFirst({
      where: {
        id: id,
      },
    });

    return user;
  }

  public static verify_login_signature(data: WalletVerification) {
    try {
      const signature = data.signature.data
        ? new Uint8Array(data.signature.data)
        : new Uint8Array(Object.values(data.signature));

      const message = new TextEncoder().encode(`Login as ${data.address}`);
      const address = bs58.decode(data.address);

      const isVerified = nacl.sign.detached.verify(message, signature, address);

      if (!isVerified) {
        throw new Error("Signature verification failed.");
      }

      return isVerified;
    } catch (error: any) {
      console.log(error);
      throw new Error("Signature verification failed.");
    }
  }

  public save() {
    try {
      const saved_user = prisma_client.user.create({
        data: {
          id: this.id,
          wallet_address: this.wallet_address,
        },
      });

      return saved_user;
    } catch (error: any) {
      console.log(error);
      throw new Error("User creation failed.");
    }
  }
}
