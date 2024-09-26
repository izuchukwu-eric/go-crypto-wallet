"use client";

import { signIn, useSession } from "next-auth/react"
import { SecondaryButton } from "./Button"
import { useRouter } from "next/navigation";
import banner from "../assets/banner.png";
import Image from "next/image";

export const Hero = () => {
    const session = useSession();
    const router = useRouter();

    return <div>
        <div className="text-6xl font-medium">
            <span>
            The Crypto Trading
            </span>
            
            <span className="text-blue-500 pl-4"> 
                Revolution
            </span>
        </div>
        <div className="flex justify-center pt-4 text-2xl text-slate-500">
            Create a frictionless wallet from anywhere with just a Google Account.
        </div>
        <div className="pt-8 flex justify-center">
            {session.data?.user ? <SecondaryButton onClick={() => {
                router.push("/dashboard");
            }}>Go to Dashboard</SecondaryButton> : <SecondaryButton onClick={() => {
                signIn("google");
            }}>Login with Google</SecondaryButton>}
        </div>
        <div className="mt-8 w-full max-w-4xl rounded-xl shadow-lg overflow-hidden">
            <Image 
                src={banner} 
                alt="Hero" 
                width={1000} 
                height={500} 
                className="h-auto"
            />
        </div>
    </div>
}