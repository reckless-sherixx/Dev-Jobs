import { requireUser } from "@/app/utils/requireUser"
import { ApplicationsTable } from "@/components/general/ApplicationTable";
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation";
import { UserType } from "@prisma/client";

interface SessionUser {
    id: string;
    userType: UserType;
}

async function getJobSeekerApplications(userId: string) {
    const jobSeeker = await prisma.jobSeeker.findFirst({
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