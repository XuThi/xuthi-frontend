"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api/client"
import type { Product } from "@/lib/api/types"
import ProductForm from "../product-form"

export default function EditProductPage() {
    const params = useParams<{ id: string }>()
    const id = params?.id
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            if (!id) return
            setLoading(true)
            const result = await api.productGet({ idOrSlug: id })
            setProduct(result)
            setLoading(false)
        }
        load()
    }, [id])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Chỉnh sửa sản phẩm</h1>
                <p className="text-muted-foreground">
                    Cập nhật thông tin sản phẩm.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang
                    tải...
                </div>
            ) : product ? (
                <ProductForm initialData={product} />
            ) : (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Không tìm thấy sản phẩm.
                </div>
            )}
        </div>
    )
}
