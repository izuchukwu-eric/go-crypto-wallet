import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import axios from 'axios';

export const POST = async (req: NextRequest, res: NextResponse) => {
    const { walletAddress, keyId, toAddress, amount } = await req.json();

    if (!walletAddress || typeof walletAddress !== 'string') {
        return NextResponse.json({ error: 'Invalid wallet address' });
    }

    const transaction = {
        to: toAddress, 
        value: ethers.parseEther(amount),
        gasLimit: 21000,
        data: '0x'
    };

    const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
    const gasPrice = await provider.estimateGas(transaction);
    const data = '0x';
    const chainId = 11155111;
    const gasLimit = 21000;
    const nonce = await provider.getTransactionCount(walletAddress);

    const transactionPayload = {
        walletAddress,
        keyId,
        nonce: nonce.toString(),
        to: toAddress,
        value: ethers.parseEther(amount).toString(),
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        data,
        chainId,
    };

    console.log('Transaction payload:', transactionPayload);
    try {
        const response = await axios.post(`http://localhost:8080/sign`, transactionPayload);

        if (!response.data) {
            throw new Error('Transaction signing failed');
        }

        console.log('Transaction signature:', response.data);

        return NextResponse.json({ signedTransaction: response.data });
    } catch (error) {
        console.error("Error signing transaction:", error);
        return NextResponse.json({ error: 'Error signing transaction' });
    }
}