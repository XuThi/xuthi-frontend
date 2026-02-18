"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ArrowLeft,
    Loader2,
    Package,
    Truck,
    CheckCircle,
    XCircle,
    Clock,
} from "lucide-react"
import Link from "next/link"

const API_URL = "/api/bff"

interface OrderItem {
    id: string
    productId: string
    variantId: string
    productName: string
    variantSku: string
    variantDescription?: string
    imageUrl?: string
    unitPrice: number
    compareAtPrice?: number
    quantity: number
    totalPrice: number
}

interface Order {
    id: string
    orderNumber: string
    customerName: string
    customerEmail: string
    customerPhone: string
    shippingAddress: string
    shippingCity: string
    shippingDistrict: string
    shippingWard: string
    shippingNote?: string
    subtotal: number
    discountAmount: number
    shippingFee: number
    total: number
    voucherCode?: string
    status: string
    paymentStatus: string
    paymentMethod: string
    createdAt: string
    items: OrderItem[]
}

const statusOptions = [
    {
        value: "Pending",
        label: "Chờ xác nhận",
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800",
    },
    {
        value: "Confirmed",
        label: "Đã xác nhận",
        icon: CheckCircle,
        color: "bg-blue-100 text-blue-800",
    },
    {
        value: "Processing",
        label: "Đang xử lý",
        icon: Package,
        color: "bg-blue-100 text-blue-800",
    },
    {
        value: "Shipped",
        label: "Đang giao",
        icon: Truck,
        color: "bg-purple-100 text-purple-800",
    },
    {
        value: "Delivered",
        label: "Đã giao",
        icon: CheckCircle,
        color: "bg-green-100 text-green-800",
    },
    {
        value: "Cancelled",
        label: "Đã hủy",
        icon: XCircle,
        color: "bg-red-100 text-red-800",
    },
]

const statusSequence = [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Delivered",
] as const

function getStatusButtonClass(
    statusColor: string,
    isActive: boolean,
    isDisabled: boolean,
) {
    const tone = statusColor.replace("bg-", "border-")

    if (isActive) {
        return `${statusColor} ${tone} border`
    }

    if (isDisabled) {
        return "opacity-50 cursor-not-allowed"
    }

    return `${statusColor} ${tone} border opacity-90 hover:opacity-100`
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount)
}

