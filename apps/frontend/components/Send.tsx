"use client"

import { ArrowRightIcon, ScanIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useState } from "react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { broadcastTransaction } from "@/lib/helpers"

interface Wallet {
    keyId: string
    walletAddress: string
}

export default function Send({ userWallets }: { userWallets: Wallet[] }) {
    const router = useRouter();
    const [selectedWallet, setSelectedWallet] = useState<Wallet>(userWallets[0]);
    const [toAddress, setToAddress] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleSendTransaction = async () => {
        const notification = toast.loading("Signing transaction...");
        setLoading(true)

        if (!toAddress || !amount) {
            alert("Please enter both recipient address and amount.");
            return;
        }

        try {
            const response = await fetch('/api/signTransaction', {
                method: 'POST',
                body: JSON.stringify({ walletAddress: selectedWallet.walletAddress, keyId: selectedWallet.keyId, toAddress, amount, }),
            });

            const data = await response.json();

            if (data.signedTransaction) {
                console.log('Transaction signed:', data.signedTransaction);
                toast.loading("Broadcasting transaction...", {
                    id: notification
                })
                
                const receipt = await broadcastTransaction(data.signedTransaction.signedTransaction);
                if (receipt) {  
                    console.log('Transaction receipt:', receipt);
                    toast.success("Transaction mined successfully!", {
                        id: notification
                    })
                }
            }
        } catch (error) {
            toast.error("Error signing transaction", {
                id: notification
            })
            console.error('Error sending transaction:', error);
        } finally {
            toast.remove(notification);
            setLoading(false)
            router.refresh()
        }
    };
    
    return (
        <div className="w-full max-w-md mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <div className="flex gap-2 justify-between">
                    <div className="w-80">
                        <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                            From
                        </label>
                        <Select
                            value={selectedWallet.walletAddress}
                            onValueChange={(value) => setSelectedWallet(userWallets.find(w => w.walletAddress === value) || userWallets[0])}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select wallet" />
                            </SelectTrigger>
                            <SelectContent>
                                {userWallets.map((wallet) => (
                                    <SelectItem key={wallet.keyId} value={wallet.walletAddress}>{wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div> 

                    <div>
                        <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                            Amount
                        </label>
                        <Input 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            id="amount"
                            type="number"
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                    To
                </label>
                <div className="relative">
                    <Input
                        id="to"
                        value={toAddress}
                        onChange={(e) => setToAddress(e.target.value)}
                        placeholder="Enter public address (0x) or ENS name"
                        className="pr-10"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-500"
                    >
                        <ScanIcon className="h-5 w-5" />
                        <span className="sr-only">Scan QR code</span>
                    </Button>
                </div>
            </div>
            <Button disabled={loading} className="w-full" size="lg" onClick={handleSendTransaction}>
                {loading ? "Sending..." : "Send Transaction"}   
                <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
        </div>
    )
}