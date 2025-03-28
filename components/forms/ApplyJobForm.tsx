
"use client"
import { applyJob } from "@/app/actions";
import { jobSeekerSchema } from "@/app/utils/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { UploadDropzone } from "../general/UploadThingExport";
import { XIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import pdfImage from "@/public/pdf.png"
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";


interface ApplyJobFormProps {
    jobSeeker: {
        id: string;
        name: string;
        about: string;
        resume: string;
    },
    jobId: string;
}

export function ApplyJobForm({ jobSeeker, jobId }: ApplyJobFormProps) {
    const form = useForm<z.infer<typeof jobSeekerSchema>>({
        resolver: zodResolver(jobSeekerSchema),
        defaultValues: {
            name: jobSeeker.name,
            about: jobSeeker.about,
            resume: jobSeeker.resume,
        }
    })
    const [pending, setPending] = useState(false);
    
    async function onSubmit(data: z.infer<typeof jobSeekerSchema>) {
        try {
            setPending(true);
            await applyJob(data, jobId);
        } catch (error) {
            console.error("Application error:", error);
            if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
                toast.error("Something went wrong. Please try again.");
            }
        } finally {
            setPending(false);
        }
    }
    
    return (
        <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter your full name"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="about"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>About You</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us about yourself"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="resume"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Resume (PDF)</FormLabel>
                            <FormControl>
                                <div>
                                    {field.value ? (
                                        <div className="relative w-fit">
                                            <Image
                                                src={pdfImage}
                                                alt="pdf resume image"
                                                width={100}
                                                height={100}
                                                className="rounded-lg"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 "
                                                onClick={() => field.onChange("")}
                                            >
                                                <XIcon className="h-2 w-2" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <UploadDropzone
                                            endpoint="resumeUploader"
                                            onClientUploadComplete={(res) => {
                                                field.onChange(res[0].ufsUrl);
                                                toast.success("PDF uploaded successfully!");
                                            }}
                                            onUploadError={() => {
                                                toast.error("Something went wrong. Please try again.");
                                            }}
                                            className="ut-button:bg-primary ut-button:text-white ut-button:hover:bg-primary/90 ut-label:text-muted-foreground ut-allowed-content:text-muted-foreground border-primary"
                                        />
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    className="w-full"
                    disabled={pending}>
                    {pending ? 'Applying...' : "Apply"}
                </Button>
            </form>
        </Form>
    )
}
