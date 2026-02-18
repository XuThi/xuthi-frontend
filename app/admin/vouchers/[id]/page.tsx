"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import EditVoucherClient from "./voucher-edit-client"

export default function EditVoucherPage() {
    const params = useParams<{ id: string }>()
    const id = params?.id

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/vouchers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Sửa Voucher</h1>
            </div>

            {id ? (
                <EditVoucherClient id={id} />
            ) : (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Không tìm thấy mã voucher.
                </div>
            )}
        </div>
    )
}
