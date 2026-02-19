"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import {
    Package,
    ShoppingBag,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    RefreshCw,
    Eye,
    X,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BFF_API_ENDPOINT } from "@/lib/constants"

const API_URL = BFF_API_ENDPOINT

// Order summary from list endpoint
interface OrderSummary {
    id: string
    orderNumber: string
    customerName: string
    customerEmail: string
    total: number
    itemCount: number
    status: string
    paymentStatus: string
    paymentMethod: string
    createdAt: string
}

// Order detail from single order endpoint
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

interface OrderDetail {
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

interface OrdersResponse {
    orders: OrderSummary[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
}

const statusConfig: Record<
    string,
    { label: string; icon: any; color: string }
> = {
    pending: {
        label: "Chờ xác nhận",
        icon: Clock,
        color: "text-yellow-600 bg-yellow-50",
    },
    confirmed: {
        label: "Đã xác nhận",
        icon: CheckCircle,
        color: "text-blue-600 bg-blue-50",
    },
    processing: {
        label: "Đang xử lý",
        icon: Package,
        color: "text-blue-600 bg-blue-50",
    },
    shipped: {
        label: "Đang giao",
        icon: Truck,
        color: "text-purple-600 bg-purple-50",
    },
    delivered: {
        label: "Đã giao",
        icon: CheckCircle,
        color: "text-green-600 bg-green-50",
    },
    cancelled: {
        label: "Đã hủy",
        icon: XCircle,
        color: "text-red-600 bg-red-50",
    },
}

function formatCurrency(amount: number) {
    if (typeof amount !== "number" || isNaN(amount)) return "0 ₫"
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount)
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default function OrdersPage() {
    const { user, isAuthenticated, isLoading, token } = useAuth()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [orders, setOrders] = useState<OrderSummary[]>([])
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Modal state
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && !isLoading && !isAuthenticated) {
            router.push("/auth/login")
        }
    }, [mounted, isLoading, isAuthenticated, router])

    const fetchOrders = useCallback(async () => {
        if (!user?.email || !token) return

        setLoadingOrders(true)
        setError(null)

        try {
            const response = await fetch(
                `${API_URL}/api/orders?email=${encodeURIComponent(user.email)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            )

            if (response.ok) {
                const data: OrdersResponse = await response.json()
                setOrders(data.orders || [])
            } else if (response.status === 401) {
                setError("Phiên đăng nhập hết hạn")
            } else {
                setError("Không thể tải đơn hàng")
            }
        } catch (err) {
            console.error("Failed to fetch orders:", err)
            setError("Đã xảy ra lỗi khi tải đơn hàng")
        } finally {
            setLoadingOrders(false)
        }
    }, [user?.email, token])

    const fetchOrderDetail = async (orderId: string) => {
        setLoadingDetail(true)
        try {
            const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                // Backend may wrap in { order: ... } — unwrap if needed
                const order: OrderDetail = data.order ?? data
                if (!order || !order.id) {
                    alert("Không tìm thấy đơn hàng")
                    return
                }
                setSelectedOrder(order)
            } else if (response.status === 404) {
                alert("Không tìm thấy đơn hàng")
            } else {
                alert("Không thể tải chi tiết đơn hàng")
            }
        } catch (err) {
            console.error("Failed to fetch order detail:", err)
            alert("Đã xảy ra lỗi")
        } finally {
            setLoadingDetail(false)
        }
    }

    useEffect(() => {
        if (mounted && isAuthenticated && user?.email && token) {
            fetchOrders()
        }
    }, [mounted, isAuthenticated, user?.email, token, fetchOrders])

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    const selectedItems = selectedOrder?.items ?? []

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold">Đơn hàng của tôi</h1>
                </div>
                <button
                    onClick={fetchOrders}
                    disabled={loadingOrders}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    title="Tải lại"
                >
                    <RefreshCw
                        className={`w-5 h-5 ${loadingOrders ? "animate-spin" : ""}`}
                    />
                </button>
            </div>

            {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">
                        Đang tải đơn hàng...
                    </span>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={fetchOrders}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Thử lại
                    </button>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Chưa có đơn hàng
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm!
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Mua sắm ngay
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const statusKey =
                            order.status?.toLowerCase() || "pending"
                        const status =
                            statusConfig[statusKey] || statusConfig.pending
                        const StatusIcon = status.icon

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg shadow-md overflow-hidden"
                            >
                                <div className="p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                    <div>
                                        <span className="font-semibold text-lg">
                                            {order.orderNumber}
                                        </span>
                                        <span className="text-gray-500 text-sm ml-4">
                                            {formatDate(order.createdAt)}
                                        </span>
                                    </div>
                                    <div
                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.color}`}
                                    >
                                        <StatusIcon className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {status.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-gray-600">
                                                <span className="font-medium">
                                                    {order.itemCount}
                                                </span>{" "}
                                                sản phẩm
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Thanh toán:{" "}
                                                {order.paymentMethod === "0"
                                                    ? "COD"
                                                    : "Chuyển khoản"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-blue-600">
                                                {formatCurrency(order.total)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 border-t flex justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            fetchOrderDetail(order.id)
                                        }
                                        disabled={loadingDetail}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Xem chi tiết
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                Chi tiết đơn hàng {selectedOrder.orderNumber}
                            </h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const statusKey =
                                        selectedOrder.status?.toLowerCase() ||
                                        "pending"
                                    const status =
                                        statusConfig[statusKey] ||
                                        statusConfig.pending
                                    const StatusIcon = status.icon
                                    return (
                                        <span
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.color}`}
                                        >
                                            <StatusIcon className="w-4 h-4" />
                                            {status.label}
                                        </span>
                                    )
                                })()}
                            </div>

                            {/* Items */}
                            <div>
                                <h3 className="font-semibold mb-3">Sản phẩm</h3>
                                <div className="space-y-3">
                                    {selectedItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                                        >
                                            {item.imageUrl && (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.productName}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {item.productName}
                                                </p>
                                                {item.variantDescription && (
                                                    <p className="text-sm text-gray-500">
                                                        {
                                                            item.variantDescription
                                                        }
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-500">
                                                    SKU: {item.variantSku}
                                                </p>
                                                <div className="text-sm">
                                                    <div>
                                                        {formatCurrency(
                                                            item.unitPrice,
                                                        )}{" "}
                                                        x {item.quantity} ={" "}
                                                        {formatCurrency(
                                                            item.totalPrice,
                                                        )}
                                                    </div>
                                                    {item.compareAtPrice &&
                                                        item.compareAtPrice >
                                                            item.unitPrice && (
                                                            <div className="text-xs text-gray-400 line-through">
                                                                {formatCurrency(
                                                                    item.compareAtPrice,
                                                                )}{" "}
                                                                x{" "}
                                                                {item.quantity}{" "}
                                                                ={" "}
                                                                {formatCurrency(
                                                                    item.compareAtPrice *
                                                                        item.quantity,
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping Info */}
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Địa chỉ giao hàng
                                </h3>
                                <p className="text-gray-600">
                                    {selectedOrder.customerName} -{" "}
                                    {selectedOrder.customerPhone}
                                </p>
                                <p className="text-gray-600">
                                    {selectedOrder.shippingAddress},{" "}
                                    {selectedOrder.shippingWard},{" "}
                                    {selectedOrder.shippingDistrict},{" "}
                                    {selectedOrder.shippingCity}
                                </p>
                                {selectedOrder.shippingNote && (
                                    <p className="text-gray-500 italic">
                                        Ghi chú: {selectedOrder.shippingNote}
                                    </p>
                                )}
                            </div>

                            {/* Payment Summary */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Tạm tính:</span>
                                    <span>
                                        {formatCurrency(selectedOrder.subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Phí vận chuyển:</span>
                                    <span>
                                        {formatCurrency(
                                            selectedOrder.shippingFee,
                                        )}
                                    </span>
                                </div>
                                {(selectedOrder.discountAmount > 0 ||
                                    selectedOrder.voucherCode) && (
                                    <div className="flex justify-between text-sm text-green-600 mb-1">
                                        <span>
                                            Giảm giá
                                            {selectedOrder.voucherCode &&
                                                ` (${selectedOrder.voucherCode})`}
                                            :
                                        </span>
                                        <span>
                                            {selectedOrder.discountAmount > 0
                                                ? `-${formatCurrency(selectedOrder.discountAmount)}`
                                                : "Da ap dung"}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                                    <span>Tổng cộng:</span>
                                    <span className="text-blue-600">
                                        {formatCurrency(selectedOrder.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
