"use client"

import { useEffect, useState, useRef } from "react"
import { AppLink } from "@/components/app-link"
import {
  formatDisplayMoney,
  formatDisplayMoneyRange,
  type SupportedCurrency,
} from "@/lib/currency"
import { commerce } from "@/lib/commerce"
import type { ActiveSaleItem } from "@/lib/api/types"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface RecentlyViewedItem {
  id: string
  name: string
  slug: string
  image: string
  price: string
}

export function RecentlyViewedProducts({
  currentProduct,
  currency,
}: {
  currentProduct: {
    id: string
    name: string
    slug: string
    image: string
    price: string
  }
  currency: SupportedCurrency
}) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [saleItems, setSaleItems] = useState<ActiveSaleItem[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      // 1. Load existing items from localStorage
      const stored = localStorage.getItem("xuthi_recently_viewed")
      let list: RecentlyViewedItem[] = stored ? JSON.parse(stored) : []

      // 2. Filter out current product to display other recently viewed ones
      const displayList = list.filter((item) => item.id !== currentProduct.id)
      setItems(displayList)

      // 3. Add current product to the top of the storage list
      list = [currentProduct, ...list.filter((item) => item.id !== currentProduct.id)]
      
      // Keep up to 30 items in storage so it contains full history
      if (list.length > 30) {
        list = list.slice(0, 30)
      }
      
      localStorage.setItem("xuthi_recently_viewed", JSON.stringify(list))
    } catch (e) {
      console.error("Failed to manage recently viewed products:", e)
    }
  }, [currentProduct])

  useEffect(() => {
    if (items.length === 0) return
    // Fetch active sales for recently viewed items
    commerce.saleItemsGet({ productIds: items.map(item => item.id) })
      .then(res => setSaleItems(res.data || []))
      .catch(err => console.error("Error fetching sale items for history:", err))
  }, [items])

  if (items.length === 0) return null

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
    <section className="mt-16 border-t border-border pt-12 animate-fade-in relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl md:text-2xl font-medium tracking-tight text-foreground">
          Sản phẩm đã xem gần đây
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full border border-border hover:bg-muted text-foreground transition-all active:scale-95 hover:scale-105"
            aria-label="Previous viewed product"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full border border-border hover:bg-muted text-foreground transition-all active:scale-95 hover:scale-105"
            aria-label="Next viewed product"
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
        {items.map((item) => {
          const productSaleItems = saleItems.filter(sale => sale.productId === item.id)
          const salePrices = productSaleItems.map(sale => sale.salePrice)
          const originalPrices = productSaleItems
            .map(sale => sale.originalPrice)
            .filter((price): price is number => typeof price === "number")
          
          const minSale = salePrices.length ? Math.min(...salePrices) : null
          const maxSale = salePrices.length ? Math.max(...salePrices) : null
          
          const minOriginal = originalPrices.length 
            ? Math.min(...originalPrices) 
            : Number(item.price)
          const maxOriginal = originalPrices.length 
            ? Math.max(...originalPrices) 
            : Number(item.price)

          const discountPercents = productSaleItems
            .map((sale) => {
              const original = sale.originalPrice
              if (typeof original !== "number" || original <= sale.salePrice) return 0
              return Math.round(((original - sale.salePrice) / original) * 100)
            })
            .filter(percent => percent > 0)
          
          const maxDiscountPercent = discountPercents.length ? Math.max(...discountPercents) : null

          const priceDisplay = formatDisplayMoney({
            amountInVnd: BigInt(item.price),
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

          return (
            <AppLink key={item.id} href={`/product/${item.slug}`} className="group block w-[200px] sm:w-[240px] lg:w-[260px] snap-start flex-shrink-0">
              <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden mb-4">
                {maxDiscountPercent && maxDiscountPercent > 0 && (
                  <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-sale px-2.5 py-0.5 text-xs font-semibold text-sale-foreground">
                    Sale
                  </span>
                )}
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {item.name}
                </h3>
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
