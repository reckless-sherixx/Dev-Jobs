"use server"
import { z } from "zod";
import { requireUser } from "./utils/requireUser"
import { companySchema, jobSchema, jobSeekerSchema } from "./utils/zodSchemas";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import arcjet, { detectBot, shield } from "./utils/arcjet";
import { request } from "@arcjet/next";
import { stripe } from "./utils/stripe";
import { jobListingDurationPricing } from "./utils/jobListingDurationPricing";
import { inngest } from "./utils/inngest/client";
import { revalidatePath } from "next/cache";
import { ApplicationStatus, InterviewRoundStatus, UserType } from "@prisma/client";

//For only authenticated request from real users. No bots can be permitted from the server
const aj = arcjet.withRule(
    shield({
        mode: 'LIVE',
    })
).withRule(
    detectBot({
        mode: "LIVE",
        allow: [],
    })
)

export async function createCompany(data: z.infer<typeof companySchema>) {
    const session = await requireUser();

    const req = await request();

    const decision = await aj.protect(req);

    if (decision.isDenied()) {
        throw new Error('Forbidden')
    }

    const validateData = companySchema.parse(data);

    await prisma.user.update({
        where: {
            id: session.id
        },
        data: {
            onboardingCompleted: true,
            userType: "COMPANY",
            Company: {
                create: {
                    ...validateData,
                }
            }

        }
    })

    return redirect('/');
}

export async function createJobSeeker(data: z.infer<typeof jobSeekerSchema>) {
    const user = await requireUser();

    const validateData = jobSeekerSchema.parse(data);

    await prisma.user.update({
        where: {
            id: user.id as string
        },
        data: {
            onboardingCompleted: true,
            userType: 'JOB_SEEKER',
            JobSeeker: {
                create: {
                    ...validateData
                }
            }
        }
    })
    return redirect("/")
}

