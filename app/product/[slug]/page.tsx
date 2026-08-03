import { cacheLife } from "next/cache"
import { notFound } from "next/navigation"
import { AppLink } from "@/components/app-link"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AddToCartButton } from "@/app/product/[slug]/add-to-cart-button"
import { ImageGallery } from "@/app/product/[slug]/image-gallery"
import { ProductReviewSection } from "@/app/product/[slug]/product-reviews"
import { RelatedProducts } from "@/app/product/[slug]/related-products"
import { RecentlyViewedProducts } from "@/components/recently-viewed"
import { commerce } from "@/lib/commerce"
import {
    formatDisplayMoney,
    formatDisplayMoneyRange,
    type SupportedCurrency,
} from "@/lib/currency"
import { getServerCurrencyPreference } from "@/lib/currency-server"

export default async function ProductPage(props: {
    params: Promise<{ slug: string }>
}) {
    const currency = await getServerCurrencyPreference()

    return <ProductDetails params={props.params} currency={currency} />
}

const ProductDetails = async ({
    params,
    currency,
}: {
    params: Promise<{ slug: string }>
    currency: SupportedCurrency
}) => {
    "use cache"
    cacheLife("minutes")

    const { slug } = await params

    // Guard against undefined slug (can happen during cache warming)
    if (!slug || slug === "undefined") {
        notFound()
    }

    const [product, storePolicies] = await Promise.all([
        commerce.productGet({ idOrSlug: slug }),
        commerce.storePoliciesGet(),
    ])

    if (!product) {
        notFound()
    }

    const reviewsData = await commerce.productGetReviews(product.id)

    const { data: categories } = await commerce.collectionBrowse({})
    const matchedCategory = categories.find((c) => c.id === product.categoryId)

    const { minPrice, maxPrice } = product.variants.reduce(
        (acc, v) => {
            const price = BigInt(v.price)
            return {
                minPrice: price < acc.minPrice ? price : acc.minPrice,
                maxPrice: price > acc.maxPrice ? price : acc.maxPrice,
            }
        },
        {
            minPrice: product.variants[0]
                ? BigInt(product.variants[0].price)
                : BigInt(0),
            maxPrice: product.variants[0]
                ? BigInt(product.variants[0].price)
                : BigInt(0),
        },
    )

    const saleItems = (
        await commerce.saleItemsGet({
            productIds: [product.id],
            variantIds: product.variants.map((variant) => variant.id),
        })
    ).data

    const saleItemsByVariant = saleItems.reduce<
        Record<string, { salePrice: number; originalPrice?: number | null }>
    >((acc, item) => {
        if (item.variantId) {
            acc[item.variantId] = {
                salePrice: item.salePrice,
                originalPrice: item.originalPrice,
            }
        }
        return acc
    }, {})

    const productLevelSale = saleItems.find((item) => !item.variantId)
    const salePrices = saleItems.map((item) => item.salePrice)
    const originalPrices = saleItems
        .map((item) => item.originalPrice)
        .filter((price): price is number => typeof price === "number")

    const minSale = salePrices.length ? Math.min(...salePrices) : null
    const maxSale = salePrices.length ? Math.max(...salePrices) : null
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
        product.variants.length > 1 && minPrice !== maxPrice
            ? formatDisplayMoneyRange({
                  minAmountInVnd: minPrice,
                  maxAmountInVnd: maxPrice,
                  currency,
              })
            : formatDisplayMoney({ amountInVnd: minPrice, currency })
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
                      minAmountInVnd: BigInt(Math.round(minOriginal)),
                      maxAmountInVnd: BigInt(Math.round(maxOriginal)),
                      currency,
                  })
                : formatDisplayMoney({
                      amountInVnd: BigInt(Math.round(minOriginal)),
                      currency,
                  })
            : null

    const allImages = [
        ...product.images,
        ...product.variants
            .flatMap((v) => v.images)
            .filter((img) => !product.images.includes(img)),
    ]
    const categoryLabel = matchedCategory?.name || product.categoryName
    const isOnSale = !!salePriceDisplay

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 hidden sm:block">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <AppLink href="/">Trang chủ</AppLink>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        {matchedCategory?.slug ? (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <AppLink href={`/collection/${matchedCategory.slug}`}>
                                            {matchedCategory.name}
                                        </AppLink>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                            </>
                        ) : categoryLabel ? (
                            <>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{categoryLabel}</BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                            </>
                        ) : null}
                        <BreadcrumbItem>
                            <BreadcrumbPage>{product.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="lg:grid lg:grid-cols-2 lg:gap-16">
                {/* Left: Image Gallery (sticky on desktop) */}
                <ImageGallery
                    images={allImages}
                    productName={product.name}
                    variants={product.variants}
                />

                {/* Right: Product Details */}
                <div className="mt-8 lg:mt-0 space-y-8">
                    {/* Title, Price, Description */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            {categoryLabel && (
                                <span className="text-sm text-muted-foreground">
                                    {categoryLabel}
                                </span>
                            )}
                            {isOnSale && (
                                <span className="inline-flex items-center rounded-full bg-sale px-2.5 py-0.5 text-xs font-semibold text-sale-foreground">
                                    Sale
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl font-medium tracking-tight text-foreground lg:text-4xl text-balance leading-tight">
                            {product.name}
                        </h1>
                        {salePriceDisplay ? (
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-2xl font-semibold tracking-tight">
                                    {salePriceDisplay}
                                </span>
                                {originalPriceDisplay && (
                                    <span className="text-base text-muted-foreground line-through">
                                        {originalPriceDisplay}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-2xl font-semibold tracking-tight">
                                {priceDisplay}
                            </p>
                        )}
                        {product.summary && (
                            <p className="text-muted-foreground leading-relaxed">
                                {product.summary}
                            </p>
                        )}
                    </div>

                    {/* Variant Selector, Quantity, Add to Cart, Trust Badges */}
                    <AddToCartButton
                        variants={product.variants}
                        salePricing={{
                            byVariantId: saleItemsByVariant,
                            productFallback: productLevelSale
                                ? {
                                      salePrice: productLevelSale.salePrice,
                                      originalPrice:
                                          productLevelSale.originalPrice,
                                  }
                                : null,
                        }}
                        product={{
                            id: product.id,
                            name: product.name,
                            slug: product.slug,
                            images: product.images,
                        }}
                        optionNames={product.optionNames}
                    />
                </div>
            </div>

            {/* Google Structured Data / JSON-LD for Google Lens & Image Search */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org/",
                        "@type": "Product",
                        "name": product.name,
                        "image": allImages,
                        "description": product.summary || product.name,
                        "sku": product.variants[0]?.sku || "N/A",
                        "brand": {
                            "@type": "Brand",
                            "name": product.brandName || "XuThi",
                        },
                        ...(product.averageRating > 0 && product.reviewCount > 0
                            ? {
                                  "aggregateRating": {
                                      "@type": "AggregateRating",
                                      "ratingValue": product.averageRating,
                                      "reviewCount": product.reviewCount,
                                  },
                              }
                            : {}),
                        ...(reviewsData?.reviews?.length
                            ? {
                                  "review": reviewsData.reviews.slice(0, 5).map((r) => ({
                                      "@type": "Review",
                                      "author": {
                                          "@type": "Person",
                                          "name": r.authorName || "Anonymous",
                                      },
                                      "reviewRating": {
                                          "@type": "Rating",
                                          "ratingValue": r.rating,
                                      },
                                      "reviewBody": r.comment || "",
                                      "datePublished": r.createdAt,
                                  })),
                              }
                            : {}),
                        "offers": {
                            "@type": "Offer",
                            "url": `https://xuthi.vercel.app/product/${product.slug}`,
                            "priceCurrency": "VND",
                            "price": minPrice.toString(),
                            "itemCondition": "https://schema.org/NewCondition",
                            "availability": "https://schema.org/InStock",
                            "shippingDetails": {
                                "@type": "OfferShippingDetails",
                                "shippingRate": {
                                    "@type": "MonetaryAmount",
                                    "value": storePolicies.shippingPolicy.standardRateVnd.toString(),
                                    "currency": "VND",
                                },
                                "shippingDestination": {
                                    "@type": "DefinedRegion",
                                    "addressCountry": storePolicies.shippingPolicy.destinationCountry,
                                },
                                "deliveryTime": {
                                    "@type": "ShippingDeliveryTime",
                                    "handlingTime": {
                                        "@type": "QuantitativeValue",
                                        "minValue": storePolicies.shippingPolicy.minimumHandlingTimeDays,
                                        "maxValue": storePolicies.shippingPolicy.maximumHandlingTimeDays,
                                        "unitCode": "DAY",
                                    },
                                    "transitTime": {
                                        "@type": "QuantitativeValue",
                                        "minValue": storePolicies.shippingPolicy.minimumTransitTimeDays,
                                        "maxValue": storePolicies.shippingPolicy.maximumTransitTimeDays,
                                        "unitCode": "DAY",
                                    },
                                },
                            },
                            "hasMerchantReturnPolicy": {
                                "@type": "MerchantReturnPolicy",
                                "applicableCountry": storePolicies.returnPolicy.applicableCountry,
                                "returnPolicyCategory": storePolicies.returnPolicy.returnPolicyCategory,
                                "merchantReturnDays": storePolicies.returnPolicy.returnWindowDays,
                                "returnFees": storePolicies.returnPolicy.returnFeesCategory,
                                "refundType": storePolicies.returnPolicy.refundType,
                                "url": storePolicies.returnPolicy.policyUrl,
                            },
                        },
                    }),
                }}
            />


            {/* Reviews & Recommendations — loaded after main content */}
            <ReviewsAndRecommendations
                productId={product.id}
                currency={currency}
            />

            {/* Client-side LocalStorage Browsing History */}
            <RecentlyViewedProducts
                currentProduct={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    image: allImages[0] || "",
                    price: minPrice.toString(),
                }}
                currency={currency}
            />
        </div>
    )
}

async function ReviewsAndRecommendations({
    productId,
    currency,
}: {
    productId: string
    currency: SupportedCurrency
}) {
    // Parallel fetch — no waterfall
    const [reviewsData, recommendations] = await Promise.all([
        commerce.productGetReviews(productId),
        commerce.productGetRecommendations(productId, 8),
    ])

    return (
        <>
            <RelatedProducts products={recommendations} currency={currency} />
            <ProductReviewSection
                productId={productId}
                initialReviews={reviewsData.reviews}
                initialAverageRating={reviewsData.averageRating}
                initialReviewCount={reviewsData.reviewCount}
            />
        </>
    )
}
