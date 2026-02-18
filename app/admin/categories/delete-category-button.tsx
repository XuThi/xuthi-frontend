"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

const API_URL = "/api/bff"

export default function DeleteCategoryButton({ id }: { id: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("xuthi_auth_token")
            const response = await fetch(`${API_URL}/api/categories/${id}`, {
                method: "DELETE",
                headers: token
                    ? {
                          Authorization: `Bearer ${token}`,
                      }
                    : undefined,
            })

            if (!response.ok) {
                const errorText = await response.text()
                let errorMessage = "Không thể xóa danh mục."

                if (errorText) {
                    try {
                        const parsed = JSON.parse(errorText)
                        errorMessage =
                            parsed.detail ||
                            parsed.message ||
                            parsed.title ||
                            errorMessage
                    } catch {
                        errorMessage = errorText
                    }
                }

                toast.error(errorMessage)
                return
            }

            toast.success("Đã xóa danh mục")
            router.refresh()
        } catch (error) {
            console.error("Delete category error", error)
            toast.error("Có lỗi mạng khi xóa danh mục")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600"
                    disabled={loading}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Nếu danh mục còn sản
                        phẩm, hệ thống sẽ từ chối xóa và hiển thị lý do chi
                        tiết.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                        Xóa
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
