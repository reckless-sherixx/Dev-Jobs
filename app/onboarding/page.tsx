import { OnboardingForm } from "@/components/forms/OnboardingForm";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireUser } from "../utils/requireUser";

async function checkIfUserHasFinishedOnboarding(userId:string){
    const user = await prisma.user.findUnique({
        where : {
            id:userId,
        },
        select :{
            onboardingCompleted:true,
        },
    })
    if(user?.onboardingCompleted === true ) {
        return redirect("/");
    }
}

export default async function OnboardingPage(){
    const session = await requireUser();//fetching users
    await checkIfUserHasFinishedOnboarding(session.id as string);
    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center py-10">
            <OnboardingForm/>
        </div>
    )
}