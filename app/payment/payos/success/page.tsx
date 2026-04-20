"use client"

import { clearCartAction } from "@/app/cart/actions"
import { useCart } from "@/app/cart/cart-context"
import { useAuth } from "@/lib/auth-context"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

const API_URL = "/api/bff"

function buildOrdersRedirect(orderId: string | null, status: "success" | "cancel") {
    const params = new URLSearchParams()

    if (orderId) {
        params.set("orderId", orderId)
    }

    params.set("payos", status)

    return `/orders?${params.toString()}`
}

export default function PayOsSuccessPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { token, isLoading } = useAuth()
    const { cart, clearCart } = useCart()
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
                const cartId = cart?.id

                if (token && cartId && cartId !== "optimistic") {
                    await fetch(`${API_URL}/api/cart/${cartId}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    })
                }

                await clearCartAction()
                clearCart()
            } finally {
                router.replace(buildOrdersRedirect(orderId, "success"))
            }
        }

        void finalize()
    }, [isLoading, searchParams, token, cart?.id, clearCart, router])

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-xl rounded-2xl border border-green-100 bg-white p-8 shadow-sm text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">Thanh toán thành công</h1>
                <p className="mt-3 text-gray-600">Hệ thống đang xác nhận đơn và chuyển bạn tới trang đơn hàng.</p>
                <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang xử lý...</span>
                </div>
            </div>
        </div>
    )
}
