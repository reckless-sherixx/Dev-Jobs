import { serve } from "inngest/next";
import { inngest } from "@/app/utils/inngest/client";
import { handleJobExpiration, sendPeriodicJobListings } from "./function";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [handleJobExpiration , sendPeriodicJobListings],
});
