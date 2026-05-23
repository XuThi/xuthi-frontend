"use client"

import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react"
import { AppLink } from "@/components/app-link"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api/client"
import type { ActiveSaleItem, Category, Product } from "@/lib/api/types"
import { useCurrency } from "@/lib/currency-provider"

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc" | "newest"
type CategoryMode = "navigate" | "filter"

type CatalogProductsProps = {
    initialProducts: Product[]
    categories?: Category[]
    currentCategorySlug?: string
    categoryMode?: CategoryMode
    pageSize?: number
    emptyMessage?: string
    serverDriven?: boolean
    totalCount?: number
    totalPages?: number
    currentPage?: number
}

const SORT_LABELS: Record<SortOption, string> = {
    default: "Mặc định",
    "price-asc": "Giá: Thấp -> Cao",
    "price-desc": "Giá: Cao -> Thấp",
    "name-asc": "Tên: A -> Z",
    newest: "Mới nhất",
}

const PRICE_RANGES = [
    { label: "Dưới 200.000đ", value: "0-200" },
    { label: "200.000đ - 500.000đ", value: "200-500" },
    { label: "500.000đ - 600.000đ", value: "500-600" },
    { label: "Trên 600.000đ", value: "600-" },
] as const;

const COLOR_KEYS = new Set(["color", "colour", "mau", "mau-sac", "mausac"])
const SIZE_KEYS = new Set(["size", "kich-co", "kichco", "co-giay", "cogiay"])
const COLOR_SWATCHES: Record<string, string> = {
    black: "#171717",
    white: "#ffffff",
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    yellow: "#facc15",
    gray: "#6b7280",
    grey: "#6b7280",
    pink: "#ec4899",
    purple: "#9333ea",
    orange: "#f97316",
    brown: "#92400e",
    beige: "#d6c8a8",
    den: "#171717",
    trang: "#ffffff",
    do: "#dc2626",
    xanh: "#16a34a",
    "xanh-duong": "#2563eb",
    "xanh-la": "#16a34a",
    vang: "#facc15",
    hong: "#ec4899",
    tim: "#9333ea",
    cam: "#f97316",
    nau: "#92400e",
    xam: "#6b7280",
    "xam-nhat": "#9ca3af",
}

function normalizeKey(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
}

function getVariantValuesByKeySet(
    variant: Product["variants"][number],
    keySet: Set<string>,
): string[] {
    return Object.entries(variant.attributes || {})
        .filter(([key]) => keySet.has(normalizeKey(key)))
        .map(([, value]) => value)
}

function resolveColorSwatch(value: string): string | null {
    const trimmed = value.trim()
    if (!trimmed) return null

    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
        return trimmed
    }

    return COLOR_SWATCHES[normalizeKey(trimmed)] ?? null
}

