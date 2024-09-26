"use server"

import axios from "axios";
import db from "@/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { ethers, Transaction } from "ethers";

export const generateWallet = async () => {
    const response = await axios.post('http://localhost:8080/wallet');
    return response.data;
};

export const createNewWallet = async () => {
    const session = await getServerSession(authConfig);
    try {
        const wallet = await generateWallet();
        if (wallet) { 
            await db.user.update({
                where: {
                    id: session?.user?.uid,
                    username: session?.user?.email
                },
                data: {
                    ethWallets: {
                        create: {
                            walletAddress: wallet.address,
                            keyId: wallet.keyId
                        }
                    }
                }
            })  
        }

        return wallet;
    } catch (error) {
        console.log(error)
    }
}

export const broadcastTransaction = async (transactionSignature: string) => {
    const rpcEndPoint = 'https://ethereum-sepolia-rpc.publicnode.com';

    // trying to recover the transaction from the signature
    // noticed that the from address is not matching with the one in the signature
    // var tx = Transaction.from(transactionSignature);
    // var recoveredTx = {
    //     nonce: tx?.nonce,
    //     gasPrice: tx?.gasPrice?.toString() + ' -> ' + tx?.gasPrice?.toString(),
    //     gasLimit: tx?.gasLimit.toString() + ' -> ' + tx?.gasLimit.toString(),
    //     from: tx?.from,
    //     to: tx?.to,
    //     value: tx?.value.toString() + ' -> ' + tx?.value.toString(),
    //     data: tx?.data,
    //     chain: tx?.chainId,
    // };
    // console.log(recoveredTx);
    const cleanTransactionSignature = transactionSignature.replace(/^0x/, '');

    console.log('Cleaned signedTransaction:', cleanTransactionSignature);
    try {
        const payload = {
            id: 1,
            jsonrpc: '2.0',
            params: [cleanTransactionSignature],
            method: 'eth_sendRawTransaction'
        }

        const response = await fetch(rpcEndPoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const txResponse = await response.json();

        if (txResponse.error) {
            console.error('Error from rpc:', txResponse.error);
            return null;
        }

        console.log('Transaction hash:', txResponse.result);

        return txResponse.result;
    } catch (error) {
        console.error('Error broadcasting transaction:', error);
    }
}