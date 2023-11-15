-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Launch" (
    "id" TEXT NOT NULL,
    "mint_address" TEXT NOT NULL,
    "owner_address" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" VARCHAR(500),
    "max_supply" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "current_supply" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "premint" INTEGER NOT NULL DEFAULT 0,
    "decimals" INTEGER NOT NULL DEFAULT 0,
    "price" BIGINT NOT NULL DEFAULT 100000000,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "website" TEXT,
    "twitter" TEXT,
    "telegram" TEXT,
    "discord" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Launch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mint" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "price" BIGINT NOT NULL,
    "txid_in" TEXT NOT NULL,
    "txid_out" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "launch_id" TEXT NOT NULL,

    CONSTRAINT "Mint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_address_key" ON "User"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "Launch_mint_address_key" ON "Launch"("mint_address");

-- CreateIndex
CREATE UNIQUE INDEX "Launch_name_key" ON "Launch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Launch_symbol_key" ON "Launch"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Mint_txid_in_key" ON "Mint"("txid_in");

-- CreateIndex
CREATE UNIQUE INDEX "Mint_txid_out_key" ON "Mint"("txid_out");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");

-- AddForeignKey
ALTER TABLE "Launch" ADD CONSTRAINT "Launch_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mint" ADD CONSTRAINT "Mint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mint" ADD CONSTRAINT "Mint_launch_id_fkey" FOREIGN KEY ("launch_id") REFERENCES "Launch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
