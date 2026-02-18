"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import type { Brand } from "@/lib/api/types"
import BrandForm from "../brand-form"

export default function EditBrandPage() {
    const params = useParams<{ id: string }>()
    const id = params?.id
    const [brand, setBrand] = useState<Brand | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            if (!id) return
            setLoading(true)
            const result = await api.brandGet(id)
            setBrand(result)
            setLoading(false)
        }
        load()
    }, [id])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/brands">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Sửa thương hiệu</h1>
            </div>

            {loading ? (
                <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang
                    tải...
                </div>
            ) : brand ? (
                <BrandForm initialData={brand} />
            ) : (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Không tìm thấy thương hiệu.
                </div>
            )}
        </div>
    )
}
