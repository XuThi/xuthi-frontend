"use client"

import { useCurrency } from "@/lib/currency-provider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function FooterCurrencySwitcher() {
    const { currency, options, isUpdating, setCurrency } = useCurrency()

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="footer-currency-trigger" className="text-xs text-footer-muted">
                Tiền tệ:
            </label>
            <Select
                value={currency}
                onValueChange={(value) =>
                    setCurrency(value as (typeof options)[number]["code"])
                }
                disabled={isUpdating}
            >
                <SelectTrigger
                    id="footer-currency-trigger"
                    className="h-9 w-50 border-footer-border bg-footer-bg text-xs text-footer-text focus-visible:border-ring"
                    size="sm"
                >
                    <SelectValue placeholder="Chọn tiền tệ" />
                </SelectTrigger>
                <SelectContent align="end">
                    {options.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
