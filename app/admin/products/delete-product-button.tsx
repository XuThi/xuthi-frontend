"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DeleteProductButton({
    productId,
    productName,
}: {
    productId: string
    productName: string
}) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    const onDelete = async () => {
        const confirmed = window.confirm(
            `Xóa sản phẩm \"${productName}\"? Hành động này không thể hoàn tác.`,
        )

        if (!confirmed) return

        try {
            setIsDeleting(true)
            const token = localStorage.getItem("xuthi_auth_token")

            const response = await fetch(`/api/bff/api/products/${productId}`, {
                method: "DELETE",
                headers: token
                    ? {
                          Authorization: `Bearer ${token}`,
                      }
                    : undefined,
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || "Delete failed")
            }

            router.refresh()
        } catch (error) {
            console.error("Delete product failed", error)
            window.alert(
                "Không thể xoá sản phẩm. Nếu sản phẩm đã nằm trong đơn hàng thì hệ thống sẽ chặn xoá.",
            )
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600"
            onClick={onDelete}
            disabled={isDeleting}
        >
            {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </Button>
    )
}
