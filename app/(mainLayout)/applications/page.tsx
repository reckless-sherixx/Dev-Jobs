import { requireUser } from "@/app/utils/requireUser"
import { ApplicationsTable } from "@/components/general/ApplicationTable";
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation";
import { UserType } from "@prisma/client"; 
import { ApplicationWithDetails } from "../dashboard/applications/page";

interface SessionUser {
    id: string;
    userType: UserType;
}


async function getJobSeekerApplications(userId: string): Promise<ApplicationWithDetails[]> {
    const jobSeeker = await prisma.jobSeeker.findUnique({
        where: { userId }
    });

    if (!jobSeeker) {
        return [];
    }

    const applications = await prisma.application.findMany({
        where: {
            jobSeekerId: jobSeeker.id
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
        name: jobSeeker.name,
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

export default async function JobSeekerApplicationsPage() {
    const session = await requireUser() as SessionUser;

    if (!session?.id) {
        redirect('/login');
    }

    // Redirect if not a job seeker 
    if (session.userType !== UserType.JOB_SEEKER) {
        redirect('/');
    }


    const applications = await getJobSeekerApplications(session.id);

    return (
        <div className="container max-w-5xl py-8">
            <ApplicationsTable
                applications={applications}
                viewType="JOBSEEKER"
            />
        </div>
    );
}
