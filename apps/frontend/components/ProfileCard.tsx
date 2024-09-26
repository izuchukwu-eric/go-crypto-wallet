"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "./Button";
import { useEffect, useState } from "react";
import TransactionList from "./TransactionList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { HomeIcon, MinusIcon, PlusIcon, SendIcon, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { createNewWallet } from "@/lib/helpers";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import toast from "react-hot-toast";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import Send from "./Send";

type Tab = "home" | "addFunds" | "send" | "withdraw"

interface Wallet {
    keyId: string
    walletAddress: string
}

export const ProfileCard = ({userWallets}: {
    userWallets: Wallet[]
}) => {
    const session = useSession();
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<Tab>("home");
    const [currentWallet, setCurrentWallet] = useState<Wallet>(userWallets[0]);
    const [tokenBalances, setTokenBalances] = useState<{ totalBalance: number }>({ totalBalance: 0 });
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isFetchTransactions, setIsFetchTransactions] = useState<boolean>(false);

    useEffect(() => {
        const fetchBalance = async () => {
            if (currentWallet) {
                setLoading(true);
                try {
                    const response = await fetch(`/api/fetchBalance`, {
                        method: "POST",
                        body: JSON.stringify({ walletAddress: currentWallet.walletAddress })
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setTokenBalances({ totalBalance: parseFloat(data.balance) });
                        setTransactions(data.transactions);
                        console.log("balance", data.balance)
                    } else {
                        console.error("Error fetching balance:", data.error);
                    }
                } catch (error) {
                    console.error("Error fetching balance:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        
        fetchBalance();
    }, [currentWallet]);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (currentWallet) {
                setLoading(true);
                try {
                    const response = await fetch(`/api/fetchTransactions`, {
                        method: "POST",
                        body: JSON.stringify({ walletAddress: currentWallet.walletAddress })
                    });
                    const data = await response.json();
                    if (data) {
                        setTransactions(data.transactions);
                    } else {
                        console.error("Error fetching transactions:", data.error);
                    }
                } catch (error) {
                    console.error("Error fetching transactions:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        
        fetchTransactions();
    }, [currentWallet, isFetchTransactions]);

    if (!session.data?.user) {
        router.push("/")
        return null
    }

    return <div className="pt-8 flex justify-center">
        <div className="max-w-4xl bg-white rounded shadow w-full">
            <Greeting 
                status={session.status}
                currentWallet={currentWallet?.walletAddress}
                setCurrentWallet={setCurrentWallet}
                userWallets={userWallets}
                router={router}
                image={session.data?.user?.image ?? ""} 
                name={session.data?.user?.name ?? ""} 
            />
            
            <div>
                <Assets tokenBalances={tokenBalances.totalBalance} loading={loading} walletAddress={currentWallet.walletAddress} />
                
                <div className="w-full px-10 pt-10 flex space-x-4">
                    <Button className={`flex-1 ${selectedTab === "home" ? "bg-black text-white" : "bg-gray-200"}`} onClick={() => {
                        setSelectedTab("home")
                        setIsFetchTransactions(true)
                    }}>
                        <HomeIcon className="mr-2 h-4 w-4" /> Home
                    </Button>
                    <Link className="flex-1" target="_blank" href={"https://cloud.google.com/application/web3/faucet/ethereum/sepolia"} onClick={() => setSelectedTab("addFunds")}>
                        <Button className={`w-full ${selectedTab === "addFunds" ? "bg-black text-white" : "bg-gray-200"}`}>
                            <PlusIcon className="mr-2 h-4 w-4" /> Add funds
                        </Button>
                    </Link>
                    <Button className={`flex-1 ${selectedTab === "send" ? "bg-black text-white" : "bg-gray-200"}`} onClick={() => {
                        setSelectedTab("send")
                    }}>
                        <SendIcon className="mr-2 h-4 w-4" /> Send
                    </Button>
                    <Button className={`flex-1 ${selectedTab === "withdraw" ? "bg-black text-white" : "bg-gray-200"}`} onClick={() => {
                        setSelectedTab("withdraw")
                        toast.success("Withdrawal feature coming soon")
                    }}>
                        <MinusIcon className="mr-2 h-4 w-4" /> Withdraw
                    </Button>
                </div>
        
                <div className={`${selectedTab === "home" ? "pt-4 bg-slate-50 p-12 mt-4" : "hidden"}`}>
                    {transactions?.length > 0 
                        ? 
                        <TransactionList transactions={transactions} loading={loading} />
                        : 
                        <div className="bg-slate-50 py-32 px-10 flex justify-center">
                            No transactions yet
                        </div>
                    }
                </div>
            </div>
            <div className={`${selectedTab === "send" ? "visible bg-slate-50 mt-4 p-12" : "hidden"}`}><Send userWallets={userWallets} /> </div>
        </div>
    </div>
}

function Assets({walletAddress, tokenBalances, loading}: {
    walletAddress: string;
    tokenBalances: number;
    loading: boolean;
}) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            let timeout = setTimeout(() => {
                setCopied(false)
            }, 3000)
            return () => {
                clearTimeout(timeout);
            }
        }
    }, [copied])

    return <div className="text-slate-500">
        <div className="mx-12 py-2">
            <h2 className="text-2xl font-bold text-black tracking-tight">
                Wallet balance
            </h2>
        </div>
        <div className="flex justify-between mx-12">
            <div className="flex">
                <div className="text-5xl font-bold text-black">
                    {loading ? <Skeleton width={100} height={30} /> : tokenBalances}
                </div>
                <div className="font-slate-500 font-bold text-3xl text-black flex flex-col justify-end pb-0 pl-2">
                    ETH
                </div>
            </div>

            <div>
                <PrimaryButton onClick={() => {
                    navigator.clipboard.writeText(walletAddress)
                    setCopied(true)
                }}>{copied ? "Copied" : "Your wallet address"}</PrimaryButton>
            </div>
        </div>
    </div>
}

function Greeting({
    status, image, name, router, userWallets, currentWallet, setCurrentWallet
}: {
    status: string, image: string, name: string, router: AppRouterInstance, userWallets: Wallet[], currentWallet: string, setCurrentWallet: (wallet: Wallet) => void
}) {
    const [isCreateWalletOpen, setIsCreateWalletOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCreateWallet = async () => {
        const notification = toast.loading("Creating new wallet...");
        setLoading(true)
        try {
            const wallet = await createNewWallet();
            if (wallet) { 
                toast.success("Wallet created successfully!", {
                    id: notification
                })
                setLoading(false)
                setIsCreateWalletOpen(false)
            }

        } catch (error) {
            toast.error("Error creating wallet", {
                id: notification
            })
            console.error("Error creating wallet:", error)
        } finally {
            setLoading(false)
            router.refresh()
        }
    }

    return <div className="flex p-12">
        {status === 'loading' ? (
            <Skeleton circle={true} height={64} width={64} className="mr-4" />
        ) : (
            <img src={image} className="rounded-full w-16 h-16 mr-4" />
        )}
        <div className="text-2xl font-semibold flex flex-col justify-center">
           {status === 'loading' ? <Skeleton width={200} /> : `Welcome back, ${name}`}
           <div className="flex items-center space-x-2">
              <Select
                value={currentWallet}
                onValueChange={(value) => setCurrentWallet(userWallets.find(w => w.walletAddress === value) || userWallets[0])}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {userWallets.map((wallet) => (
                    <SelectItem key={wallet.keyId} value={wallet.walletAddress}>{wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isCreateWalletOpen} onOpenChange={setIsCreateWalletOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle>Create New Wallet</DialogTitle>
                  </DialogHeader>
                  <Button onClick={handleCreateWallet} disabled={loading}>{loading ? "Creating..." : "Create Wallet"}</Button>
                </DialogContent>
              </Dialog>
            </div>
        </div>
    </div>
}