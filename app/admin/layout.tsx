"use client"

import { AdminSidebar } from "@/app/admin/nav-links"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4!" />
                    <span className="text-sm font-medium text-muted-foreground">
                        XuThi Admin
                    </span>
                    <div className="ml-auto">
                        <ThemeToggle />
                    </div>
                </header>
                <div className="flex-1 p-6 md:p-8">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    )
}
