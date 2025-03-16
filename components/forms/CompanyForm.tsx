"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { useState } from "react"
import { companySchema } from "@/app/utils/zodSchemas"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select"
import { countryList } from "@/app/utils/countriesList"
import { Textarea } from "../ui/textarea"
import { UploadDropzone } from "../general/UploadThingExport"
import { createCompany } from "@/app/actions"
import { Button } from "../ui/button"
import Image from "next/image"
import { XIcon } from "lucide-react"
import { toast } from "sonner"


export function CompanyForm() {
    const form = useForm<z.infer<typeof companySchema>>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: "",
            about: "",
            location: "",
            website: "",
            linkedin: "",
        },
    });

    const [pending, setPending] = useState(false);

    async function onSubmit(data: z.infer<typeof companySchema>) {
        try {
            setPending(true);
            await createCompany(data);
        } catch (error) {
            if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
                console.log("something went wrong");
            }
        } finally {
            setPending(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter company Name"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="location"
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
                                            <SelectLabel>🌍 Location</SelectLabel>
                                            {countryList.map((country) => (
                                                <SelectItem key={country.code} value={country.name}>
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
                        name="website"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website</FormLabel>
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
                        name="linkedin"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Linkedin Account</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="https://yourlinkedin.com"
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
                    name="about"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>About</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us about your company..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="logo"
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
                                        //For Uploading logo
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
                <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? "Submitting..." : "Continue"}
                </Button>
            </form>
        </Form>
    )
}