export async function createJob(data: z.infer<typeof jobSchema>) {
    const user = await requireUser();

    // protected
    const req = await request();

    const decision = await aj.protect(req);

    if (decision.isDenied()) {
        throw new Error("Forbidden")
    }
    const validateData = jobSchema.parse(data);

    const company = await prisma.company.findUnique({
        where: {
            userId: user.id
        },
        select: {
            id: true,
            user: {
                select: {
                    stripeCustomerId: true,
                }
            }
        }
    })
    if (!company?.id) {
        return redirect("/")
    }

    let stripeCustomerId = company.user.stripeCustomerId;


    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: user.email as string,
            name: user.name as string,
        });

        stripeCustomerId = customer.id;

        // update user with stripe customer id

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                stripeCustomerId: customer.id,
            },
        });
    }

    const jobPost = await prisma.jobPost.create({
        data: {
            companyId: company.id,
            jobDescription: validateData.jobDescription,
            jobTitle: validateData.jobTitle,
            employmentType: validateData.employmentType,
            location: validateData.location,
            salaryFrom: validateData.salaryFrom,
            salaryTo: validateData.salaryTo,
            listingDuration: validateData.listingDuration,
            benefits: validateData.benefits,
        },
        select: {
            id: true,
        }
    })

    const pricingTier = jobListingDurationPricing.find((tier) => tier.days == validateData.listingDuration);

    if (!pricingTier) {
        throw new Error("Invalid Listing duration selected")
    }

    //event trigger for job expiration
    await inngest.send({
        name: "job-expiration",
        data: {
            jobId: jobPost.id,
            expirationDays: validateData.listingDuration
        }
    })

    const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
            {
                price_data: {
                    product_data: {
                        name: `Job Posting - ${pricingTier.days} Days`,
                        description: pricingTier.description,
                        images: [
                            "https://4lcqsvpefs.ufs.sh/f/eQWxaovtJIWgalZcGWuhv65JlNEkKV0s4zATDfPGUBXt1CFM",
                        ],
                    },
                    currency: "INR",
                    unit_amount: pricingTier.price * 100,
                },
                quantity: 1,
            }
        ],
        metadata: {
            jobId: jobPost.id,
        },
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/payment/cancel`,
    })

    return redirect(session.url as string);
}

export async function savedJobPost(jobId: string) {
    const user = await requireUser();

    const req = await request();
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
        throw new Error("Forbidden");
    }

    await prisma.savedJobPost.create({
        data: {
            userId: user.id as string,
            jobPostId: jobId
        }
    })
    revalidatePath(`/job/${jobId}`)
}
export async function unSaveJobPost(savedJobPostId: string) {
    const user = await requireUser();

    const req = await request();
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
        throw new Error("Forbidden");
    }

    const data = await prisma.savedJobPost.delete({
        where: {
            id: savedJobPostId,
            userId: user.id as string
        },
        select: {
            jobPostId: true
        }
    })
    revalidatePath(`/job/${data.jobPostId}`)
}

export async function editJobPost(data: z.infer<typeof jobSchema>, jobId: string) {
    const user = await requireUser();
    const req = await request();
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
        throw new Error("Forbidden");
    }

    const validatedData = jobSchema.parse(data);

    await prisma.jobPost.update({
        where: {
            id: jobId,
            Company: {
                userId: user.id
            }
        },
        data: {
            jobDescription: validatedData.jobDescription,
            jobTitle: validatedData.jobTitle,
            employmentType: validatedData.employmentType,
            location: validatedData.location,
            salaryFrom: validatedData.salaryFrom,
            salaryTo: validatedData.salaryTo,
            listingDuration: validatedData.listingDuration,
            benefits: validatedData.benefits,
        }
    })
    return redirect('/my-jobs')

}

export async function deleteJobPost(jobId: string) {
    const session = await requireUser();
    const req = await request();
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
        throw new Error("Forbidden");
    }
    await prisma.jobPost.delete({
        where: {
            id: jobId,
            Company: {
                userId: session.id
            }
        },
    })

    await inngest.send({
        name: 'job/cancel.expiration',
        data: { jobId: jobId },
    })
    return redirect('/my-jobs')
}

export async function applyJob(data: z.infer<typeof jobSeekerSchema>, jobId: string) {
    const session = await requireUser();

    if (!session.id) {
        throw new Error("User not authenticated");
    }

    const req = await request();
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
        throw new Error("Forbidden");
    }
    const validateData = jobSeekerSchema.parse(data);

    // Check if user has already applied
    const existingApplication = await prisma.application.findFirst({
        where: {
            jobPostId: jobId,
            JobSeeker: {
                userId: session.id
            }
        }
    });

    if (existingApplication) {
        throw new Error("You have already applied to this job");
    }

    // Verifying if jobSeeker exists
    const jobSeeker = await prisma.jobSeeker.findUnique({
        where: {
            userId: session.id
        }
    });

    if (!jobSeeker) {
        throw new Error("Job seeker profile not found");
    }

    await prisma.application.create({
        data: {
            jobPostId: jobId,
            jobSeekerId: jobSeeker.id,
            name: validateData.name,
            about: validateData.about,
            resume: validateData.resume,
            status: "PENDING",
            currentRound: 0 // Start at round 0 
        },
        include: {
            JobPost: { 
                select: { jobTitle: true }
            }
        }
    });

    revalidatePath(`/job/${jobId}`);
    revalidatePath('/applications'); 
    return redirect("/applications");
}

// Helper function to create notifications
async function createNotification(userId: string, title: string, message: string, type: string, applicationId: string) {
    await prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type,
            applicationId,
        }
    });
    revalidatePath('/applications'); // Revalidate job seeker's application list
    revalidatePath('/dashboard/applications'); // Revalidate company's application list
}

// Shortlist an applicant for the first round of interviews
export async function shortlistApplicant(applicationId: string) {
    const companyUser = await requireUser();
    if (companyUser.userType !== UserType.COMPANY) throw new Error("Forbidden: Only companies can shortlist.");

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            JobPost: { include: { Company: true } },
            JobSeeker: { include: { user: true } }
        }
    });

    if (!application || application.JobPost.Company.userId !== companyUser.id) {
        throw new Error("Application not found or access denied.");
    }

    if (application.status !== ApplicationStatus.PENDING) {
        throw new Error("Application is not in PENDING state.");
    }

    const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: {
            status: ApplicationStatus.SHORTLISTED,
            currentRound: 1,
            InterviewRounds: {
                create: {
                    roundNumber: 1,
                    status: InterviewRoundStatus.PENDING, 
                }
            }
        },
        include: { JobPost: { select: { jobTitle: true } } } 
    });

    // Notify the job seeker
    await createNotification(
        application.JobSeeker.userId,
        "Application Update",
        `Congratulations! You've been shortlisted for Round 1 for the ${updatedApplication.JobPost.jobTitle} position.`,
        "ROUND_UPDATE",
        applicationId
    );

    revalidatePath(`/dashboard/applications`); // Revalidate company view
    revalidatePath(`/applications`); // Revalidate job seeker view
    return updatedApplication;
}

