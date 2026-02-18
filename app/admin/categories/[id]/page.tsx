"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api/client"
import type { Category } from "@/lib/api/types"
import CategoryForm from "../category-form"

export default function EditCategoryPage() {
    const params = useParams<{ id: string }>()
    const id = params?.id
    const [category, setCategory] = useState<Category | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            if (!id) return
            setLoading(true)
            const result = await api.categoryGet({ idOrSlug: id })
            setCategory(result)
            setLoading(false)
        }
        load()
    }, [id])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Chỉnh sửa danh mục</h1>
            </div>

            {loading ? (
                <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang
                    tải...
                </div>
            ) : category ? (
                <CategoryForm initialData={category} />
            ) : (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Không tìm thấy danh mục.
                </div>
            )}
        </div>
    )
}
