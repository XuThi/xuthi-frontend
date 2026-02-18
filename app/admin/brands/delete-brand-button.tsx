"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const API_URL = "/api/bff"

export default function DeleteBrandButton({ id }: { id: string }) {
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm("Bạn chắc chắn muốn xóa thương hiệu này?")) return

        const token = localStorage.getItem("xuthi_auth_token")
        const response = await fetch(`${API_URL}/api/brands/${id}`, {
            method: "DELETE",
            headers: token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : undefined,
        })

        if (!response.ok) {
            alert("Không thể xóa thương hiệu.")
            return
        }

        router.refresh()
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={handleDelete}
        >
            Xóa
        </Button>
    )
}
