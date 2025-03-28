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

    // First verify the JobSeeker exists
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
            status: "PENDING"
        }
    });

    revalidatePath(`/job/${jobId}`);
    return redirect("/applications");
}

export async function updateApplicationStatus(
    applicationId: string, 
    status: "ACCEPTED" | "REJECTED"
) {
    const session = await requireUser();

    if (!session.id) {
        throw new Error("User not authenticated");
    }

    await prisma.application.update({
        where: {
            id: applicationId,
            JobPost: {
                Company: {
                    userId: session.id
                }
            }
        },
        data: {
            status
        }
    });

    revalidatePath('/dashboard/applications');
}