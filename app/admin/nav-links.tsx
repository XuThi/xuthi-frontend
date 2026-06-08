"use client"

import {
    LayoutDashboard,
    List,
    LogOut,
    type LucideIcon,
    MessageSquare,
    Package,
    Percent,
    Settings,
    ShoppingCart,
    Sliders,
    Tags,
    Ticket,
    Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"

type NavItem = {
    name: string
    href: string
    icon: LucideIcon
}

const mainLinks: NavItem[] = [
    { name: "Tổng quan", href: "/admin", icon: LayoutDashboard },
]

const catalogLinks: NavItem[] = [
    { name: "Sản phẩm", href: "/admin/products", icon: Package },
    { name: "Đánh giá", href: "/admin/reviews", icon: MessageSquare },
    { name: "Danh mục", href: "/admin/categories", icon: List },
    { name: "Thương hiệu", href: "/admin/brands", icon: Tags },
    { name: "Thuộc tính", href: "/admin/variant-options", icon: Sliders },
]

const salesLinks: NavItem[] = [
    { name: "Đơn hàng", href: "/admin/orders", icon: ShoppingCart },
    { name: "Khách hàng", href: "/admin/customers", icon: Users },
    { name: "Mã giảm giá", href: "/admin/vouchers", icon: Ticket },
    { name: "Sale campaign", href: "/admin/sale-campaigns", icon: Percent },
]

const settingsLinks: NavItem[] = [
    { name: "Cấu hình", href: "/admin/settings", icon: Settings },
]

function NavGroup({
    label,
    items,
    pathname,
}: {
    label?: string
    items: NavItem[]
    pathname: string
}) {
    return (
        <SidebarGroup>
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => {
                        const isActive =
                            item.href === "/admin"
                                ? pathname === "/admin"
                                : pathname.startsWith(item.href)
                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={item.name}
                                >
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.name}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { logout } = useAuth()

    const handleLogout = () => {
        logout()
        router.push("/")
        router.refresh()
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-border bg-white text-black">
                                    <Image
                                        src="https://res.cloudinary.com/dxlhncwp0/image/upload/v1769941817/logo_qlelti.svg"
                                        alt="XuThi"
                                        width={20}
                                        height={20}
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">
                                        XuThi Admin
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Quản lý cửa hàng
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavGroup items={mainLinks} pathname={pathname} />
                <NavGroup
                    label="Sản phẩm"
                    items={catalogLinks}
                    pathname={pathname}
                />
                <NavGroup
                    label="Bán hàng"
                    items={salesLinks}
                    pathname={pathname}
                />
                <NavGroup
                    label="Hệ thống"
                    items={settingsLinks}
                    pathname={pathname}
                />
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={handleLogout}
                            >
                                <LogOut />
                                <span>Đăng xuất</span>
                            </Button>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

export default function AdminNavLinks() {
    return null
}
