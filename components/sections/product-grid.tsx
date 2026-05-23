import type { Product } from "@/lib/api/types"
import { ArrowRight } from "lucide-react"
import { cacheLife } from "next/cache"
import Image from "next/image"
import { commerce } from "@/lib/commerce"
import {
    formatDisplayMoney,
    formatDisplayMoneyRange,
    type SupportedCurrency,
} from "@/lib/currency"
import { getServerCurrencyPreference } from "@/lib/currency-server"
import { AppLink } from "../app-link"

// Re-export Product type for consumers
export type { Product }

type ProductGridProps = {
    title?: string
    description?: string
    products?: Product[]
    limit?: number
    isFeatured?: boolean
    showViewAll?: boolean
    viewAllHref?: string
}

export async function ProductGrid({
    title = "Sản phẩm nổi bật",
    description = "Tuyển chọn dành cho bạn",
    products,
    limit = 6,
    isFeatured = false,
    showViewAll = true,
    viewAllHref = "/collection",
}: ProductGridProps) {
    const currency = await getServerCurrencyPreference()

    return (
        <ProductGridContent
            title={title}
            description={description}
            products={products}
            limit={limit}
            isFeatured={isFeatured}
            showViewAll={showViewAll}
            viewAllHref={viewAllHref}
            currency={currency}
        />
    )
}

async function ProductGridContent({
    title,
    description,
    products,
    limit,
    isFeatured,
    showViewAll,
    viewAllHref,
    currency,
}: ProductGridProps & { currency: SupportedCurrency }) {
    "use cache"
    cacheLife("minutes")

    const resolvedViewAllHref = viewAllHref ?? "/collection"

    const displayProducts =
        products ??
        (await commerce.productBrowse({ active: true, limit, isFeatured })).data
    const productIds = displayProducts.map((product) => product.id)
    const variantIds = displayProducts.flatMap((product) =>
        product.variants.map((variant) => variant.id),
    )
    const saleItems = (await commerce.saleItemsGet({ productIds, variantIds }))
        .data

    const saleItemsByProduct = saleItems.reduce<
        Record<string, typeof saleItems>
    >((acc, item) => {
        ;(acc[item.productId] ??= []).push(item)
        return acc
    }, {})

    return (
        <section
            id="products"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
        >
            <div className="flex items-end justify-between mb-12">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-medium text-foreground">
                        {title}
                    </h2>
                    <p className="mt-2 text-muted-foreground">{description}</p>
                </div>
                {showViewAll && (
                    <AppLink
                        prefetch={"eager"}
                        href={resolvedViewAllHref}
                        className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Xem tất cả
                        <ArrowRight className="h-4 w-4" />
                    </AppLink>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayProducts.map((product) => {
                    const variants =
                        "variants" in product ? product.variants : null
                    const firstVariantPrice = variants?.[0]
                        ? BigInt(variants[0].price)
                        : null
                    const { minPrice, maxPrice } =
                        variants && firstVariantPrice !== null
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
                        variants &&
                        variants.length > 1 &&
                        minPrice &&
                        maxPrice &&
                        minPrice !== maxPrice
                            ? formatDisplayMoneyRange({
                                  minAmountInVnd: minPrice,
                                  maxAmountInVnd: maxPrice,
                                  currency,
                              })
                            : minPrice
                              ? formatDisplayMoney({
                                    amountInVnd: minPrice,
                                    currency,
                                })
                              : null
                    const salePriceDisplay =
                        minSale !== null && maxSale !== null
                            ? minSale !== maxSale
                                ? formatDisplayMoneyRange({
                                      minAmountInVnd: BigInt(Math.round(minSale)),
                                      maxAmountInVnd: BigInt(Math.round(maxSale)),
                                      currency,
                                  })
                                : formatDisplayMoney({
                                      amountInVnd: BigInt(Math.round(minSale)),
                                      currency,
                                  })
                            : null
                    const originalPriceDisplay =
                        minOriginal !== null && maxOriginal !== null
                            ? minOriginal !== maxOriginal
                                ? formatDisplayMoneyRange({
                                      minAmountInVnd: BigInt(
                                          Math.round(minOriginal),
                                      ),
                                      maxAmountInVnd: BigInt(
                                          Math.round(maxOriginal),
                                      ),
                                      currency,
                                  })
                                : formatDisplayMoney({
                                      amountInVnd: BigInt(
                                          Math.round(minOriginal),
                                      ),
                                      currency,
                                  })
                            : null
                    const maxDiscountPercent = discountPercents.length
                        ? Math.max(...discountPercents)
                        : null

                    const allImages = [
                        ...(product.images ?? []),
                        ...(variants
                            ?.flatMap((v) => v.images ?? [])
                            .filter(
                                (img) => !(product.images ?? []).includes(img),
                            ) ?? []),
                    ]
                    const primaryImage = allImages[0]
                    const secondaryImage = allImages[1]

                    return (
                        <AppLink
                            prefetch={"eager"}
                            key={product.id}
                            href={`/product/${product.slug}`}
                            className="group"
                        >
                            <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden mb-4">
                                {maxDiscountPercent && (
                                    <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-sale px-2.5 py-0.5 text-xs font-semibold text-sale-foreground">
                                        Sale
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

            {showViewAll && (
                <div className="mt-12 text-center sm:hidden">
                    <AppLink
                        prefetch={"eager"}
                        href={resolvedViewAllHref}
                        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Xem tất cả sản phẩm
                        <ArrowRight className="h-4 w-4" />
                    </AppLink>
                </div>
            )}
        </section>
    )
}
