import { requireUser } from "@/app/utils/requireUser"
import { ApplicationsTable } from "@/components/general/ApplicationTable";
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation";
import { UserType } from "@prisma/client";

interface SessionUser {
    id: string;
    userType: UserType;
    email: string;
    name?: string;
}

async function getApplications(userId: string) {
    const applications = await prisma.application.findMany({
        where: {
            JobPost: {
                Company: {
                    userId
                }
            }
        },
        include: {
            JobPost: {
                select: {
                    jobTitle: true,
                    Company: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return applications.map(app => ({
        id: app.id,
        name: app.name,
        about: app.about,
        resume: app.resume,
        status: app.status,
        createdAt: app.createdAt,
        jobTitle: app.JobPost.jobTitle,
        companyName: app.JobPost.Company.name
    }));
}

export default async function ApplicationsPage() {
    const session = await requireUser() as SessionUser;
    
    if (!session?.id) {
        redirect('/login');
    }

    // checking if the user is a company
    if (session.userType !== "COMPANY") {
        redirect('/');
    }

    const applications = await getApplications(session.id);

    return (
        <div className="container max-w-5xl py-8">
            <h1 className="text-2xl font-bold mb-6">Job Applications</h1>
            <ApplicationsTable applications={applications} viewType="COMPANY" />
        </div>
    );
}