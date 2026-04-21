import type { Category } from "@/lib/api/types"
import { notFound } from "next/navigation"
import { Suspense } from "react"
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
import { commerce } from "@/lib/commerce"

type QueryValue = string | string[] | undefined

function takeFirstQueryValue(value: QueryValue): string | undefined {
    if (Array.isArray(value)) return value[0]
    return value
}

function parsePositiveInt(value: QueryValue, fallbackValue: number): number {
    const raw = takeFirstQueryValue(value)
    if (!raw) return fallbackValue

    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return fallbackValue

    return Math.max(1, Math.floor(parsed))
}

function parseNumber(value: QueryValue): number | undefined {
    const raw = takeFirstQueryValue(value)
    if (!raw) return undefined

    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : undefined
}

function parseCsv(value: QueryValue): string[] {
    const raw = takeFirstQueryValue(value)
    if (!raw) return []

    return raw
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
}

function mapSort(sortValue: string | undefined): {
    sortBy?: "name" | "price" | "createdAt"
    sortDirection?: "asc" | "desc"
} {
    switch (sortValue) {
        case "price-asc":
            return { sortBy: "price", sortDirection: "asc" }
        case "price-desc":
            return { sortBy: "price", sortDirection: "desc" }
        case "name-asc":
            return { sortBy: "name", sortDirection: "asc" }
        case "newest":
            return { sortBy: "createdAt", sortDirection: "desc" }
        default:
            return {}
    }
}

function CollectionHeader({ collection }: { collection: Category }) {
    return (
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
                            <BreadcrumbLink asChild>
                                <AppLink href="/collection" className="text-muted-foreground hover:text-foreground">
                                    Bộ sưu tập
                                </AppLink>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{collection.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {collection.name}
                </h1>
                {collection.description && (
                    <p className="mt-3 max-w-3xl text-base text-muted-foreground sm:text-lg">
                        {typeof collection.description === "string"
                            ? collection.description
                            : "Khám phá danh mục sản phẩm"}
                    </p>
                )}
            </div>
        </section>
    )
}

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const

function ProductGridSkeleton() {
    return (
        <section className="py-16 sm:py-24">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {SKELETON_KEYS.map((key) => (
                    <div key={key}>
                        <div className="aspect-square bg-secondary rounded-2xl mb-4 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-5 w-3/4 bg-secondary rounded animate-pulse" />
                            <div className="h-5 w-1/4 bg-secondary rounded animate-pulse" />
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default async function CollectionPage(props: {
    params: Promise<{ slug: string }>
    searchParams?: Promise<Record<string, QueryValue>>
}) {
    const { slug } = await props.params
    const searchParams = props.searchParams ? await props.searchParams : {}

    // Guard against undefined slug (can happen during cache warming)
    if (!slug || slug === "undefined") {
        notFound()
    }

    const { data: categories } = await commerce.collectionBrowse({})
    const collection = categories.find((c) => c.slug === slug)

    if (!collection) {
        notFound()
    }

    const pageSize = 24
    const page = parsePositiveInt(searchParams.page, 1)
    const minPriceInThousands = parseNumber(searchParams.minPrice)
    const maxPriceInThousands = parseNumber(searchParams.maxPrice)
    const colors = parseCsv(searchParams.colors)
    const sizes = parseCsv(searchParams.sizes)
    const { sortBy, sortDirection } = mapSort(takeFirstQueryValue(searchParams.sort))

    const productsResult = await commerce.productBrowse({
        categoryId: collection.id,
        active: true,
        limit: pageSize,
        page,
        minPrice:
            minPriceInThousands !== undefined
                ? minPriceInThousands * 1000
                : undefined,
        maxPrice:
            maxPriceInThousands !== undefined
                ? maxPriceInThousands * 1000
                : undefined,
        colors,
        sizes,
        sortBy,
        sortDirection,
    })

    return (
        <main>
            <CollectionHeader collection={collection} />
            <Suspense fallback={<ProductGridSkeleton />}>
                <CatalogProducts
                    initialProducts={productsResult.data}
                    categories={categories}
                    currentCategorySlug={collection.slug}
                    categoryMode="navigate"
                    pageSize={pageSize}
                    serverDriven
                    currentPage={productsResult.page}
                    totalPages={productsResult.totalPages}
                    totalCount={productsResult.totalCount}
                />
            </Suspense>
        </main>
    )
}