export function CatalogProducts({
    initialProducts,
    categories = [],
    currentCategorySlug,
    categoryMode = "filter",
    pageSize = 12,
    emptyMessage = "Không tìm thấy sản phẩm phù hợp",
    serverDriven = false,
    totalCount,
    totalPages: serverTotalPages,
    currentPage: serverCurrentPage,
}: CatalogProductsProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { formatFromVnd } = useCurrency()

    const allProducts = initialProducts
    const [saleItems, setSaleItems] = useState<ActiveSaleItem[]>([])

    const [sortBy, setSortBy] = useState<SortOption>(
        (searchParams.get("sort") as SortOption) || "default",
    )
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        searchParams.get("categories")?.split(",").filter(Boolean) || [],
    )
    const [selectedColors, setSelectedColors] = useState<string[]>(
        searchParams.get("colors")?.split(",").filter(Boolean) || [],
    )
    const [selectedSizes, setSelectedSizes] = useState<string[]>(
        searchParams.get("sizes")?.split(",").filter(Boolean) || [],
    )
    const [minPrice, setMinPrice] = useState<number | undefined>(
        searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    )
    const [maxPrice, setMaxPrice] = useState<number | undefined>(
        searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    )

    const selectedPriceRange = useMemo(() => {
        if (minPrice === undefined && maxPrice === undefined) return "all";
        return `${minPrice ?? 0}-${maxPrice ?? ""}`;
    }, [minPrice, maxPrice]);

    const selectedPriceRangeLabel = useMemo(() => {
        return PRICE_RANGES.find(r => r.value === selectedPriceRange)?.label;
    }, [selectedPriceRange]);

    const pageFromQuery = Math.max(1, Number(searchParams.get("page") || "1") || 1)
    const [currentPage, setCurrentPage] = useState<number>(
        serverCurrentPage ?? pageFromQuery,
    )

    useEffect(() => {
        setCurrentPage(serverCurrentPage ?? pageFromQuery)
    }, [pageFromQuery, serverCurrentPage])

    useEffect(() => {
        const fetchSaleItems = async () => {
            if (allProducts.length === 0) {
                setSaleItems([])
                return
            }

            const productIds = allProducts.map((p) => p.id)
            const variantIds = allProducts.flatMap((p) => p.variants.map((v) => v.id))
            const result = await api.saleItemsGet({ productIds, variantIds })
            setSaleItems(result.data || [])
        }

        fetchSaleItems()
    }, [allProducts])

    const saleItemsByProduct = useMemo(() => {
        return saleItems.reduce<Record<string, ActiveSaleItem[]>>((acc, item) => {
            ;(acc[item.productId] ??= []).push(item)
            return acc
        }, {})
    }, [saleItems])

    const categoryOptions = useMemo(() => {
        const map = new Map<string, { slug: string; name: string; count: number }>()

        allProducts.forEach((product) => {
            const category = categories.find((c) => c.id === product.categoryId)
            const slug = category?.slug || normalizeKey(product.categoryName || "")
            const key = slug || product.categoryId || product.categoryName || "unknown"
            if (!key) return

            const current = map.get(key)
            if (current) {
                current.count += 1
                return
            }

            map.set(key, {
                slug: key,
                name: category?.name || product.categoryName || "Danh mục",
                count: 1,
            })
        })

        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"))
    }, [allProducts, categories])

    const colorOptions = useMemo(() => {
        const counts = new Map<string, number>()

        allProducts.forEach((product) => {
            const uniqueValues = new Set<string>()
            product.variants.forEach((variant) => {
                getVariantValuesByKeySet(variant, COLOR_KEYS).forEach((value) => uniqueValues.add(value))
            })
            uniqueValues.forEach((value) => {
                counts.set(value, (counts.get(value) || 0) + 1)
            })
        })

        return Array.from(counts.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => a.value.localeCompare(b.value, "vi"))
    }, [allProducts])

    const sizeOptions = useMemo(() => {
        const counts = new Map<string, number>()

        allProducts.forEach((product) => {
            const uniqueValues = new Set<string>()
            product.variants.forEach((variant) => {
                getVariantValuesByKeySet(variant, SIZE_KEYS).forEach((value) => uniqueValues.add(value))
            })
            uniqueValues.forEach((value) => {
                counts.set(value, (counts.get(value) || 0) + 1)
            })
        })

        return Array.from(counts.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => a.value.localeCompare(b.value, "vi"))
    }, [allProducts])

    const updateUrl = (nextPage: number) => {
        const params = new URLSearchParams()

        if (sortBy !== "default") params.set("sort", sortBy)
        if (categoryMode === "filter" && selectedCategories.length > 0) {
            params.set("categories", selectedCategories.join(","))
        }
        if (selectedColors.length > 0) params.set("colors", selectedColors.join(","))
        if (selectedSizes.length > 0) params.set("sizes", selectedSizes.join(","))
        if (minPrice !== undefined) params.set("minPrice", String(minPrice))
        if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice))
        if (nextPage > 1) params.set("page", String(nextPage))

        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }

    const handleSortChange = (value: SortOption) => {
        setSortBy(value)
        setCurrentPage(1)
        const params = new URLSearchParams(searchParams.toString())
        if (value === "default") params.delete("sort")
        else params.set("sort", value)
        params.delete("page")
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }

    const handleToggleCategory = (slug: string) => {
        if (categoryMode === "navigate") {
            if (!slug || slug === currentCategorySlug) return
            router.push(`/collection/${slug}`)
            return
        }

        const next = selectedCategories.includes(slug)
            ? selectedCategories.filter((s) => s !== slug)
            : [...selectedCategories, slug]

        setSelectedCategories(next)
        setCurrentPage(1)
        const params = new URLSearchParams(searchParams.toString())
        if (next.length === 0) params.delete("categories")
        else params.set("categories", next.join(","))
        params.delete("page")
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }

    const handleToggleColor = (value: string) => {
        const next = selectedColors.includes(value)
            ? selectedColors.filter((v) => v !== value)
            : [...selectedColors, value]

        setSelectedColors(next)
        setCurrentPage(1)
        const params = new URLSearchParams(searchParams.toString())
        if (next.length === 0) params.delete("colors")
        else params.set("colors", next.join(","))
        params.delete("page")
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }

    const handleToggleSize = (value: string) => {
        const next = selectedSizes.includes(value)
            ? selectedSizes.filter((v) => v !== value)
            : [...selectedSizes, value]

        setSelectedSizes(next)
        setCurrentPage(1)
        const params = new URLSearchParams(searchParams.toString())
        if (next.length === 0) params.delete("sizes")
        else params.set("sizes", next.join(","))
        params.delete("page")
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }

    const handlePriceRangeChange = (value: string | null) => {
        let nextMin: number | undefined = undefined;
        let nextMax: number | undefined = undefined;
        if (value && value !== "all") {
            const [minStr, maxStr] = value.split("-");
            nextMin = minStr ? Number(minStr) : undefined;
            nextMax = maxStr ? Number(maxStr) : undefined;
        }
        setMinPrice(nextMin);
        setMaxPrice(nextMax);
        setCurrentPage(1);

        const params = new URLSearchParams(searchParams.toString());
        if (nextMin === undefined) params.delete("minPrice");
        else params.set("minPrice", String(nextMin));
        if (nextMax === undefined) params.delete("maxPrice");
        else params.set("maxPrice", String(nextMax));
        params.delete("page");
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }

    const clearAllFilters = () => {
        setSortBy("default")
        setSelectedCategories([])
        setSelectedColors([])
        setSelectedSizes([])
        setMinPrice(undefined)
        setMaxPrice(undefined)
        setCurrentPage(1)
        router.replace(pathname, { scroll: false })
    }

    const filteredProducts = useMemo(() => {
        if (serverDriven) {
            return allProducts
        }

        let result = [...allProducts]

        if (categoryMode === "filter" && selectedCategories.length > 0) {
            result = result.filter((product) => {
                const category = categories.find((c) => c.id === product.categoryId)
                const slug = category?.slug || normalizeKey(product.categoryName || "")
                return selectedCategories.includes(slug)
            })
        }

        if (selectedColors.length > 0) {
            result = result.filter((product) =>
                product.variants.some((variant) => {
                    const values = getVariantValuesByKeySet(variant, COLOR_KEYS)
                    return variant.stockQuantity > 0 && values.some((value) => selectedColors.includes(value))
                }),
            )
        }

        if (selectedSizes.length > 0) {
            result = result.filter((product) =>
                product.variants.some((variant) => {
                    const values = getVariantValuesByKeySet(variant, SIZE_KEYS)
                    return variant.stockQuantity > 0 && values.some((value) => selectedSizes.includes(value))
                }),
            )
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            const minPriceInVnd = minPrice !== undefined ? minPrice * 1000 : undefined
            const maxPriceInVnd = maxPrice !== undefined ? maxPrice * 1000 : undefined

            result = result.filter((product) => {
                const inStockVariants = (product.variants ?? []).filter(v => v.stockQuantity > 0)
                if (inStockVariants.length === 0) return false

                const variantPrices = inStockVariants
                    .map((variant) => Number(variant.price))
                    .filter((price) => Number.isFinite(price))
                const salePrices = (saleItemsByProduct[product.id] ?? [])
                    .map((item) => Number(item.salePrice))
                    .filter((price) => Number.isFinite(price))
                const candidatePrices = [...variantPrices, ...salePrices]

                if (candidatePrices.length === 0) return false

                return candidatePrices.some((price) => {
                    if (minPriceInVnd !== undefined && price < minPriceInVnd) return false
                    if (maxPriceInVnd !== undefined && price > maxPriceInVnd) return false
                    return true
                })
            })
        }

        switch (sortBy) {
            case "price-asc":
                result.sort((a, b) => Number(a.variants[0]?.price || 0) - Number(b.variants[0]?.price || 0))
                break
            case "price-desc":
                result.sort((a, b) => Number(b.variants[0]?.price || 0) - Number(a.variants[0]?.price || 0))
                break
            case "name-asc":
                result.sort((a, b) => a.name.localeCompare(b.name, "vi"))
                break
            case "newest":
                result.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                )
                break
        }

        return result
    }, [
        allProducts,
        categories,
        categoryMode,
        selectedCategories,
        selectedColors,
        selectedSizes,
        minPrice,
        maxPrice,
        sortBy,
        serverDriven,
        saleItemsByProduct,
    ])

    const totalPages = Math.max(
        1,
        serverDriven
            ? (serverTotalPages ?? 1)
            : Math.ceil(filteredProducts.length / pageSize),
    )
    const safeCurrentPage = Math.min(currentPage, totalPages)

    const paginatedProducts = useMemo(() => {
        if (serverDriven) {
            return filteredProducts
        }

        const start = (safeCurrentPage - 1) * pageSize
        return filteredProducts.slice(start, start + pageSize)
    }, [filteredProducts, pageSize, safeCurrentPage, serverDriven])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
            updateUrl(totalPages)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, totalPages])

    const hasActiveFilters =
        sortBy !== "default" ||
        (categoryMode === "filter" && selectedCategories.length > 0) ||
        selectedColors.length > 0 ||
        selectedSizes.length > 0 ||
        minPrice !== undefined ||
        maxPrice !== undefined

    return (
        <section className="pb-8 pt-0">
            <div className="border-y border-border">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-9 rounded-md">
                                Danh mục
                                <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-60">
                            <DropdownMenuLabel>Danh mục</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {categoryOptions.map((option) => (
                                <DropdownMenuCheckboxItem
                                    key={option.slug}
                                    checked={
                                        categoryMode === "navigate"
                                            ? option.slug === currentCategorySlug
                                            : selectedCategories.includes(option.slug)
                                    }
                                    onCheckedChange={() => handleToggleCategory(option.slug)}
                                >
                                    <span className="flex-1">{option.name}</span>
                                    <span className="text-xs text-muted-foreground">({option.count})</span>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-9 rounded-md">
                                Màu sắc
                                <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Màu sắc</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {colorOptions.map((option) => (
                                <DropdownMenuCheckboxItem
                                    key={option.value}
                                    checked={selectedColors.includes(option.value)}
                                    onCheckedChange={() => handleToggleColor(option.value)}
                                >
                                    <span
                                        className="h-4 w-4 rounded-full border border-border"
                                        style={{
                                            backgroundColor:
                                                resolveColorSwatch(option.value) ?? "transparent",
                                        }}
                                    />
                                    <span className="flex-1">{option.value}</span>
                                    <span className="text-xs text-muted-foreground">({option.count})</span>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-9 rounded-md">
                                Kích cỡ
                                <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-52">
                            <DropdownMenuLabel>Kích cỡ</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {sizeOptions.map((option) => (
                                <DropdownMenuCheckboxItem
                                    key={option.value}
                                    checked={selectedSizes.includes(option.value)}
                                    onCheckedChange={() => handleToggleSize(option.value)}
                                >
                                    <span className="flex-1">{option.value}</span>
                                    <span className="text-xs text-muted-foreground">({option.count})</span>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-9 rounded-md">
                                Giá
                                <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 p-3">
                            <div className="space-y-2">
                                {PRICE_RANGES.map((range) => {
                                    const isSelected = selectedPriceRange === range.value;
                                    return (
                                        <button
                                            key={`price-${range.value}`}
                                            onClick={() => handlePriceRangeChange(isSelected ? null : range.value)}
                                            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${isSelected ? "bg-accent text-accent-foreground" : ""}`}
                                        >
                                            <span>{range.label}</span>
                                            {isSelected && <X className="h-3 w-3" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-3">
                        <p className="text-sm text-muted-foreground">
                            {serverDriven ? (totalCount ?? filteredProducts.length) : filteredProducts.length} sản phẩm
                        </p>
                        <div className="flex items-center gap-2">
                            <Select
                                value={sortBy}
                                onValueChange={(value) => handleSortChange(value as SortOption)}
                            >
                                <SelectTrigger className="h-9 w-47.5 rounded-md" size="sm">
                                    <SelectValue placeholder="Sắp xếp" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    {Object.entries(SORT_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    {categoryMode === "filter" &&
                        selectedCategories.map((slug) => {
                            const category = categoryOptions.find((c) => c.slug === slug)
                            return (
                                <button
                                    key={slug}
                                    type="button"
                                    onClick={() => handleToggleCategory(slug)}
                                    className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs"
                                >
                                    {category?.name || slug}
                                    <X className="h-3 w-3" />
                                </button>
                            )
                        })}
                    {selectedColors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => handleToggleColor(color)}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs"
                        >
                            <span
                                className="h-3.5 w-3.5 rounded-full border border-border"
                                style={{
                                    backgroundColor:
                                        resolveColorSwatch(color) ?? "transparent",
                                }}
                            />
                            {color}
                            <X className="h-3 w-3" />
                        </button>
                    ))}
                    {selectedSizes.map((size) => (
                        <button
                            key={size}
                            type="button"
                            onClick={() => handleToggleSize(size)}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs"
                        >
                            {size}
                            <X className="h-3 w-3" />
                        </button>
                    ))}
                        <button
                            type="button"
                            onClick={() => {
                                setMinPrice(undefined)
                                setMaxPrice(undefined)
                                setCurrentPage(1)
                                const params = new URLSearchParams(searchParams.toString())
                                params.delete("minPrice")
                                params.delete("maxPrice")
                                params.delete("page")
                                const query = params.toString()
                                router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs"
                        >
                            Giá: {selectedPriceRangeLabel}
                            <X className="h-3 w-3" />
                        </button>
                    <button
                        type="button"
                        onClick={clearAllFilters}
                        className="h-8 rounded-md px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Xóa tất cả
                    </button>
                </div>
            )}

            {paginatedProducts.length === 0 ? (
                <div className="py-20 text-center">
                    <p className="text-base text-muted-foreground">{emptyMessage}</p>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedProducts.map((product) => {
                        const variants = product.variants ?? []
                        const firstVariantPrice = variants[0] ? BigInt(variants[0].price) : null
                        const { minPrice: pMin, maxPrice: pMax } =
                            variants.length > 0 && firstVariantPrice !== null
                                ? variants.reduce(
                                      (acc, variant) => {
                                          const price = BigInt(variant.price)
                                          return {
                                              minPrice: price < acc.minPrice ? price : acc.minPrice,
                                              maxPrice: price > acc.maxPrice ? price : acc.maxPrice,
                                          }
                                      },
                                      { minPrice: firstVariantPrice, maxPrice: firstVariantPrice },
                                  )
                                : { minPrice: null, maxPrice: null }

                        const productSaleItems = saleItemsByProduct[product.id] ?? []
                        const salePrices = productSaleItems.map((item) => item.salePrice)
                        const originalPrices = productSaleItems
                            .map((item) => item.originalPrice)
                            .filter((price): price is number => typeof price === "number")

                        const minSale = salePrices.length ? Math.min(...salePrices) : null
                        const maxSale = salePrices.length ? Math.max(...salePrices) : null
                        const minOriginal =
                            originalPrices.length > 0
                                ? Math.min(...originalPrices)
                                : pMin !== null
                                  ? Number(pMin)
                                  : null
                        const maxOriginal =
                            originalPrices.length > 0
                                ? Math.max(...originalPrices)
                                : pMax !== null
                                  ? Number(pMax)
                                  : null

                        const priceDisplay =
                            variants.length > 1 && pMin && pMax && pMin !== pMax
                                ? `${formatFromVnd(pMin)} - ${formatFromVnd(pMax)}`
                                : pMin
                                  ? formatFromVnd(pMin)
                                  : null

                        const salePriceDisplay =
                            minSale !== null && maxSale !== null
                                ? minSale !== maxSale
                                    ? `${formatFromVnd(BigInt(Math.round(minSale)))} - ${formatFromVnd(BigInt(Math.round(maxSale)))}`
                                    : formatFromVnd(BigInt(Math.round(minSale)))
                                : null

                        const originalPriceDisplay =
                            minOriginal !== null && maxOriginal !== null
                                ? minOriginal !== maxOriginal
                                    ? `${formatFromVnd(BigInt(Math.round(minOriginal)))} - ${formatFromVnd(BigInt(Math.round(maxOriginal)))}`
                                    : formatFromVnd(BigInt(Math.round(minOriginal)))
                                : null

                        const allImages = [
                            ...(product.images ?? []),
                            ...(variants
                                .flatMap((variant) => variant.images ?? [])
                                .filter((img) => !(product.images ?? []).includes(img)) ?? []),
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
                                <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-secondary">
                                    {productSaleItems.length > 0 && (
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
                                    <h3 className="text-base font-medium text-foreground">{product.name}</h3>
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
                                        <p className="text-base font-semibold text-foreground">{priceDisplay}</p>
                                    )}
                                </div>
                            </AppLink>
                        )
                    })}
                </div>
            )}

            {filteredProducts.length > 0 && (
                <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                    <button
                        type="button"
                        onClick={() => {
                            if (safeCurrentPage <= 1) return
                            const nextPage = safeCurrentPage - 1
                            setCurrentPage(nextPage)
                            updateUrl(nextPage)
                        }}
                        disabled={safeCurrentPage <= 1}
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-border px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Trang trước"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Trước
                    </button>
                    <span className="min-w-20 text-center text-sm text-muted-foreground">
                        {safeCurrentPage} / {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            if (safeCurrentPage >= totalPages) return
                            const nextPage = safeCurrentPage + 1
                            setCurrentPage(nextPage)
                            updateUrl(nextPage)
                        }}
                        disabled={safeCurrentPage >= totalPages}
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-border px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Trang sau"
                    >
                        Sau
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </nav>
            )}
            </div>
        </section>
    )
}
