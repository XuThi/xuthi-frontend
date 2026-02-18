import { cacheLife } from "next/cache"
import { notFound } from "next/navigation"
import Image from "next/image"
import { commerce } from "@/lib/commerce"
import type { Product, SaleCampaignDetail } from "@/lib/api/types"
import { CURRENCY, LOCALE } from "@/lib/constants"
import { formatMoney } from "@/lib/money"
import { AppLink } from "@/components/app-link"

export default async function SaleCampaignPage(props: {
    params: Promise<{ slug: string }>
}) {
    "use cache"
    cacheLife("minutes")

    const { slug } = await props.params
    if (!slug || slug === "undefined") {
        notFound()
    }

    const campaign = await commerce.saleCampaignGetBySlug(slug)
    if (!campaign) {
        notFound()
    }

    const products = await getCampaignProducts(campaign)

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
                <div>
                    <div className="text-sm uppercase tracking-widest text-muted-foreground">
                        Khuyen mai
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-semibold mt-2">
                        {campaign.name}
                    </h1>
                    {campaign.description && (
                        <p className="mt-3 text-muted-foreground">
                            {campaign.description}
                        </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>
                            {formatDateRange(
                                campaign.startDate,
                                campaign.endDate,
                            )}
                        </span>
                        {campaign.isRunning && (
                            <span className="text-green-600 font-medium">
                                Dang dien ra
                            </span>
                        )}
                        {campaign.isUpcoming && (
                            <span className="text-orange-600 font-medium">
                                Sap dien ra
                            </span>
                        )}
                    </div>
                </div>
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-secondary">
                    {campaign.bannerImageUrl ? (
                        <Image
                            src={campaign.bannerImageUrl}
                            alt={campaign.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 40vw"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500" />
                    )}
                </div>
            </section>

            <section className="mt-12">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold">
                            San pham dang giam gia
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Lua chon tu chien dich khuyen mai
                        </p>
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                        Chua co san pham nao trong chien dich nay.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map(({ product, sale }) => {
                            const primaryImage = product.images?.[0]
                            const salePrice = sale.salePrice
                            const original =
                                sale.originalPrice ??
                                product.variants?.[0]?.price ??
                                sale.salePrice
                            const discount = sale.discountPercentage

                            return (
                                <AppLink
                                    key={product.id}
                                    href={`/product/${product.slug}`}
                                    className="group"
                                >
                                    <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden mb-4">
                                        {primaryImage && (
                                            <Image
                                                src={primaryImage}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover"
                                            />
                                        )}
                                        {discount && (
                                            <span className="absolute top-3 left-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                                                -{Math.round(discount)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-base font-medium text-foreground line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-semibold text-foreground">
                                                {formatMoney({
                                                    amount: BigInt(
                                                        Math.round(salePrice),
                                                    ),
                                                    currency: CURRENCY,
                                                    locale: LOCALE,
                                                })}
                                            </span>
                                            {original &&
                                                original > salePrice && (
                                                    <span className="text-sm text-muted-foreground line-through">
                                                        {formatMoney({
                                                            amount: BigInt(
                                                                Math.round(
                                                                    original,
                                                                ),
                                                            ),
                                                            currency: CURRENCY,
                                                            locale: LOCALE,
                                                        })}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </AppLink>
                            )
                        })}
                    </div>
                )}
            </section>
        </main>
    )
}

async function getCampaignProducts(campaign: SaleCampaignDetail) {
    const productIds = Array.from(
        new Set(campaign.items.map((item) => item.productId)),
    )
    const products = await Promise.all(
        productIds.map(async (id) => ({
            id,
            product: await commerce.productGet({ idOrSlug: id }),
        })),
    )

    const productMap = new Map<string, Product>()
    for (const entry of products) {
        if (entry.product) {
            productMap.set(entry.id, entry.product)
        }
    }

    return campaign.items
        .map((sale) => {
            const product = productMap.get(sale.productId)
            return product ? { product, sale } : null
        })
        .filter(
            (
                item,
            ): item is {
                product: Product
                sale: SaleCampaignDetail["items"][number]
            } => item !== null,
        )
}

function formatDateRange(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString("vi-VN")} - ${endDate.toLocaleDateString("vi-VN")}`
}
