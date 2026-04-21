"use client"

import { Suspense } from "react"
import { AuthProvider } from "@/lib/auth-context"
import {
    CurrencyProvider,
} from "@/lib/currency-provider"
import type { SupportedCurrency } from "@/lib/currency"
import { Toaster } from "@/components/ui/sonner"

export function Providers({
    children,
    initialCurrency,
}: {
    children: React.ReactNode
    initialCurrency?: SupportedCurrency
}) {
    return (
        <Suspense>
            <CurrencyProvider initialCurrency={initialCurrency}>
                <AuthProvider>
                    {children}
                    <Toaster richColors position="top-right" />
                </AuthProvider>
            </CurrencyProvider>
        </Suspense>
    )
}
