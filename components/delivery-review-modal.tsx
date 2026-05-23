"use client"

import { useEffect, useState, useTransition } from "react"
import { useAuth } from "@/lib/auth-context"
import { commerce } from "@/lib/commerce"
import type { UnratedProduct } from "@/lib/api/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Star, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

export function DeliveryReviewModal() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth()
  const [products, setProducts] = useState<UnratedProduct[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [hoveredStar, setHoveredStar] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Only check if authenticated, not loading, and not already checked this session
    if (isAuthenticated && !authLoading) {
      const shownThisSession = sessionStorage.getItem("xuthi_delivery_popup_shown")
      if (shownThisSession) return

      commerce.orderGetUnratedProducts()
        .then((res) => {
          if (res && res.length > 0) {
            setProducts(res)
            setCurrentIndex(0)
            setOpen(true)
            sessionStorage.setItem("xuthi_delivery_popup_shown", "true")
          }
        })
        .catch((e) => console.error("Error loading unrated products:", e))
    }
  }, [isAuthenticated, authLoading])

  const currentProduct = products[currentIndex]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProduct || rating === 0 || !user) return

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "Khách hàng"

    startTransition(async () => {
      const successResult = await commerce.productSubmitReview({
        productId: currentProduct.id,
        authorName: fullName,
        authorEmail: user.email || "customer@xuthi.vn",
        rating,
        comment: comment.trim() || undefined,
      })

      if (successResult) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setRating(0)
          setComment(0 as any || "") // reset comment

          if (currentIndex < products.length - 1) {
            setCurrentIndex((prev) => prev + 1)
          } else {
            setOpen(false)
            setProducts([])
          }
        }, 1500)
      } else {
        alert("Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.")
      }
    })
  }

  if (!open || !currentProduct) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] p-6 overflow-hidden rounded-2xl border border-border">
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-scale-up">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-emerald-500 animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-bold text-center">Đánh giá thành công! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              Cảm ơn bạn đã đóng góp ý kiến giúp XuThi cải thiện chất lượng dịch vụ.
            </DialogDescription>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="text-center sm:text-left">
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mb-1 uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                Giao hàng thành công
              </div>
              <DialogTitle className="text-lg md:text-xl font-bold">
                Cảm ơn bạn đã mua hàng tại XuThi!
              </DialogTitle>
              <DialogDescription className="text-sm">
                Đơn hàng của bạn đã được giao thành công. Hãy đánh giá sản phẩm để nhận thêm điểm tích lũy nhé!
              </DialogDescription>
            </DialogHeader>

            {/* Product Snapshot Card */}
            <div className="flex items-center gap-4 bg-secondary/40 p-4 rounded-xl border border-border/30">
              {currentProduct.imageUrl ? (
                <img
                  src={currentProduct.imageUrl}
                  alt={currentProduct.name}
                  className="h-16 w-16 rounded-lg object-cover bg-muted border"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate text-foreground">
                  {currentProduct.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sản phẩm đã nhận • Đang chờ bạn đánh giá
                </p>
              </div>
            </div>

            {/* Star Input */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <span className="text-xs font-medium text-muted-foreground">Bạn thấy sản phẩm thế nào?</span>
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }, (_, i) => {
                  const starValue = i + 1
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onMouseEnter={() => setHoveredStar(starValue)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(starValue)}
                      className="transition-transform hover:scale-115"
                    >
                      <Star
                        className={`h-9 w-9 transition-colors duration-200 ${
                          starValue <= (hoveredStar || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-muted text-muted"
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Written Comment Textarea */}
            <div className="space-y-2">
              <label htmlFor="modal-comment" className="text-xs font-semibold text-muted-foreground block">
                Nhận xét chi tiết (không bắt buộc)
              </label>
              <Textarea
                id="modal-comment"
                placeholder="Hãy chia sẻ cảm nhận của bạn về chất liệu, form dáng, kích cỡ giày..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentIndex < products.length - 1) {
                    setCurrentIndex((prev) => prev + 1)
                  } else {
                    setOpen(false)
                  }
                }}
                disabled={isPending}
                className="text-xs"
              >
                {currentIndex < products.length - 1 ? "Bỏ qua sản phẩm này" : "Để sau"}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={rating === 0 || isPending}
                className="text-xs font-semibold min-w-[120px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi đánh giá"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
