"use client"

import { useState, useTransition, useEffect } from "react"
import { Star } from "lucide-react"
import { commerce } from "@/lib/commerce"
import type { ProductReviewDto } from "@/lib/api/client"
import { useAuth } from "@/lib/auth-context"
import { AppLink } from "@/components/app-link"
import { Button } from "@/components/ui/button"

// ─── Star display (read-only) ─────────────────────────────────────────────

function StarRating({
    rating,
    size = "sm",
}: {
    rating: number
    size?: "sm" | "lg"
}) {
    const sizeClass = size === "lg" ? "h-5 w-5" : "h-4 w-4"
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    className={`${sizeClass} ${
                        i < Math.round(rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-muted text-muted"
                    }`}
                />
            ))}
        </div>
    )
}

// ─── Interactive star input ───────────────────────────────────────────────

function StarInput({
    value,
    onChange,
}: {
    value: number
    onChange: (v: number) => void
}) {
    const [hovered, setHovered] = useState(0)

    return (
        <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => {
                const starValue = i + 1
                return (
                    <button
                        key={starValue}
                        type="button"
                        onMouseEnter={() => setHovered(starValue)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => onChange(starValue)}
                        className="transition-transform hover:scale-110"
                        aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                    >
                        <Star
                            className={`h-7 w-7 ${
                                starValue <= (hovered || value)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-muted text-muted"
                            }`}
                        />
                    </button>
                )
            })}
        </div>
    )
}

// ─── Review card ──────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ProductReviewDto }) {
    return (
        <div className="space-y-2 border-b border-border pb-6 last:border-0">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <StarRating rating={review.rating} />
                    <span className="font-medium text-sm">{review.authorName}</span>
                </div>
                <time
                    className="text-xs text-muted-foreground shrink-0"
                    dateTime={review.createdAt}
                >
                    {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    })}
                </time>
            </div>
            {review.comment && (
                <p className="text-muted-foreground leading-relaxed text-sm">
                    {review.comment}
                </p>
            )}
        </div>
    )
}

// ─── Review form ──────────────────────────────────────────────────────────

function ReviewForm({
    productId,
    onSubmitted,
}: {
    productId: string
    onSubmitted: (newAvg: number, newCount: number, newReview: ProductReviewDto) => void
}) {
    const { user } = useAuth()
    const [rating, setRating] = useState(0)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [comment, setComment] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (user) {
            const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
            setName(fullName)
            setEmail(user.email || "")
        }
    }, [user])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) {
            setError("Vui lòng chọn số sao đánh giá.")
            return
        }
        setError(null)

        startTransition(async () => {
            const result = await commerce.productSubmitReview({
                productId,
                authorName: name,
                authorEmail: email,
                rating,
                comment: comment.trim() || undefined,
            })

            if (result) {
                setSubmitted(true)
                const optimisticReview: ProductReviewDto = {
                    id: result.reviewId,
                    authorName: name,
                    rating,
                    comment: comment.trim() || null,
                    createdAt: new Date().toISOString(),
                }
                onSubmitted(result.newAverageRating, result.newReviewCount, optimisticReview)
            } else {
                setError("Không thể gửi đánh giá. Vui lòng thử lại sau.")
            }
        })
    }

    if (submitted) {
        return (
            <div className="rounded-xl border border-border bg-secondary/50 p-6 text-center">
                <p className="font-medium">Cảm ơn bạn đã đánh giá! 🎉</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Đánh giá của bạn đã được ghi nhận.
                </p>
            </div>
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-border bg-background p-6"
        >
            <h3 className="text-lg font-medium">Viết đánh giá</h3>

            <div>
                <label className="mb-2 block text-sm font-medium">Đánh giá của bạn</label>
                <StarInput value={rating} onChange={setRating} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="review-name" className="mb-1.5 block text-sm font-medium">
                        Tên hiển thị <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="review-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Nguyễn Văn A"
                    />
                </div>
                <div>
                    <label htmlFor="review-email" className="mb-1.5 block text-sm font-medium">
                        Email <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="review-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="email@example.com"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium">
                    Nhận xét
                </label>
                <textarea
                    id="review-comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
                type="submit"
                disabled={isPending || rating === 0}
                className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isPending ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
        </form>
    )
}

// ─── Main export ──────────────────────────────────────────────────────────

export function ProductReviewSection({
    productId,
    initialReviews,
    initialAverageRating,
    initialReviewCount,
}: {
    productId: string
    initialReviews: ProductReviewDto[]
    initialAverageRating: number
    initialReviewCount: number
}) {
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const [reviews, setReviews] = useState<ProductReviewDto[]>(initialReviews)
    const [averageRating, setAverageRating] = useState(initialAverageRating)
    const [reviewCount, setReviewCount] = useState(initialReviewCount)
    const [canReview, setCanReview] = useState(false)
    const [checkingCanReview, setCheckingCanReview] = useState(true)

    useEffect(() => {
        if (isAuthenticated) {
            setCheckingCanReview(true)
            commerce.productCanReview(productId)
                .then((res) => {
                    setCanReview(res)
                    setCheckingCanReview(false)
                })
                .catch(() => {
                    setCanReview(false)
                    setCheckingCanReview(false)
                })
        } else {
            setCanReview(false)
            setCheckingCanReview(false)
        }
    }, [isAuthenticated, productId])

    const handleSubmitted = (newAvg: number, newCount: number, newReview: ProductReviewDto) => {
        setAverageRating(newAvg)
        setReviewCount(newCount)
        setReviews((prev) => [newReview, ...prev])
    }

    return (
        <section className="mt-20 border-t border-border pt-16">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-medium tracking-tight">
                    Đánh giá của khách hàng
                </h2>
                {reviewCount > 0 && (
                    <div className="flex items-center gap-3">
                        <StarRating rating={averageRating} size="lg" />
                        <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                            ({reviewCount} đánh giá)
                        </span>
                    </div>
                )}
            </div>

            {reviews.length > 0 ? (
                <div className="mb-10 space-y-6">
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            ) : (
                <p className="mb-10 text-muted-foreground">
                    Chưa có đánh giá nào. Hãy là người đầu tiên!
                </p>
            )}

            {/* Verified Buyer Check Rendering */}
            {authLoading || checkingCanReview ? (
                <div className="rounded-xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                    Đang kiểm tra thông tin mua hàng...
                </div>
            ) : !isAuthenticated ? (
                <div className="rounded-2xl border border-border bg-muted/20 p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
                    <div className="space-y-1">
                        <p className="font-medium text-base text-foreground">Bạn muốn đánh giá sản phẩm?</p>
                        <p className="text-sm text-muted-foreground">
                            Vui lòng đăng nhập bằng tài khoản mua hàng để viết đánh giá.
                        </p>
                    </div>
                    <AppLink href="/auth/login" className="shrink-0">
                        <Button size="lg" className="w-full md:w-auto rounded-xl">Đăng nhập tài khoản</Button>
                    </AppLink>
                </div>
            ) : !canReview ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-left transition-all duration-300">
                    <div className="flex items-start gap-3">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                        <div className="space-y-1">
                            <p className="font-medium text-base text-amber-800 dark:text-amber-300">Tính năng viết đánh giá bị hạn chế</p>
                            <p className="text-sm text-muted-foreground">
                                Hệ thống chỉ cho phép những khách hàng đã mua và nhận sản phẩm này thành công gửi đánh giá.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <ReviewForm productId={productId} onSubmitted={handleSubmitted} />
            )}
        </section>
    )
}

// Re-export StarRating for use in other components (product cards etc.)
export { StarRating }
