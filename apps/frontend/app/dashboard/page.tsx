
import { getServerSession } from "next-auth";
import { ProfileCard } from "@/components/ProfileCard";
import db from "@/db";
import { authConfig } from "@/lib/auth";

async function getUserWallets() {
    const session = await getServerSession(authConfig);

    if (!session?.user?.uid) {
        return {
            error: "User not authenticated"
        };
    }

    const userWallets = await db.ethWallet.findMany({
        where: {
            userId: session.user.uid
        },
        select: {
            walletAddress: true,
            keyId: true
        }
    });

    if (userWallets.length === 0) {
        return {
            error: "No ethereum wallets found associated with the user"
        };
    }
    
    return { error: null, userWallets };
}


export default async function Dashboard() {
    const userWallets = await getUserWallets();

    if (userWallets.error || !userWallets.userWallets?.length) {
        return <>No ethereum wallet found</>
    }

    return <div>
        <ProfileCard userWallets={userWallets.userWallets || []} />
    </div>
}