export default function OrderDetailPage() {
    const router = useRouter()
    const params = useParams()
    const orderId = params.id as string

    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (orderId) {
            fetchOrder()
        }
    }, [orderId])

    const fetchOrder = async () => {
        setLoading(true)
        setError(null)

        try {
            const token = localStorage.getItem("xuthi_auth_token")
            const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                // Backend may wrap in { order: ... } — unwrap if needed
                const order: Order = data.order ?? data
                setOrder(order)
            } else if (response.status === 404) {
                setError("Không tìm thấy đơn hàng")
            } else {
                setError("Không thể tải đơn hàng")
            }
        } catch (err) {
            console.error("Failed to fetch order:", err)
            setError("Đã xảy ra lỗi")
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (newStatus: string) => {
        if (!order) return

        setUpdating(true)

        try {
            const token = localStorage.getItem("xuthi_auth_token")
            // Map status string to enum value
            const statusMap: Record<string, number> = {
                Pending: 1,
                Confirmed: 2,
                Processing: 3,
                Shipped: 4,
                Delivered: 5,
                Cancelled: 6,
            }

            const response = await fetch(
                `${API_URL}/api/orders/${orderId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status: statusMap[newStatus],
                    }),
                },
            )

            if (response.ok) {
                // Refresh order data
                fetchOrder()
            } else {
                const errorData = await response.json().catch(() => ({}))
                alert(errorData.detail || "Cập nhật thất bại")
            }
        } catch (err) {
            console.error("Failed to update status:", err)
            alert("Đã xảy ra lỗi")
        } finally {
            setUpdating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3">Đang tải...</span>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="text-center py-20">
                <p className="text-red-600 mb-4">
                    {error || "Không tìm thấy đơn hàng"}
                </p>
                <Link href="/admin/orders">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại danh sách
                    </Button>
                </Link>
            </div>
        )
    }

    const currentStatus =
        statusOptions.find((s) => s.value === order.status) || statusOptions[0]
    const currentStatusIndex = statusSequence.indexOf(
        order.status as (typeof statusSequence)[number],
    )

    const canTransitionTo = (nextStatus: string) => {
        if (nextStatus === order.status) return false

        if (order.status === "Cancelled" || order.status === "Delivered") {
            return false
        }

        if (nextStatus === "Cancelled") {
            return ["Pending", "Confirmed", "Processing"].includes(order.status)
        }

        const nextIndex = statusSequence.indexOf(
            nextStatus as (typeof statusSequence)[number],
        )

        if (currentStatusIndex < 0 || nextIndex < 0) return false
        return nextIndex === currentStatusIndex + 1
    }
    const orderItems = order.items ?? []

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/orders">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">
                        Đơn hàng #{order.orderNumber}
                    </h1>
                    <p className="text-muted-foreground">
                        Đặt ngày{" "}
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                </div>
                <Badge className={`text-base px-4 py-1 ${currentStatus.color}`}>
                    {currentStatus.label}
                </Badge>
            </div>

            {/* Status Update */}
            <Card>
                <CardHeader>
                    <CardTitle>Cập nhật trạng thái</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {statusOptions.map((status) => {
                            const StatusIcon = status.icon
                            const isActive = order.status === status.value
                            const isDisabled =
                                updating ||
                                isActive ||
                                !canTransitionTo(status.value)

                            return (
                                <Button
                                    key={status.value}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateStatus(status.value)}
                                    disabled={isDisabled}
                                    className={getStatusButtonClass(
                                        status.color,
                                        isActive,
                                        isDisabled,
                                    )}
                                >
                                    <StatusIcon className="w-4 h-4 mr-2" />
                                    {status.label}
                                </Button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Chi tiết sản phẩm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sản phẩm</TableHead>
                                        <TableHead className="text-right">
                                            Giá
                                        </TableHead>
                                        <TableHead className="text-right">
                                            SL
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Tổng
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {item.imageUrl && (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={
                                                                item.productName
                                                            }
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">
                                                            {item.productName}
                                                        </div>
                                                        {item.variantDescription && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {
                                                                    item.variantDescription
                                                                }
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-400">
                                                            SKU:{" "}
                                                            {item.variantSku}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div>
                                                    {formatCurrency(
                                                        item.unitPrice,
                                                    )}
                                                </div>
                                                {item.compareAtPrice &&
                                                    item.compareAtPrice >
                                                        item.unitPrice && (
                                                        <div className="text-xs text-muted-foreground line-through">
                                                            {formatCurrency(
                                                                item.compareAtPrice,
                                                            )}
                                                        </div>
                                                    )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    item.totalPrice,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Payment Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thanh toán</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span>Tạm tính</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Phí vận chuyển</span>
                                <span>{formatCurrency(order.shippingFee)}</span>
                            </div>
                            {order.discountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>
                                        Giảm giá
                                        {order.voucherCode &&
                                            ` (${order.voucherCode})`}
                                    </span>
                                    <span>
                                        -{formatCurrency(order.discountAmount)}
                                    </span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Tổng cộng</span>
                                <span>{formatCurrency(order.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Phương thức</span>
                                <span>
                                    {order.paymentMethod === "0"
                                        ? "COD"
                                        : "Chuyển khoản"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Customer Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Khách hàng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="font-medium">
                                        Thông tin liên hệ
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {order.customerName}
                                        <br />
                                        {order.customerEmail}
                                        <br />
                                        {order.customerPhone}
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <div className="font-medium">
                                        Địa chỉ giao hàng
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {order.shippingAddress}
                                        <br />
                                        {order.shippingWard},{" "}
                                        {order.shippingDistrict}
                                        <br />
                                        {order.shippingCity}
                                    </div>
                                    {order.shippingNote && (
                                        <div className="text-sm text-muted-foreground mt-2">
                                            <span className="font-medium">
                                                Ghi chú:
                                            </span>{" "}
                                            {order.shippingNote}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
