import { benefits } from "@/app/utils/listOfBenefits";
import { Badge } from "../ui/badge";
import { ControllerRenderProps } from "react-hook-form";

interface BenefitsSelectorProps {
    field: ControllerRenderProps;
}
export function BenefitsSelector({ field }: BenefitsSelectorProps) {

    // select and deselect the benefits
    function toggleBenefits(benefitId: string) {
        const currentBenefits = field.value || [];

        // To check if the benefit matches benefitId if not then deselect the benefits
        const newBenefits = currentBenefits.includes(benefitId) ?
            currentBenefits.filter((id: string) => id !== benefitId) : [...currentBenefits, benefitId];

        field.onChange(newBenefits)
    }

    return (
        <div>
            <div className="flex flex-wrap gap-3">
                {benefits.map((benefit) => {
                    const isSelected = (field.value || []).includes(benefit.id);
                    return (
                        <Badge className="cursor-pointer transition-all hover:scale-105 active:scale-95  text-sm px-4 py-1.5 rounded-full" key={benefit.id} variant={isSelected ? "default" : "outline"} onClick={() => toggleBenefits(benefit.id)}>
                            <span className="flex items-center gap-2">
                                {benefit.icon}
                                {benefit.label}
                            </span>
                        </Badge>
                    )
                })}
            </div>
            <div className="mt-4 text-md text-muted-foreground">
                Select Benefits : <span className="text-primary">{(field.value || []).length}</span>
            </div>
        </div>
    )
}