"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import type { CustomerDetail, Order } from "@/lib/api/types"

interface OrderApiResponse {
    orders: Order[]
}

function normalizeTier(tier: unknown) {
    return String(tier ?? "").toLowerCase()
}

function getTierBadgeClass(tier: unknown) {
    switch (normalizeTier(tier)) {
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

export default function CustomerDetailPage() {
    const params = useParams<{ id: string }>()
    const customerId = params?.id

    const [loading, setLoading] = useState(true)
    const [customer, setCustomer] = useState<CustomerDetail | null>(null)
    const [orders, setOrders] = useState<Order[]>([])

    useEffect(() => {
        const fetchData = async () => {
            if (!customerId) return

            setLoading(true)
            try {
                const token = localStorage.getItem("xuthi_auth_token")
                const headers = token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined

                const [customerRes, ordersRes] = await Promise.all([
                    fetch(`/api/bff/api/customers/${customerId}`, { headers }),
                    fetch(`/api/bff/api/orders`, { headers }),
                ])

                if (customerRes.ok) {
                    const customerData = await customerRes.json()
                    setCustomer(customerData.customer || customerData)
                }

                if (ordersRes.ok) {
                    const orderData: OrderApiResponse = await ordersRes.json()
                    setOrders(orderData.orders || [])
                }
            } catch (error) {
                console.error("Failed to fetch customer detail", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [customerId])

    const customerOrders = useMemo(() => {
        if (!customer?.email) return []
        return orders.filter(
            (order) =>
                order.customerEmail?.toLowerCase() ===
                customer.email.toLowerCase(),
        )
    }, [orders, customer?.email])

    const computedTotalSpent = customerOrders
        .filter((order) => order.status?.toLowerCase() !== "cancelled")
        .reduce((sum, order) => sum + order.total, 0)

    const computedTotalOrders = customerOrders.filter(
        (order) => order.status?.toLowerCase() !== "cancelled",
    ).length

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!customer) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                Không tìm thấy khách hàng hoặc bạn không có quyền truy cập.
            </div>
        )
    }

    const addresses = customer.addresses ?? []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{customer.fullName}</h1>
                    <p className="text-muted-foreground">
                        Tham gia ngày{" "}
                        {new Date(customer.createdAt).toLocaleDateString(
                            "vi-VN",
                        )}
                    </p>
                </div>
                <Badge
                    variant="outline"
                    className={`text-base px-4 py-1 ${getTierBadgeClass(customer.tier)}`}
                >
                    {String(customer.tier ?? "")}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin cá nhân</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium">Email</div>
                                <div className="text-muted-foreground">
                                    {customer.email}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">
                                    Số điện thoại
                                </div>
                                <div className="text-muted-foreground">
                                    {customer.phone || "Chưa cập nhật"}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium">
                                    Ngày sinh
                                </div>
                                <div className="text-muted-foreground">
                                    {customer.dateOfBirth
                                        ? new Date(
                                              customer.dateOfBirth,
                                          ).toLocaleDateString("vi-VN")
                                        : "Chưa cập nhật"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Chỉ số mua sắm</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span>Tổng chi tiêu</span>
                                <span className="font-bold">
                                    {new Intl.NumberFormat("vi-VN", {
                                        style: "currency",
                                        currency: "VND",
                                    }).format(
                                        computedTotalSpent ||
                                            customer.totalSpent,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Số đơn hàng</span>
                                <span className="font-bold">
                                    {computedTotalOrders ||
                                        customer.totalOrders}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Điểm tích lũy</span>
                                <span className="font-bold">
                                    {customer.loyaltyPoints}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Giảm giá hạng thành viên</span>
                                <span className="font-bold">
                                    {customer.tierDiscountPercentage}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Địa chỉ ({addresses.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {addresses.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Chưa có địa chỉ nào.
                                </p>
                            ) : (
                                addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className="border-b last:border-0 pb-2 last:pb-0"
                                    >
                                        <div className="font-medium flex items-center gap-2">
                                            {addr.label}
                                            {addr.isDefault && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                >
                                                    Mặc định
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {addr.recipientName} - {addr.phone}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {addr.address}, {addr.ward},{" "}
                                            {addr.district}, {addr.city}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Lịch sử đơn hàng ({customerOrders.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã đơn</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Tổng tiền</TableHead>
                                <TableHead className="text-right">
                                    Chi tiết
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customerOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-20 text-center text-muted-foreground"
                                    >
                                        Chưa có đơn hàng nào.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customerOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">
                                            {order.orderNumber}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                order.createdAt,
                                            ).toLocaleString("vi-VN")}
                                        </TableCell>
                                        <TableCell>{order.status}</TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat("vi-VN", {
                                                style: "currency",
                                                currency: "VND",
                                            }).format(order.total)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                Xem
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
