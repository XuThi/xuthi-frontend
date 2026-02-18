"use client"

import { Suspense } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Suspense>
            <AuthProvider>
                {children}
                <Toaster richColors position="top-right" />
            </AuthProvider>
        </Suspense>
    )
}
