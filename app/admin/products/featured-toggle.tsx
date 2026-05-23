"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { commerce } from "@/lib/commerce"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type FeaturedToggleProps = {
    productId: string
    initialIsFeatured: boolean
}

export default function FeaturedToggle({
    productId,
    initialIsFeatured,
}: FeaturedToggleProps) {
    const [isFeatured, setIsFeatured] = useState(initialIsFeatured)
    const [isLoading, setIsLoading] = useState(false)

    const handleToggle = async () => {
        setIsLoading(true)
        try {
            const nextValue = !isFeatured
            await commerce.productToggleFeatured(productId, nextValue)
            setIsFeatured(nextValue)
            toast.success(
                nextValue ? "Đã đặt làm nổi bật" : "Đã bỏ khỏi mục nổi bật"
            )
        } catch (error) {
            console.error("Failed to toggle featured status:", error)
            toast.error("Không thể cập nhật trạng thái nổi bật")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={isLoading}
            className={cn(
                "transition-colors",
                isFeatured 
                    ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" 
                    : "text-muted-foreground"
            )}
            title={isFeatured ? "Bỏ nổi bật" : "Đặt làm nổi bật"}
        >
            <Star className={cn("h-4 w-4", isFeatured && "fill-current")} />
        </Button>
    )
}
