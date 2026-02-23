"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { AppLink } from "@/components/app-link"
import { api } from "@/lib/api/client"
import type { ActiveSaleItem, Product } from "@/lib/api/types"
import { CURRENCY, LOCALE } from "@/lib/constants"
import { formatMoney } from "@/lib/money"

const PAGE_SIZE_FALLBACK = 12

type CollectionProductsProps = {
    initialProducts: Product[]
    totalCount: number
    categoryId: string
    pageSize?: number
}

export function CollectionProducts({
    initialProducts,
    totalCount,
    categoryId,
    pageSize = PAGE_SIZE_FALLBACK,
}: CollectionProductsProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [saleItems, setSaleItems] = useState<ActiveSaleItem[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)

    const hasMore = products.length < totalCount

    useEffect(() => {
        const fetchSaleItems = async () => {
            if (products.length === 0) {
                setSaleItems([])
                return
            }
            const productIds = products.map((product) => product.id)
            const variantIds = products.flatMap((product) =>
                product.variants.map((variant) => variant.id),
            )
            const result = await api.saleItemsGet({ productIds, variantIds })
            setSaleItems(result.data || [])
        }

        fetchSaleItems()
    }, [products])

    const saleItemsByProduct = useMemo(() => {
        return saleItems.reduce<Record<string, ActiveSaleItem[]>>(
            (acc, item) => {
                ;(acc[item.productId] ??= []).push(item)
                return acc
            },
            {},
        )
    }, [saleItems])

    const handleLoadMore = async () => {
        if (loading || !hasMore) return
        setLoading(true)
        try {
            const nextPage = page + 1
            const result = await api.productBrowse({
                categoryId,
                active: true,
                page: nextPage,
                limit: pageSize,
            })
            setProducts((prev) => [...prev, ...(result.data || [])])
            setPage(nextPage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => {
                    const variants = product.variants ?? []
                    const firstVariantPrice = variants[0]
                        ? BigInt(variants[0].price)
                        : null
                    const { minPrice, maxPrice } =
                        variants.length > 0 && firstVariantPrice !== null
                            ? variants.reduce(
                                  (acc, v) => {
                                      const price = BigInt(v.price)
                                      return {
                                          minPrice:
                                              price < acc.minPrice
                                                  ? price
                                                  : acc.minPrice,
                                          maxPrice:
                                              price > acc.maxPrice
                                                  ? price
                                                  : acc.maxPrice,
                                      }
                                  },
                                  {
                                      minPrice: firstVariantPrice,
                                      maxPrice: firstVariantPrice,
                                  },
                              )
                            : { minPrice: null, maxPrice: null }

                    const productSaleItems =
                        saleItemsByProduct[product.id] ?? []
                    const salePrices = productSaleItems.map(
                        (item) => item.salePrice,
                    )
                    const originalPrices = productSaleItems
                        .map((item) => item.originalPrice)
                        .filter(
                            (price): price is number =>
                                typeof price === "number",
                        )
                    const discountPercents = productSaleItems
                        .map((item) => {
                            const original = item.originalPrice
                            if (
                                typeof original !== "number" ||
                                original <= item.salePrice
                            ) {
                                return 0
                            }
                            return Math.round(
                                ((original - item.salePrice) / original) * 100,
                            )
                        })
                        .filter((percent) => percent > 0)

                    const minSale = salePrices.length
                        ? Math.min(...salePrices)
                        : null
                    const maxSale = salePrices.length
                        ? Math.max(...salePrices)
                        : null
                    const minOriginal = originalPrices.length
                        ? Math.min(...originalPrices)
                        : minPrice !== null
                          ? Number(minPrice)
                          : null
                    const maxOriginal = originalPrices.length
                        ? Math.max(...originalPrices)
                        : maxPrice !== null
                          ? Number(maxPrice)
                          : null

                    const priceDisplay =
                        variants.length > 1 &&
                        minPrice &&
                        maxPrice &&
                        minPrice !== maxPrice
                            ? `${formatMoney({ amount: minPrice, currency: CURRENCY, locale: LOCALE })} - ${formatMoney({ amount: maxPrice, currency: CURRENCY, locale: LOCALE })}`
                            : minPrice
                              ? formatMoney({
                                    amount: minPrice,
                                    currency: CURRENCY,
                                    locale: LOCALE,
                                })
                              : null

                    const salePriceDisplay =
                        minSale !== null && maxSale !== null
                            ? minSale !== maxSale
                                ? `${formatMoney({ amount: BigInt(Math.round(minSale)), currency: CURRENCY, locale: LOCALE })} - ${formatMoney({ amount: BigInt(Math.round(maxSale)), currency: CURRENCY, locale: LOCALE })}`
                                : formatMoney({
                                      amount: BigInt(Math.round(minSale)),
                                      currency: CURRENCY,
                                      locale: LOCALE,
                                  })
                            : null

                    const originalPriceDisplay =
                        minOriginal !== null && maxOriginal !== null
                            ? minOriginal !== maxOriginal
                                ? `${formatMoney({ amount: BigInt(Math.round(minOriginal)), currency: CURRENCY, locale: LOCALE })} - ${formatMoney({ amount: BigInt(Math.round(maxOriginal)), currency: CURRENCY, locale: LOCALE })}`
                                : formatMoney({
                                      amount: BigInt(Math.round(minOriginal)),
                                      currency: CURRENCY,
                                      locale: LOCALE,
                                  })
                            : null
                    const maxDiscountPercent = discountPercents.length
                        ? Math.max(...discountPercents)
                        : null

                    const allImages = [
                        ...(product.images ?? []),
                        ...(variants
                            .flatMap((v) => v.images ?? [])
                            .filter(
                                (img) => !(product.images ?? []).includes(img),
                            ) ?? []),
                    ]
                    const primaryImage = allImages[0]
                    const secondaryImage = allImages[1]

                    return (
                        <AppLink
                            prefetch={false}
                            key={product.id}
                            href={`/product/${product.slug}`}
                            className="group"
                        >
                            <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden mb-4">
                                {maxDiscountPercent && (
                                    <span className="absolute left-3 top-3 z-10 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
                                        -{maxDiscountPercent}%
                                    </span>
                                )}
                                {primaryImage && (
                                    <Image
                                        src={primaryImage}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                                    />
                                )}
                                {secondaryImage && (
                                    <Image
                                        src={secondaryImage}
                                        alt={`${product.name} - alternate view`}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                    />
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-medium text-foreground">
                                    {product.name}
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

            {hasMore && (
                <div className="mt-12 flex justify-center">
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="inline-flex items-center rounded-full border border-border px-6 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
                    >
                        {loading ? "Đang tải..." : "Tải thêm"}
                    </button>
                </div>
            )}
        </section>
    )
}
