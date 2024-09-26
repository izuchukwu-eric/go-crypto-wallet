-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('GOOGLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "sub" TEXT NOT NULL DEFAULT '',
    "name" TEXT,
    "profilePicture" TEXT,
    "password" TEXT,
    "inrWalletId" TEXT,
    "provider" "Provider" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EthWallet" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EthWallet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EthWallet" ADD CONSTRAINT "EthWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