//Update the status of a specific interview round
export async function updateInterviewRoundStatus(
    roundId: string,
    status: InterviewRoundStatus,
    feedback?: string
) {
    const companyUser = await requireUser();
    if (companyUser.userType !== UserType.COMPANY) throw new Error("Forbidden: Only companies can update rounds.");

    const round = await prisma.interviewRound.findUnique({
        where: { id: roundId },
        include: {
            application: {
                include: {
                    JobPost: { include: { Company: true } },
                    JobSeeker: { include: { user: true } }
                }
            }
        }
    });

    if (!round || round.application.JobPost.Company.userId !== companyUser.id) {
        throw new Error("Interview round not found or access denied.");
    }

    // Update the round
    const updatedRound = await prisma.interviewRound.update({
        where: { id: roundId },
        data: {
            status: status,
            feedback: feedback,
        }
    });

    const application = round.application;
    const jobTitle = application.JobPost.jobTitle;
    const jobSeekerUserId = application.JobSeeker.userId;

    // Update application status and notify based on round outcome
    if (status === InterviewRoundStatus.QUALIFIED) {
        await prisma.application.update({
            where: { id: application.id },
            data: { status: ApplicationStatus.IN_PROGRESS }
        });
        await createNotification(
            jobSeekerUserId,
            "Interview Update",
            `Good news! You've qualified Round ${round.roundNumber} for the ${jobTitle} position.`,
            "ROUND_UPDATE",
            application.id
        );
    } else if (status === InterviewRoundStatus.NOT_QUALIFIED) {
        await prisma.application.update({
            where: { id: application.id },
            data: { status: ApplicationStatus.REJECTED }
        });
        await createNotification(
            jobSeekerUserId,
            "Application Update",
            `Regarding your application for ${jobTitle}: After careful consideration of Round ${round.roundNumber}, we've decided not to proceed further.`,
            "REJECTION",
            application.id
        );
    }

    revalidatePath(`/dashboard/applications`);
    revalidatePath(`/applications`);
    return updatedRound;
}

//Advance a qualified applicant to the next round
export async function advanceToNextRound(applicationId: string) {
    const companyUser = await requireUser();
    if (companyUser.userType !== UserType.COMPANY) throw new Error("Forbidden: Only companies can advance applicants.");

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            JobPost: { include: { Company: true } },
            JobSeeker: { include: { user: true } },
            InterviewRounds: {
                orderBy: { roundNumber: 'desc' }, 
                take: 1
            }
        }
    });

    if (!application || application.JobPost.Company.userId !== companyUser.id) {
        throw new Error("Application not found or access denied.");
    }

    const currentRound = application.InterviewRounds[0];
    if (!currentRound || currentRound.status !== InterviewRoundStatus.QUALIFIED) {
        throw new Error("Applicant must qualify the current round before advancing.");
    }

    const nextRoundNumber = currentRound.roundNumber + 1;

    // Update application and create the next round
    const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: {
            currentRound: nextRoundNumber,
            status: ApplicationStatus.IN_PROGRESS, // Ensure status is IN_PROGRESS
            InterviewRounds: {
                create: {
                    roundNumber: nextRoundNumber,
                    status: InterviewRoundStatus.PENDING,
                }
            }
        },
        include: { JobPost: { select: { jobTitle: true } } } 
    });

    // Notify the job seeker
    await createNotification(
        application.JobSeeker.userId,
        "Interview Update",
        `You've advanced to Round ${nextRoundNumber} for the ${updatedApplication.JobPost.jobTitle} position!`,
        "ROUND_UPDATE",
        applicationId
    );

    revalidatePath(`/dashboard/applications`);
    revalidatePath(`/applications`);
    return updatedApplication;
}

