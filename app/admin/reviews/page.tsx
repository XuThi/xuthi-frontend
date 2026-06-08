"use client"

import { MessageSquare, Star, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const API_URL = "/api/bff"

interface Review {
    id: string
    productId: string
    productName: string
    authorName: string
    authorEmail: string
    rating: number
    comment?: string | null
    isApproved: boolean
    createdAt: string
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchReviews = useCallback(async () => {
        setLoading(true)

        try {
            const token = localStorage.getItem("xuthi_auth_token")
            const response = await fetch(`${API_URL}/api/admin/reviews`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                toast.error("Không thể tải danh sách đánh giá")
                return
            }

            const data = await response.json()
            setReviews(data.reviews || [])
        } catch (error) {
            console.error("Failed to fetch reviews:", error)
            toast.error("Đã xảy ra lỗi khi tải đánh giá")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void fetchReviews()
    }, [fetchReviews])

    const deleteReview = async (review: Review) => {
        const confirmed = window.confirm(
            `Xóa đánh giá của ${review.authorName} cho sản phẩm "${review.productName}"?`,
        )
        if (!confirmed) return

        setDeletingId(review.id)

        try {
            const token = localStorage.getItem("xuthi_auth_token")
            const response = await fetch(
                `${API_URL}/api/admin/reviews/${review.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                toast.error(errorData.detail || "Không thể xóa đánh giá")
                return
            }

            setReviews((current) =>
                current.filter((item) => item.id !== review.id),
            )
            toast.success("Đã xóa đánh giá")
        } catch (error) {
            console.error("Failed to delete review:", error)
            toast.error("Đã xảy ra lỗi khi xóa đánh giá")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <MessageSquare className="h-7 w-7 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
                    <p className="text-sm text-muted-foreground">
                        Xem và xóa các bình luận đánh giá sản phẩm.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Đánh giá gần đây</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-10 text-center text-muted-foreground">
                            Đang tải đánh giá...
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground">
                            Chưa có đánh giá nào.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sản phẩm</TableHead>
                                    <TableHead>Khách hàng</TableHead>
                                    <TableHead>Đánh giá</TableHead>
                                    <TableHead>Bình luận</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">
                                        Thao tác
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviews.map((review) => (
                                    <TableRow key={review.id}>
                                        <TableCell className="font-medium">
                                            {review.productName}
                                        </TableCell>
                                        <TableCell>
                                            <div>{review.authorName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {review.authorEmail}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                <span>{review.rating}/5</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-sm">
                                            <p className="line-clamp-3 text-sm">
                                                {review.comment || "-"}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    review.isApproved
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {review.isApproved
                                                    ? "Hiển thị"
                                                    : "Ẩn"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    deleteReview(review)
                                                }
                                                disabled={
                                                    deletingId === review.id
                                                }
                                                title="Xóa đánh giá"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
