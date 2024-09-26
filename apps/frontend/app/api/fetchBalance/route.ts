import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const POST = async (req: NextRequest, res: NextResponse) => {
    const { walletAddress } = await req.json();

    if (!walletAddress || typeof walletAddress !== 'string') {
        return NextResponse.json({ error: 'Invalid wallet address' });
    }

    try {
        const network = "sepolia";
        const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com", network);
        const balance = await provider.getBalance(walletAddress);
        const balanceInEth = ethers.formatEther(balance);

        return NextResponse.json({ balance: balanceInEth });
    } catch (error) {
        console.error("Error fetching balance:", error);
        return NextResponse.json({ error: 'Error fetching balance' });
    }
}