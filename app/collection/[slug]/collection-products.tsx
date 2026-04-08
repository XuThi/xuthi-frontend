"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppLink } from "@/components/app-link"
import { api } from "@/lib/api/client"
import type { ActiveSaleItem, Product } from "@/lib/api/types"
import { CURRENCY, LOCALE } from "@/lib/constants"
import { formatMoney } from "@/lib/money"
import { ArrowUpDown, SlidersHorizontal, X } from "lucide-react"

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc" | "newest"

const SORT_LABELS: Record<SortOption, string> = {
    default: "Mặc định",
    "price-asc": "Giá: Thấp → Cao",
    "price-desc": "Giá: Cao → Thấp",
    "name-asc": "Tên: A → Z",
    newest: "Mới nhất",
}

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
    pageSize = 100,
}: CollectionProductsProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [allProducts] = useState<Product[]>(initialProducts)
    const [saleItems, setSaleItems] = useState<ActiveSaleItem[]>([])

    // Read initial filter state from URL
    const initialSort = (searchParams.get("sort") as SortOption) || "default"
    const initialBrands = searchParams
        .get("brands")
        ?.split(",")
        .filter(Boolean) || []
    const initialAttributes = Object.fromEntries(
        Array.from(searchParams.entries())
            .filter(([key]) => key.startsWith("attr_"))
            .map(([key, value]) => [
                key.slice(5),
                value.split(",").filter(Boolean),
            ]),
    ) as Record<string, string[]>
    const initialMinPrice = searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined
    const initialMaxPrice = searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined

    const [sortBy, setSortBy] = useState<SortOption>(initialSort)
    const [minPriceInput, setMinPriceInput] = useState(
        initialMinPrice?.toString() ?? "",
    )
    const [maxPriceInput, setMaxPriceInput] = useState(
        initialMaxPrice?.toString() ?? "",
    )
    const [minPrice, setMinPrice] = useState(initialMinPrice)
    const [maxPrice, setMaxPrice] = useState(initialMaxPrice)
    const [showFilters, setShowFilters] = useState(false)
    const [selectedBrands, setSelectedBrands] = useState(initialBrands)
    const [selectedAttributes, setSelectedAttributes] =
        useState<Record<string, string[]>>(initialAttributes)

    // Fetch sale items once
    useEffect(() => {
        const fetchSaleItems = async () => {
            if (allProducts.length === 0) {
                setSaleItems([])
                return
            }
            const productIds = allProducts.map((product) => product.id)
            const variantIds = allProducts.flatMap((product) =>
                product.variants.map((variant) => variant.id),
            )
            const result = await api.saleItemsGet({ productIds, variantIds })
            setSaleItems(result.data || [])
        }

        fetchSaleItems()
    }, [allProducts])

    const saleItemsByProduct = useMemo(() => {
        return saleItems.reduce<Record<string, ActiveSaleItem[]>>(
            (acc, item) => {
                ;(acc[item.productId] ??= []).push(item)
                return acc
            },
            {},
        )
    }, [saleItems])

    const brandFacets = useMemo(() => {
        const counts = new Map<string, { label: string; count: number }>()

        allProducts.forEach((product) => {
            const key = product.brandId || product.brandName || "unknown"
            const current = counts.get(key)
            if (current) {
                counts.set(key, {
                    ...current,
                    count: current.count + 1,
                })
                return
            }

            counts.set(key, {
                label: product.brandName || "Không rõ thương hiệu",
                count: 1,
            })
        })

        return Array.from(counts.entries())
            .map(([value, meta]) => ({ value, ...meta }))
            .sort((a, b) => a.label.localeCompare(b.label, "vi"))
    }, [allProducts])

    const attributeFacets = useMemo(() => {
        const facets = new Map<string, { label: string; values: Map<string, number> }>()

        allProducts.forEach((product) => {
            product.variants.forEach((variant) => {
                Object.entries(variant.attributes || {}).forEach(
                    ([attrKey, attrValue]) => {
                        if (!attrValue) return

                        const currentFacet = facets.get(attrKey) || {
                            label: product.optionNames?.[attrKey] || attrKey,
                            values: new Map<string, number>(),
                        }

                        currentFacet.values.set(
                            attrValue,
                            (currentFacet.values.get(attrValue) || 0) + 1,
                        )

                        facets.set(attrKey, currentFacet)
                    },
                )
            })
        })

        return Array.from(facets.entries())
            .map(([key, facet]) => ({
                key,
                label: facet.label,
                values: Array.from(facet.values.entries())
                    .map(([value, count]) => ({ value, count }))
                    .sort((a, b) => a.value.localeCompare(b.value, "vi")),
            }))
            .sort((a, b) => a.label.localeCompare(b.label, "vi"))
    }, [allProducts])

    // Update URL when filters change
    const updateURL = (
        newSort: SortOption,
        newMin?: number,
        newMax?: number,
        brands: string[] = selectedBrands,
        attributes: Record<string, string[]> = selectedAttributes,
    ) => {
        const params = new URLSearchParams()
        if (newSort !== "default") params.set("sort", newSort)
        if (newMin !== undefined) params.set("minPrice", String(newMin))
        if (newMax !== undefined) params.set("maxPrice", String(newMax))

        if (brands.length > 0) {
            params.set("brands", brands.join(","))
        }

        Object.entries(attributes).forEach(([key, values]) => {
            if (values.length > 0) {
                params.set(`attr_${key}`, values.join(","))
            }
        })

        const query = params.toString()
        router.replace(`?${query}`, { scroll: false })
    }

    const handleSortChange = (newSort: SortOption) => {
        setSortBy(newSort)
        updateURL(newSort, minPrice, maxPrice)
    }

    const handleToggleBrand = (brand: string) => {
        const nextBrands = selectedBrands.includes(brand)
            ? selectedBrands.filter((item) => item !== brand)
            : [...selectedBrands, brand]

        setSelectedBrands(nextBrands)
        updateURL(sortBy, minPrice, maxPrice, nextBrands, selectedAttributes)
    }

    const handleToggleAttribute = (attributeKey: string, value: string) => {
        const current = selectedAttributes[attributeKey] || []
        const nextValues = current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value]

        const nextAttributes: Record<string, string[]> = {
            ...selectedAttributes,
            [attributeKey]: nextValues,
        }

        if (nextValues.length === 0) {
            delete nextAttributes[attributeKey]
        }

        setSelectedAttributes(nextAttributes)
        updateURL(sortBy, minPrice, maxPrice, selectedBrands, nextAttributes)
    }

    const handleApplyPriceFilter = () => {
        const newMin = minPriceInput ? Number(minPriceInput) : undefined
        const newMax = maxPriceInput ? Number(maxPriceInput) : undefined
        setMinPrice(newMin)
        setMaxPrice(newMax)
        updateURL(sortBy, newMin, newMax)
    }

    const handleClearFilters = () => {
        setSortBy("default")
        setMinPriceInput("")
        setMaxPriceInput("")
        setMinPrice(undefined)
        setMaxPrice(undefined)
        setSelectedBrands([])
        setSelectedAttributes({})
        router.replace("?", { scroll: false })
    }

    const hasActiveFilters =
        sortBy !== "default" ||
        minPrice !== undefined ||
        maxPrice !== undefined ||
        selectedBrands.length > 0 ||
        Object.keys(selectedAttributes).length > 0
    const currentCategoryName = allProducts[0]?.categoryName || categoryId

    // Client-side filtering & sorting (useMemo for performance)
    const filteredProducts = useMemo(() => {
        let result = [...allProducts]

        if (selectedBrands.length > 0) {
            result = result.filter((product) => {
                const brandKey =
                    product.brandId || product.brandName || "unknown"
                return selectedBrands.includes(brandKey)
            })
        }

        if (Object.keys(selectedAttributes).length > 0) {
            result = result.filter((product) => {
                return Object.entries(selectedAttributes).every(
                    ([attributeKey, values]) => {
                        if (values.length === 0) {
                            return true
                        }

                        return product.variants.some((variant) =>
                            values.includes(variant.attributes?.[attributeKey]),
                        )
                    },
                )
            })
        }

        // Price filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            result = result.filter((product) => {
                const variants = product.variants ?? []
                if (variants.length === 0) return true

                const prices = variants.map((v) => Number(v.price))
                const productMinPrice = Math.min(...prices)

                if (minPrice !== undefined && productMinPrice < minPrice * 1000)
                    return false
                if (maxPrice !== undefined && productMinPrice > maxPrice * 1000)
                    return false
                return true
            })
        }

        // Sort
        switch (sortBy) {
            case "price-asc":
                result.sort((a, b) => {
                    const aPrice = a.variants[0]
                        ? Number(a.variants[0].price)
                        : 0
                    const bPrice = b.variants[0]
                        ? Number(b.variants[0].price)
                        : 0
                    return aPrice - bPrice
                })
                break
            case "price-desc":
                result.sort((a, b) => {
                    const aPrice = a.variants[0]
                        ? Number(a.variants[0].price)
                        : 0
                    const bPrice = b.variants[0]
                        ? Number(b.variants[0].price)
                        : 0
                    return bPrice - aPrice
                })
                break
            case "name-asc":
                result.sort((a, b) => a.name.localeCompare(b.name, "vi"))
                break
            case "newest":
                result.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                )
                break
        }

        return result
    }, [
        allProducts,
        sortBy,
        minPrice,
        maxPrice,
        selectedBrands,
        selectedAttributes,
    ])

    return (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
            {/* Filter/Sort Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <p className="text-sm text-muted-foreground">
                    {filteredProducts.length} sản phẩm
                    {hasActiveFilters && ` (lọc từ ${allProducts.length})`}
                </p>

                <div className="flex items-center gap-3 lg:hidden">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) =>
                                handleSortChange(e.target.value as SortOption)
                            }
                            className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-sm font-medium text-foreground cursor-pointer hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {Object.entries(SORT_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                            showFilters || hasActiveFilters
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-foreground hover:border-primary/50"
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Lọc
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                    </button>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                            Xoá bộ lọc
                        </button>
                    )}
                </div>
            </div>

            {/* Price Filter Panel */}
            {showFilters && (
                <div className="mb-8 p-4 bg-card border border-border rounded-xl animate-in slide-in-from-top-2 duration-200 lg:hidden">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                Giá tối thiểu (nghìn đ)
                            </label>
                            <input
                                type="number"
                                value={minPriceInput}
                                onChange={(e) => setMinPriceInput(e.target.value)}
                                placeholder="0"
                                className="w-32 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                Giá tối đa (nghìn đ)
                            </label>
                            <input
                                type="number"
                                value={maxPriceInput}
                                onChange={(e) => setMaxPriceInput(e.target.value)}
                                placeholder="∞"
                                className="w-32 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleApplyPriceFilter}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                            Áp dụng
                        </button>
                    </div>

                    <div className="mt-5 space-y-5">
                        <div>
                            <h3 className="text-sm font-semibold">Thương hiệu</h3>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                {brandFacets.map((brand) => (
                                    <label
                                        key={`mobile-${brand.value}`}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedBrands.includes(
                                                brand.value,
                                            )}
                                            onChange={() =>
                                                handleToggleBrand(brand.value)
                                            }
                                            className="h-4 w-4 rounded border-border"
                                        />
                                        <span className="truncate">
                                            {brand.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {attributeFacets.map((facet) => (
                            <div key={`mobile-${facet.key}`}>
                                <h3 className="text-sm font-semibold">
                                    {facet.label}
                                </h3>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    {facet.values.map((value) => (
                                        <label
                                            key={`mobile-${facet.key}-${value.value}`}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={(
                                                    selectedAttributes[
                                                        facet.key
                                                    ] || []
                                                ).includes(value.value)}
                                                onChange={() =>
                                                    handleToggleAttribute(
                                                        facet.key,
                                                        value.value,
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-border"
                                            />
                                            <span className="truncate">
                                                {value.value}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,72rem)_260px] lg:justify-center">
                <aside className="hidden lg:block space-y-6">
                    <div className="rounded-xl border p-4">
                        <h3 className="text-sm font-semibold">Danh mục</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {currentCategoryName}
                        </p>
                    </div>

                    <div className="rounded-xl border p-4">
                        <h3 className="text-sm font-semibold">Thương hiệu</h3>
                        <div className="mt-3 space-y-2">
                            {brandFacets.map((brand) => (
                                <label
                                    key={brand.value}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedBrands.includes(
                                            brand.value,
                                        )}
                                        onChange={() =>
                                            handleToggleBrand(brand.value)
                                        }
                                        className="h-4 w-4 rounded border-border"
                                    />
                                    <span>{brand.label}</span>
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {brand.count}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {attributeFacets.length > 0 && (
                        <div className="rounded-xl border p-4 space-y-4">
                            <h3 className="text-sm font-semibold">Thuộc tính</h3>
                            {attributeFacets.map((facet) => (
                                <div key={facet.key} className="space-y-2">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        {facet.label}
                                    </div>
                                    <div className="space-y-1.5">
                                        {facet.values.map((value) => (
                                            <label
                                                key={`${facet.key}-${value.value}`}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={(
                                                        selectedAttributes[
                                                            facet.key
                                                        ] || []
                                                    ).includes(value.value)}
                                                    onChange={() =>
                                                        handleToggleAttribute(
                                                            facet.key,
                                                            value.value,
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-border"
                                                />
                                                <span>{value.value}</span>
                                                <span className="ml-auto text-xs text-muted-foreground">
                                                    {value.count}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>

                <div>
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-lg text-muted-foreground mb-4">
                                Không tìm thấy sản phẩm phù hợp
                            </p>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                            >
                                Xoá bộ lọc
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProducts.map((product) => {
                                const variants = product.variants ?? []
                                const firstVariantPrice = variants[0]
                                    ? BigInt(variants[0].price)
                                    : null
                                const { minPrice: pMin, maxPrice: pMax } =
                                    variants.length > 0 &&
                                    firstVariantPrice !== null
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
                                        : {
                                              minPrice: null,
                                              maxPrice: null,
                                          }

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
                                            ((original - item.salePrice) /
                                                original) *
                                                100,
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
                                    : pMin !== null
                                      ? Number(pMin)
                                      : null
                                const maxOriginal = originalPrices.length
                                    ? Math.max(...originalPrices)
                                    : pMax !== null
                                      ? Number(pMax)
                                      : null

                                const priceDisplay =
                                    variants.length > 1 &&
                                    pMin &&
                                    pMax &&
                                    pMin !== pMax
                                        ? `${formatMoney({ amount: pMin, currency: CURRENCY, locale: LOCALE })} - ${formatMoney({ amount: pMax, currency: CURRENCY, locale: LOCALE })}`
                                        : pMin
                                          ? formatMoney({
                                                amount: pMin,
                                                currency: CURRENCY,
                                                locale: LOCALE,
                                            })
                                          : null

                                const salePriceDisplay =
                                    minSale !== null && maxSale !== null
                                        ? minSale !== maxSale
                                            ? `${formatMoney({ amount: BigInt(Math.round(minSale)), currency: CURRENCY, locale: LOCALE })} - ${formatMoney({ amount: BigInt(Math.round(maxSale)), currency: CURRENCY, locale: LOCALE })}`
                                            : formatMoney({
                                                  amount: BigInt(
                                                      Math.round(minSale),
                                                  ),
                                                  currency: CURRENCY,
                                                  locale: LOCALE,
                                              })
                                        : null

                                const originalPriceDisplay =
                                    minOriginal !== null &&
                                    maxOriginal !== null
                                        ? minOriginal !== maxOriginal
                                            ? `${formatMoney({ amount: BigInt(Math.round(minOriginal)), currency: CURRENCY, locale: LOCALE })} - ${formatMoney({ amount: BigInt(Math.round(maxOriginal)), currency: CURRENCY, locale: LOCALE })}`
                                            : formatMoney({
                                                  amount: BigInt(
                                                      Math.round(minOriginal),
                                                  ),
                                                  currency: CURRENCY,
                                                  locale: LOCALE,
                                              })
                                        : null
                                const maxDiscountPercent =
                                    discountPercents.length
                                        ? Math.max(...discountPercents)
                                        : null

                                const allImages = [
                                    ...(product.images ?? []),
                                    ...(variants
                                        .flatMap((v) => v.images ?? [])
                                        .filter(
                                            (img) =>
                                                !(product.images ?? []).includes(
                                                    img,
                                                ),
                                        ) ?? []),
                                ]
                                const primaryImage = allImages[0]
                                const secondaryImage = allImages[1]

                                return (
                                    <AppLink
                                        prefetch={false}
                                        key={product.id}
                                        href={`/product/${product.slug}`}
                                        className="group cursor-pointer"
                                    >
                                        <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden mb-4">
                                            {maxDiscountPercent && (
                                                <span className="absolute left-3 top-3 z-10 rounded-full bg-sale px-2.5 py-1 text-xs font-semibold text-sale-foreground">
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
                                                            {
                                                                originalPriceDisplay
                                                            }
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
                    )}
                </div>

                <aside className="hidden lg:block space-y-6">
                    <div className="rounded-xl border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Sắp xếp</h3>
                            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) =>
                                handleSortChange(e.target.value as SortOption)
                            }
                            className="w-full appearance-none bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {Object.entries(SORT_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="rounded-xl border p-4 space-y-3">
                        <h3 className="text-sm font-semibold">Khoảng giá (nghìn đ)</h3>
                        <input
                            type="number"
                            value={minPriceInput}
                            onChange={(e) => setMinPriceInput(e.target.value)}
                            placeholder="Giá từ"
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <input
                            type="number"
                            value={maxPriceInput}
                            onChange={(e) => setMaxPriceInput(e.target.value)}
                            placeholder="Giá đến"
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                            type="button"
                            onClick={handleApplyPriceFilter}
                            className="w-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                            Áp dụng
                        </button>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="w-full px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                Xóa tất cả bộ lọc
                            </button>
                        )}
                    </div>
                </aside>
            </div>
        </section>
    )
}
