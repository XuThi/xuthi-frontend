import { cacheLife } from "next/cache"
import { notFound } from "next/navigation"
import Image from "next/image"
import { commerce } from "@/lib/commerce"
import type { Product, SaleCampaignDetail } from "@/lib/api/types"
import { ProductGrid } from "@/components/sections/product-grid"

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
                        Khuyến mãi
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
                                Đang diễn ra
                            </span>
                        )}
                        {campaign.isUpcoming && (
                            <span className="text-orange-600 font-medium">
                                Sắp diễn ra
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

            {products.length === 0 ? (
                <section className="mt-12">
                    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                        Chưa có sản phẩm nào trong chiến dịch này.
                    </div>
                </section>
            ) : (
                <ProductGrid
                    title="Sản phẩm đang giảm giá"
                    description="Lựa chọn từ chiến dịch khuyến mãi"
                    products={products}
                    showViewAll={false}
                />
            )}
        </main>
    )
}

async function getCampaignProducts(
    campaign: SaleCampaignDetail,
): Promise<Product[]> {
    const productIds = Array.from(
        new Set(campaign.items.map((item) => item.productId)),
    )
    const products = await Promise.all(
        productIds.map((id) => commerce.productGet({ idOrSlug: id })),
    )

    return products.filter((p): p is Product => p !== null && p !== undefined)
}

function formatDateRange(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString("vi-VN")} - ${endDate.toLocaleDateString("vi-VN")}`
}
