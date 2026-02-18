"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { SaleCampaignDetail } from "@/lib/api/types"
import SaleCampaignForm from "../sale-campaign-form"

export default function EditSaleCampaignClient({ id }: { id: string }) {
    const [campaign, setCampaign] = useState<SaleCampaignDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const token = localStorage.getItem("xuthi_auth_token")
                const response = await fetch(
                    `/api/bff/api/sale-campaigns/${id}`,
                    {
                        headers: token
                            ? {
                                  Authorization: `Bearer ${token}`,
                              }
                            : undefined,
                    },
                )

                if (!response.ok) {
                    throw new Error("Không thể tải sale campaign")
                }

                const data = await response.json()
                setCampaign(data.campaign || data)
            } catch (error) {
                console.error("Failed to fetch sale campaign", error)
                toast.error("Không thể tải thông tin sale campaign")
            } finally {
                setLoading(false)
            }
        }

        fetchCampaign()
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải sale campaign...
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Không tìm thấy sale campaign hoặc bạn không có quyền truy cập.
            </div>
        )
    }

    return <SaleCampaignForm initialData={campaign} />
}
