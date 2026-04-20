"use client"

import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

const API_URL = "/api/bff"

function buildOrdersRedirect(orderId: string | null) {
    const params = new URLSearchParams()

    if (orderId) {
        params.set("orderId", orderId)
    }

    params.set("payos", "cancel")

    return `/orders?${params.toString()}`
}

export default function PayOsCancelPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { token, isLoading } = useAuth()
    const handledRef = useRef(false)

    useEffect(() => {
        if (isLoading) {
            return
        }

        if (handledRef.current) {
            return
        }

        handledRef.current = true
        const orderId = searchParams.get("orderId")

        const finalize = async () => {
            try {
                if (orderId && token) {
                    await fetch(`${API_URL}/api/orders/${orderId}/cancel-payment`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            reason: "Khách hủy thanh toán từ cổng PayOS",
                        }),
                    })
                }
            } finally {
                router.replace(buildOrdersRedirect(orderId))
            }
        }

        void finalize()
    }, [isLoading, searchParams, token, router])

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-xl rounded-2xl border border-red-100 bg-white p-8 shadow-sm text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                    <AlertCircle className="h-7 w-7 text-red-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">Bạn đã hủy thanh toán</h1>
                <p className="mt-3 text-gray-600">Hệ thống đang cập nhật trạng thái đơn và chuyển bạn tới trang đơn hàng.</p>
                <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang xử lý...</span>
                </div>
            </div>
        </div>
    )
}
