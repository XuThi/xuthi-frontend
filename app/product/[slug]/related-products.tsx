"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { AppLink } from "@/components/app-link"
import {
    formatDisplayMoney,
    formatDisplayMoneyRange,
    type SupportedCurrency,
} from "@/lib/currency"
import { StarRating } from "@/app/product/[slug]/product-reviews"
import type { RecommendedProduct } from "@/lib/api/client"
import { commerce } from "@/lib/commerce"
import type { ActiveSaleItem } from "@/lib/api/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface RelatedProductsProps {
    products: RecommendedProduct[]
    currency: SupportedCurrency
}

export function RelatedProducts({ products, currency }: RelatedProductsProps) {
    const [saleItems, setSaleItems] = useState<ActiveSaleItem[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (products.length === 0) return
        commerce.saleItemsGet({ productIds: products.map(p => p.id) })
            .then(res => setSaleItems(res.data || []))
            .catch(err => console.error("Error fetching sale items for recommendations:", err))
    }, [products])

    if (products.length === 0) return null

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current
            const scrollAmount = clientWidth * 0.75
            scrollRef.current.scrollTo({
                left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: "smooth"
            })
        }
    }

    return (
        <section className="mt-20 border-t border-border pt-16 animate-fade-in relative">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-medium tracking-tight text-foreground">
                    Có thể bạn cũng thích
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll("left")}
                        className="p-2 rounded-full border border-border hover:bg-muted text-foreground transition-all active:scale-95 hover:scale-105"
                        aria-label="Previous recommendation"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="p-2 rounded-full border border-border hover:bg-muted text-foreground transition-all active:scale-95 hover:scale-105"
                        aria-label="Next recommendation"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div 
                ref={scrollRef}
                className="flex items-start overflow-x-auto gap-6 pb-6 scroll-smooth snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {products.map((product) => {
                    const productSaleItems = saleItems.filter(item => item.productId === product.id)
                    const salePrices = productSaleItems.map(item => item.salePrice)
                    const originalPrices = productSaleItems
                        .map(item => item.originalPrice)
                        .filter((price): price is number => typeof price === "number")
                    
                    const minSale = salePrices.length ? Math.min(...salePrices) : null
                    const maxSale = salePrices.length ? Math.max(...salePrices) : null
                    
                    const minOriginal = originalPrices.length 
                        ? Math.min(...originalPrices) 
                        : Number(product.minPrice)
                    const maxOriginal = originalPrices.length 
                        ? Math.max(...originalPrices) 
                        : Number(product.minPrice)

                    const discountPercents = productSaleItems
                        .map((item) => {
                            const original = item.originalPrice
                            if (typeof original !== "number" || original <= item.salePrice) return 0
                            return Math.round(((original - item.salePrice) / original) * 100)
                        })
                        .filter(percent => percent > 0)
                    
                    const maxDiscountPercent = discountPercents.length ? Math.max(...discountPercents) : null

                    const priceDisplay = formatDisplayMoney({
                        amountInVnd: product.minPrice,
                        currency,
                    })

                    const salePriceDisplay = minSale !== null && maxSale !== null
                        ? minSale !== maxSale
                            ? formatDisplayMoneyRange({ minAmountInVnd: BigInt(Math.round(minSale)), maxAmountInVnd: BigInt(Math.round(maxSale)), currency })
                            : formatDisplayMoney({ amountInVnd: BigInt(Math.round(minSale)), currency })
                        : null

                    const originalPriceDisplay = minOriginal !== null && maxOriginal !== null
                        ? minOriginal !== maxOriginal
                            ? formatDisplayMoneyRange({ minAmountInVnd: BigInt(Math.round(minOriginal)), maxAmountInVnd: BigInt(Math.round(maxOriginal)), currency })
                            : formatDisplayMoney({ amountInVnd: BigInt(Math.round(minOriginal)), currency })
                        : null

                    const primaryImage = product.images[0]
                    const secondaryImage = product.images[1]

                    return (
                        <AppLink
                            prefetch="eager"
                            key={product.id}
                            href={`/product/${product.slug}`}
                            className="group block w-[240px] sm:w-[280px] lg:w-[300px] snap-start flex-shrink-0"
                        >
                            <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden mb-4">
                                {maxDiscountPercent && maxDiscountPercent > 0 && (
                                    <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-sale px-2.5 py-0.5 text-xs font-semibold text-sale-foreground">
                                        Sale
                                    </span>
                                )}
                                {primaryImage && (
                                    <Image
                                        src={primaryImage}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 640px) 100vw, 25vw"
                                        className={`object-cover transition-all duration-500 ${secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                                    />
                                )}
                                {secondaryImage && (
                                    <Image
                                        src={secondaryImage}
                                        alt={`${product.name} - alternate view`}
                                        fill
                                        sizes="(max-width: 640px) 100vw, 25vw"
                                        className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                    />
                                )}
                                {!primaryImage && (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                                        No image
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                    {product.name}
                                </h3>
                                {product.reviewCount > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <StarRating rating={product.averageRating} size="sm" />
                                        <span className="text-xs text-muted-foreground">
                                            ({product.reviewCount})
                                        </span>
                                    </div>
                                )}
                                {salePriceDisplay ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-semibold text-foreground">
                                            {salePriceDisplay}
                                        </span>
                                        {originalPriceDisplay && (
                                            <span className="text-sm text-muted-foreground line-through">
                                                {originalPriceDisplay}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-base font-semibold text-foreground">
                                        {priceDisplay}
                                    </p>
                                )}
                            </div>
                        </AppLink>
                    )
                })}
            </div>
        </section>
    )
}
