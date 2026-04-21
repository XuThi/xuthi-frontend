import { cacheLife } from "next/cache"
import { notFound } from "next/navigation"
import { commerce } from "@/lib/commerce"
import type { Product, SaleCampaignDetail } from "@/lib/api/types"
import { AppLink } from "@/components/app-link"
import { CatalogProducts } from "@/components/sections/catalog-products"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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

    const [products, categories] = await Promise.all([
        getCampaignProducts(campaign),
        commerce.collectionBrowse({}),
    ])
    const metaClass = "mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground"
    const runningStatusClass = "font-medium text-green-600"
    const upcomingStatusClass = "font-medium text-orange-600"

    return (
        <main>
            <section className="relative h-80 overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-secondary" />
                <div
                    className="absolute inset-0 opacity-70"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(135deg, transparent 0 12px, hsl(var(--foreground) / 0.08) 12px 13px)",
                    }}
                />
                <div className="relative mx-auto flex h-full w-full max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 lg:px-8">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <AppLink href="/" className="text-muted-foreground hover:text-foreground">
                                        Trang chủ
                                    </AppLink>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Khuyến mãi
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    {campaign.name}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        {campaign.name}
                    </h1>
                    {campaign.description && (
                        <p className="mt-3 max-w-3xl text-base text-muted-foreground sm:text-lg">
                            {campaign.description}
                        </p>
                    )}
                    <div className={metaClass}>
                        <span>
                            {formatDateRange(
                                campaign.startDate,
                                campaign.endDate,
                            )}
                        </span>
                        {campaign.isRunning && <span className={runningStatusClass}>Đang diễn ra</span>}
                        {campaign.isUpcoming && <span className={upcomingStatusClass}>Sắp diễn ra</span>}
                    </div>
                </div>
            </section>

            {products.length === 0 ? (
                <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                        Chưa có sản phẩm nào trong chiến dịch này.
                    </div>
                </section>
            ) : (
                <CatalogProducts
                    initialProducts={products}
                    categories={categories.data}
                    categoryMode="filter"
                    pageSize={24}
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
