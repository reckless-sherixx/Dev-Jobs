"use client"
import Image from "next/image";
import Logo from "@/public/logo.png"
import { Card, CardContent } from "../ui/card";
import { useState } from "react";
import { UserTypeForm } from "./UserTypeForm";
import { CompanyForm } from "./CompanyForm";
import { JobSeekerForm } from "./JobSeekerForm";


type selectUserProfession = 'company' | 'jobSeeker' | null
export function OnboardingForm() {
    const [step, setStep] = useState(1); 
    const [userType, setUserType] = useState<selectUserProfession>(null);

    // function to handle user's choice
    function handleUserTypeSelection(type: selectUserProfession) {
        setUserType(type);
        setStep(2); 
    }

    //function to display elements in order
    function renderSteps() {
        if (step == 1) {
            return <UserTypeForm onSelect={handleUserTypeSelection}/>
        } else {
            return userType === "company" ? (
                <CompanyForm/>
            ) : (
                <JobSeekerForm/>
            )
        }
    }
    return (
        <>
            <div className="flex items-center gap-2 mb-10">
                <Image
                    src={Logo}
                    alt="Dev jobs logo"
                    width={80}
                    height={80}
                />
                <h1 className="text-4xl font-bold">
                    Dev<span className="text-primary">Jobs</span>
                </h1>
            </div>
            <Card className="max-w-lg w-full ">
                <CardContent className="p-6">
                    {renderSteps()}
                </CardContent>
            </Card>

        </>
    )
}