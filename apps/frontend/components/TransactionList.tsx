import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { ethers } from 'ethers';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface Transaction {
    blockNumber: string,
    timeStamp: string,
    hash: string,
    nonce: string,
    blockHash: string,
    transactionIndex: string,
    from: string,
    to: string,
    value: string,
    gas: string,
    gasPrice: string,
    isError: string,
    txreceipt_status: string,
    input: string,
    contractAddress: string,
    cumulativeGasUsed: string,
    gasUsed: string,
    confirmations: string
}

const TransactionList = ({ transactions, loading }: { transactions: Transaction[], loading: boolean }) => {
    
  return (
    <div>
        <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Transaction Hash</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Amount</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell><Skeleton width={100} /></TableCell>
                        <TableCell><Skeleton width={100} /></TableCell>
                        <TableCell><Skeleton width={100} /></TableCell>
                        <TableCell><Skeleton width={50} /></TableCell>
                    </TableRow>
                ))
            ) : (
                transactions.map((transaction) => (
                    <TableRow key={transaction.hash}>
                        <TableCell>{transaction.hash.slice(0, 6)}...{transaction.hash.slice(-4)}</TableCell>
                        <TableCell>{transaction.from.slice(0, 6)}...{transaction.from.slice(-4)}</TableCell>
                        <TableCell>{transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}</TableCell>
                        <TableCell>{ethers.formatEther(transaction.value)}ETH</TableCell>
                    </TableRow>
                ))
            )}
            </TableBody>
        </Table>
    </div>
  )
}

export default TransactionList