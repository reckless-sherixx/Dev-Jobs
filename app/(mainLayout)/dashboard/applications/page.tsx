import { requireUser } from "@/app/utils/requireUser"
import { ApplicationsTable } from "@/components/general/ApplicationTable";
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation";
import { ApplicationStatus, InterviewRoundStatus, UserType } from "@prisma/client";

interface SessionUser {
    id: string;
    userType: UserType;
    email: string;
    name?: string;
}

// Define the structure for applications including rounds
export type ApplicationWithDetails = {
    id: string;
    jobId: string;
    name: string;
    about: string;
    resume: string;
    status: ApplicationStatus;
    currentRound: number;
    createdAt: Date;
    jobTitle: string;
    companyName: string;
    interviewRounds: {
        id: string;
        roundNumber: number;
        status: InterviewRoundStatus;
        feedback?: string | null;
        interviewDate?: Date | null;
    }[];
};


async function getCompanyApplications(userId: string): Promise<ApplicationWithDetails[]> {
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
                    id: true,
                    jobTitle: true,
                    Company: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            InterviewRounds: { // Include interview rounds
                orderBy: {
                    roundNumber: 'asc'
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return applications.map(app => ({
        id: app.id,
        jobId: app.JobPost.id,
        name: app.name,
        about: app.about,
        resume: app.resume,
        status: app.status,
        currentRound: app.currentRound,
        createdAt: app.createdAt,
        jobTitle: app.JobPost.jobTitle,
        companyName: app.JobPost.Company.name,
        interviewRounds: app.InterviewRounds.map(round => ({
            id: round.id,
            roundNumber: round.roundNumber,
            status: round.status,
            feedback: round.feedback,
            interviewDate: round.interviewDate,
        }))
    }));
}

export default async function CompanyApplicationsDashboardPage() {
    const session = await requireUser() as SessionUser;

    if (!session?.id) {
        redirect('/login');
    }

    // checking if the user is a company
    if (session.userType !== "COMPANY") {
        redirect('/'); // Redirect non-companies
    }

    const applications = await getCompanyApplications(session.id);

    return (
        <div className="container max-w-6xl py-8">
            <ApplicationsTable applications={applications} viewType="COMPANY" />
        </div>
    );
}