// Mark an applicant as selected
export async function selectCandidate(applicationId: string) {
    const companyUser = await requireUser();
    if (companyUser.userType !== UserType.COMPANY) throw new Error("Forbidden: Only companies can select candidates.");

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            JobPost: { include: { Company: true } },
            JobSeeker: { include: { user: true } }
        }
    });

    if (!application || application.JobPost.Company.userId !== companyUser.id) {
        throw new Error("Application not found or access denied.");
    }

    // Ensure the candidate has passed at least one round or is shortlisted
    if (application.status !== ApplicationStatus.IN_PROGRESS && application.status !== ApplicationStatus.SHORTLISTED) {
        throw new Error("Cannot select a candidate who is not currently in progress or shortlisted.");
    }

    const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.SELECTED },
        include: {
            JobPost: {
                select: {
                    Company:{
                        select: {
                            name:true
                        }
                    },
                    jobTitle: true
                }
            }
        }
    });

    // Notify the job seeker
    await createNotification(
        application.JobSeeker.userId,
        "Congratulations!",
        `We are pleased to inform you that you have been selected for the ${updatedApplication.JobPost.jobTitle} position! at ${updatedApplication.JobPost.Company.name}`,
        "SELECTION",
        applicationId
    );

    revalidatePath(`/dashboard/applications`);
    revalidatePath(`/applications`);
    return updatedApplication;
}

// reject candidate action
export async function rejectCandidate(applicationId: string) {
    const companyUser = await requireUser();
    if (companyUser.userType !== UserType.COMPANY) throw new Error("Forbidden: Only companies can reject candidates.");

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            JobPost: { include: { Company: true } },
            JobSeeker: { include: { user: true } }
        }
    });

    if (!application || application.JobPost.Company.userId !== companyUser.id) {
        throw new Error("Application not found or access denied.");
    }

    if (application.status === ApplicationStatus.PENDING || application.status === ApplicationStatus.SELECTED) {
        throw new Error("Cannot reject a candidate who is pending review or already selected.");
    }


    const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.REJECTED },
        include: { JobPost: { select: { jobTitle: true } } } // Include job title for notification
    });

    // Notify the job seeker
    await createNotification(
        application.JobSeeker.userId,
        "Application Update",
        `Regarding your application for ${updatedApplication.JobPost.jobTitle}: After careful consideration, we have decided not to move forward at this time.`,
        "REJECTION",
        applicationId
    );

    revalidatePath(`/dashboard/applications`);
    revalidatePath(`/applications`);
    return updatedApplication;
}


export type Notification = {
    id: string;
    userId: string;
    title: string;
    message: string;
    read: boolean;
    type: string;
    createdAt: Date;
    updatedAt: Date;
    applicationId?: string | null;
};


export async function getNotifications(userId: string): Promise<Notification[]> {
    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
            id: true,
            userId: true,
            title: true,
            message: true,
            read: true,
            type: true,
            createdAt: true,
            updatedAt: true,
            applicationId: true,
        }
    });

    return notifications;
}

export async function markNotificationAsRead(id: string) {
    await prisma.notification.update({
        where: { id },
        data: { read: true }
    });
    revalidatePath('/applications');
}

export async function markAllNotificationsAsRead(userId: string) {
    await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
    });
    revalidatePath('/applications');
}
export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    const updated = await prisma.application.update({
        where: { id: applicationId },
        data: { status }
    });

    // Create notification for status change
    await prisma.notification.create({
        data: {
            userId: updated.jobSeekerId,
            title: `Application ${status.toLowerCase()}`,
            message: `Your application status has been updated to ${status.toLowerCase()}`,
            type: 'APPLICATION_STATUS',
            applicationId: applicationId,
        }
    });

    revalidatePath('/applications');
    revalidatePath('/dashboard/applications');
    return updated;
}

export async function deleteApplication(applicationId: string) {
    try {
        const session = await requireUser();

        if (!session?.id) {
            throw new Error("Unauthorized");
        }

        // Verify the application belongs to the job seeker
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                JobSeeker: true
            }
        });

        if (!application || application.JobSeeker.userId !== session.id) {
            throw new Error("Forbidden: Cannot delete this application.");
        }

        // delete associated interview rounds and notifications to clean up
        await prisma.$transaction([
            prisma.interviewRound.deleteMany({ where: { applicationId: applicationId } }),
            prisma.notification.deleteMany({ where: { applicationId: applicationId, userId: session.id } }), // Delete seeker's notifications for this app
            prisma.application.delete({ where: { id: applicationId } })
        ]);


        revalidatePath('/applications');
        return { success: true };
    } catch (error) {
        console.error("Error deleting application:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete application" };
    }
}
