"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import EditSaleCampaignClient from "./sale-campaign-edit-client"

export default function EditSaleCampaignPage() {
    const params = useParams<{ id: string }>()
    const id = params?.id

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/sale-campaigns">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Sửa Sale Campaign</h1>
            </div>

            {id ? (
                <EditSaleCampaignClient id={id} />
            ) : (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Không tìm thấy sale campaign.
                </div>
            )}
        </div>
    )
}
