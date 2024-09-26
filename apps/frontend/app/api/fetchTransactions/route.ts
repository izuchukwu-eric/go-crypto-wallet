import { NextRequest, NextResponse } from 'next/server';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

export const POST = async (req: NextRequest, res: NextResponse) => {
    const { walletAddress } = await req.json();

    if (!walletAddress || typeof walletAddress !== 'string') {
        return NextResponse.json({ error: 'Invalid wallet address' });
    }

    try {
        // Fetch last 3 transactions
        const response = await fetch(`https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`);
        const data = await response.json();

        if (data.status !== '1') {
            throw new Error('Error fetching transactions');
        }

        const transactions = data.result.slice(0, 3);

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json({ error: 'Error fetching transactions' });
    }
}