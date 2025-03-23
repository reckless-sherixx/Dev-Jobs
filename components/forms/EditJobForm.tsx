/* eslint-disable @typescript-eslint/no-explicit-any*/
"use client"
import { countryList } from "@/app/utils/countriesList";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { SalaryRangeSelector } from "../general/SalaryRangeSelector";
import { JobDescriptionEditor } from "../textEditor/JobDescriptionEditor";
import { BenefitsSelector } from "../general/BenefitsSelector";
import Image from "next/image";
import { Button } from "../ui/button";
import { XIcon } from "lucide-react";
import { UploadDropzone } from "../general/UploadThingExport";
import { jobSchema } from "@/app/utils/zodSchemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import {  editJobPost } from "@/app/actions";


interface EditJobFormProps {
    jobPost: {
        id: string;
        Company: {
            name: string;
            about: string;
            location: string;
            logo: string;
            website: string;
            linkedin: string | null;
        };
        jobTitle: string;
        employmentType: string;
        location: string;
        salaryFrom: number;
        salaryTo: number;
        jobDescription: string;
        listingDuration: number;
        benefits: string[];
    }
}

export function EditJobForm({ jobPost }: EditJobFormProps) {
    const form = useForm<z.infer<typeof jobSchema>>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            benefits: jobPost.benefits,
            companyName: jobPost.Company.name,
            companyLocation: jobPost.Company.location,
            companyAbout: jobPost.Company.about,
            companyLogo: jobPost.Company.logo,
            companyWebsite: jobPost.Company.website,
            companyLinkedin: jobPost.Company.linkedin || "",
            employmentType: jobPost.employmentType,
            jobTitle: jobPost.jobTitle,
            jobDescription: jobPost.jobDescription,
            listingDuration: jobPost.listingDuration,
            location: jobPost.location,
            salaryFrom: jobPost.salaryFrom,
            salaryTo: jobPost.salaryTo,
        }

    })
    const [pending, setPending] = useState(false);
    async function onSubmit(data: z.infer<typeof jobSchema>) {
        try {
            setPending(true);
            await editJobPost(data , jobPost.id);
        } catch (error) {
            if (error instanceof Error && error.message !== "NEXT_REDIRECT")
                toast.error("Something went wrong. Please try again.");
        } finally {
            setPending(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="col-span-1 lg:col-span-2 flex flex-col gap-8">
                {/* Job Details section */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Job Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="jobTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Job Title
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Job title" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="employmentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Employment Type
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Employment Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Employment Type</SelectLabel>
                                                    <SelectItem value="full-time">Full Time</SelectItem>
                                                    <SelectItem value="part-time">Part Time</SelectItem>
                                                    <SelectItem value="contract">Contract</SelectItem>
                                                    <SelectItem value="internship">Internship</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Job Location
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Location" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>🌍 Location</SelectLabel>
                                                    {countryList.map((country, index) => (
                                                        <SelectItem key={`job-location-${country.code}-${index}`} value={country.name}>
                                                            <span>{country.flagEmoji}</span>
                                                            <span className="pl-2">{country.name}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <FormLabel>SalaryRange</FormLabel>
                                <FormControl>
                                    <SalaryRangeSelector
                                        control={form.control}
                                        minSalary={10000}
                                        maxSalary={1000000}
                                        currency="INR"
                                        step={2000}
                                    />
                                </FormControl>
                            </FormItem>
                        </div>
                        <FormField
                            control={form.control}
                            name="jobDescription"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Job Description</FormLabel>
                                    <FormControl>
                                        <JobDescriptionEditor field={field as any} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="benefits"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Benefits</FormLabel>
                                    <FormControl>
                                        <BenefitsSelector field={field as any} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Company Details section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Company name..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="companyLocation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Location</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Location" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel className="pb-2">🌍 Location</SelectLabel>
                                                    {countryList.map((country, index) => (
                                                        <SelectItem key={`company-location-${country.code}-${index}`} value={country.name}>
                                                            <span>{country.flagEmoji}</span>
                                                            <span className="pl-2">{country.name}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="companyWebsite"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Website</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="https://companyname.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="companyLinkedin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company&apos;s Linkedin Account</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="https://companylinkedin.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="companyAbout"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Say something about your company..."
                                            {...field}
                                            className="min-h-[120px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="companyLogo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Logo</FormLabel>
                                    <FormControl>
                                        <div>
                                            {field.value ? (
                                                <div className="relative w-fit">
                                                    <Image
                                                        src={field.value}
                                                        alt="Company Logo"
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
                                                //For image uploading feature
                                                <UploadDropzone
                                                    endpoint="imageUploader"
                                                    onClientUploadComplete={(res) => {
                                                        field.onChange(res[0].ufsUrl);
                                                        toast.success("Logo uploaded successfully!");
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
                    </CardContent>
                </Card>
                <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? "Submitting..." : "Edit Job Post"}
                </Button>
            </form>
        </Form>
    )
}