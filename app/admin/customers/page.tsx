"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, Loader2, MoreHorizontal, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const API_URL = "/api/bff"

interface Customer {
    id: string
    fullName: string
    email: string
    phone?: string
    tier: string
    totalOrders: number
    totalSpent: number
    createdAt: string
}

interface Order {
    id: string
    customerEmail: string
    status: string
    total: number
}

function getTierBadgeClass(tier: unknown) {
    switch (String(tier ?? "").toLowerCase()) {
        case "platinum":
            return "bg-purple-100 text-purple-800 border-purple-300"
        case "gold":
            return "bg-amber-100 text-amber-800 border-amber-300"
        case "silver":
            return "bg-slate-100 text-slate-800 border-slate-300"
        default:
            return "bg-blue-100 text-blue-800 border-blue-300"
    }
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const token = localStorage.getItem("xuthi_auth_token")
                const res = await fetch(`${API_URL}/api/customers`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (res.ok) {
                    const data = await res.json()
                    const baseCustomers = data.customers || []

                    const orderResponse = await fetch(`${API_URL}/api/orders`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    })

                    if (!orderResponse.ok) {
                        setCustomers(baseCustomers)
                        return
                    }

                    const orderData = await orderResponse.json()
                    const orders: Order[] = orderData.orders || []

                    const byEmail = new Map<
                        string,
                        { totalOrders: number; totalSpent: number }
                    >()

                    orders.forEach((order) => {
                        const email = order.customerEmail?.toLowerCase()
                        if (
                            !email ||
                            order.status?.toLowerCase() === "cancelled"
                        ) {
                            return
                        }

                        const current = byEmail.get(email) || {
                            totalOrders: 0,
                            totalSpent: 0,
                        }

                        byEmail.set(email, {
                            totalOrders: current.totalOrders + 1,
                            totalSpent: current.totalSpent + order.total,
                        })
                    })

                    const enriched = baseCustomers.map((customer: Customer) => {
                        const metrics = byEmail.get(
                            customer.email.toLowerCase(),
                        )
                        return {
                            ...customer,
                            totalOrders:
                                metrics?.totalOrders && metrics.totalOrders > 0
                                    ? metrics.totalOrders
                                    : customer.totalOrders,
                            totalSpent:
                                metrics?.totalSpent && metrics.totalSpent > 0
                                    ? metrics.totalSpent
                                    : customer.totalSpent,
                        }
                    })

                    setCustomers(enriched)
                }
            } catch (err) {
                console.error("Failed to fetch customers:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchCustomers()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className="text-2xl font-bold">Quản lý khách hàng</h1>
            </div>

            <div className="mt-8 rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên khách hàng</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Cấp độ</TableHead>
                            <TableHead>Đơn hàng</TableHead>
                            <TableHead>Chi tiêu</TableHead>
                            <TableHead>Ngày tham gia</TableHead>
                            <TableHead className="text-right">
                                Hành động
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center h-24"
                                >
                                    Chưa có khách hàng nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{c.fullName}</span>
                                            {c.phone && (
                                                <span className="text-xs text-muted-foreground">
                                                    {c.phone}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{c.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={getTierBadgeClass(
                                                c.tier,
                                            )}
                                        >
                                            {c.tier}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{c.totalOrders}</TableCell>
                                    <TableCell>
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(c.totalSpent)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            c.createdAt,
                                        ).toLocaleDateString("vi-VN")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={`/admin/customers/${c.id}`}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Xem chi tiết
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        href={`/admin/orders?email=${encodeURIComponent(c.email)}`}
                                                    >
                                                        <Receipt className="mr-2 h-4 w-4" />
                                                        Xem đơn hàng
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
