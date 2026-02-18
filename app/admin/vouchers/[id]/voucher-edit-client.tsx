"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Voucher } from "@/lib/api/types"
import VoucherForm from "../voucher-form"

export default function EditVoucherClient({ id }: { id: string }) {
    const [voucher, setVoucher] = useState<Voucher | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchVoucher = async () => {
            try {
                const token = localStorage.getItem("xuthi_auth_token")
                const response = await fetch(`/api/bff/api/vouchers/${id}`, {
                    headers: token
                        ? {
                              Authorization: `Bearer ${token}`,
                          }
                        : undefined,
                })

                if (!response.ok) {
                    throw new Error("Không thể tải voucher")
                }

                const data = await response.json()
                setVoucher(data?.voucher ?? data)
            } catch (error) {
                console.error("Failed to fetch voucher", error)
                toast.error("Không thể tải thông tin voucher")
            } finally {
                setLoading(false)
            }
        }

        fetchVoucher()
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải voucher...
            </div>
        )
    }

    if (!voucher) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Không tìm thấy voucher hoặc bạn không có quyền truy cập.
            </div>
        )
    }

    return <VoucherForm initialData={voucher} />
}
