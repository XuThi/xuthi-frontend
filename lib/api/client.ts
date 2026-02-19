/**
 * XuThi Backend API Client
 * Replaces the commerce-kit client with direct calls to our backend API
 */

import type {
    Product,
    ProductSearchResult,
    Category,
    CategoryWithProducts,
    Cart,
    Order,
    Brand,
    VariantOption,
    Customer,
    CustomerDetail,
    Voucher,
    SaleCampaign,
    SaleCampaignDetail,
    ActiveSaleItem,
} from "./types"

// Get the API base URL from environment
const getApiBaseUrl = () => {
    // In development with Aspire, this will be set by the service discovery
    // Service name is "apiservice" so env vars are services__apiservice__*
    const apiUrl =
        process.env["services__apiservice__https__0"] ||
        process.env["services__apiservice__http__0"]
    if (apiUrl) return apiUrl

    // Fallback for local development
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5331"
}

const API_BASE_URL = getApiBaseUrl()

/**
 * Generic fetch wrapper with error handling
 */
/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const url =
        typeof window === "undefined"
            ? `${API_BASE_URL}${endpoint}`
            : `/api/bff${endpoint}`

    // Try to retrieve access token from localStorage (client-side only)
    let token: string | undefined

    if (typeof window !== "undefined") {
        // Client-side: get token from localStorage
        token = localStorage.getItem("xuthi_auth_token") || undefined
    }
    // Note: Server-side API calls don't include auth token automatically
    // For authenticated server-side requests, the token should be passed via options.headers

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
    }

    if (token) {
        ;(headers as any)["Authorization"] = `Bearer ${token}`
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`API Error ${response.status}: ${errorText}`)
            throw new Error(`API Error ${response.status}: ${errorText}`)
        }

        // Handle empty responses
        const text = await response.text()
        if (!text) return {} as T

        return JSON.parse(text) as T
    } catch (error) {
        // Log but don't crash - return empty data for SSR resilience
        // Silence 404s for cart endpoints as they are expected for new sessions
        if (
            options.method === "GET" &&
            endpoint.includes("/api/cart") &&
            (error as any)?.message?.includes("404")
        ) {
            throw error
        }

        console.error(`API fetch failed for ${endpoint}:`, error)
        throw error
    }
}

// ============ Products API ============

export interface ProductBrowseParams {
    active?: boolean
    limit?: number
    page?: number
    categoryId?: string
    brandId?: string
    searchTerm?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: "name" | "price" | "createdAt"
    sortDirection?: "asc" | "desc"
}

async function productBrowse(params: ProductBrowseParams = {}): Promise<{
    data: Product[]
    totalCount: number
}> {
    const searchParams = new URLSearchParams()

    if (params.active !== undefined)
        searchParams.set("isActive", String(params.active))
    if (params.limit) searchParams.set("pageSize", String(params.limit))
    if (params.page) searchParams.set("page", String(params.page))
    if (params.categoryId) searchParams.set("categoryId", params.categoryId)
    if (params.brandId) searchParams.set("brandId", params.brandId)
    if (params.searchTerm) searchParams.set("searchTerm", params.searchTerm)
    if (params.minPrice) searchParams.set("minPrice", String(params.minPrice))
    if (params.maxPrice) searchParams.set("maxPrice", String(params.maxPrice))
    if (params.sortBy) searchParams.set("sortBy", params.sortBy)
    if (params.sortDirection)
        searchParams.set("sortDirection", params.sortDirection)

    const queryString = searchParams.toString()
    const endpoint = `/api/products${queryString ? `?${queryString}` : ""}`

    try {
        const result = await apiFetch<ProductSearchResult>(endpoint)
        return {
            data: result.products || [],
            totalCount: result.totalCount || 0,
        }
    } catch {
        // Return empty data on error so the page still renders
        return { data: [], totalCount: 0 }
    }
}

async function productGet(params: {
    idOrSlug: string
}): Promise<Product | null> {
    try {
        // Try by slug first (more common for SEO-friendly URLs)
        const isGuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                params.idOrSlug,
            )

        const endpoint = isGuid
            ? `/api/products/${params.idOrSlug}`
            : `/api/products/by-slug/${params.idOrSlug}`

        return await apiFetch<Product>(endpoint)
    } catch {
        return null
    }
}

// ============ Categories API (replaces "Collections") ============

// Backend response type (different from frontend type)
interface BackendCategory {
    id: string
    name: string
    urlSlug: string // Backend uses urlSlug
    description?: string
    parentCategoryId?: string
    sortOrder: number
    productCount: number
}

async function categoryBrowse(
    params: { limit?: number; parentId?: string } = {},
): Promise<{
    data: Category[]
}> {
    const searchParams = new URLSearchParams()
    if (params.parentId) searchParams.set("parentId", params.parentId)

    const queryString = searchParams.toString()
    const endpoint = `/api/categories${queryString ? `?${queryString}` : ""}`

    try {
        const result = await apiFetch<{ categories: Category[] }>(endpoint)
        let categories = (result.categories || []).map((c) => ({
            id: c.id,
            name: c.name,
            slug: (c as any).urlSlug || c.slug, // Map urlSlug to slug
            description: c.description,
            parentCategoryId: c.parentCategoryId,
            sortOrder: c.sortOrder,
            productCount: c.productCount,
        }))

        // Apply limit if specified
        if (params.limit && categories.length > params.limit) {
            categories = categories.slice(0, params.limit)
        }

        return { data: categories }
    } catch {
        // Return empty array if categories endpoint fails (backend might not be ready)
        return { data: [] }
    }
}

async function categoryGet(params: {
    idOrSlug: string
}): Promise<CategoryWithProducts | null> {
    try {
        // First get all categories to find by slug
        const { data: categories } = await categoryBrowse({})
        const category = categories.find(
            (c) => c.id === params.idOrSlug || c.slug === params.idOrSlug,
        )

        if (!category) return null

        // Get products in this category
        const { data: products } = await productBrowse({
            categoryId: category.id,
            active: true,
        })

        return {
            ...category,
            products,
        }
    } catch {
        return null
    }
}

// ============ Brands API ============

// ============ Brands API ============

export interface CreateBrandParams {
    name: string
    urlSlug: string
    description?: string
    logoUrl?: string // Optional
}

export interface UpdateBrandParams extends Partial<CreateBrandParams> {}

async function brandBrowse(): Promise<{ data: Brand[] }> {
    try {
        const result = await apiFetch<{ brands: Brand[] }>("/api/brands")
        return { data: result.brands || [] }
    } catch {
        return { data: [] }
    }
}

async function brandGet(id: string): Promise<Brand | null> {
    try {
        const result = await apiFetch<{ brand: Brand } | Brand>(
            `/api/brands/${id}`,
        )
        return "brand" in result ? result.brand : result
    } catch {
        return null
    }
}

// ============ Variant Options API ============

export interface CreateVariantOptionParams {
    id: string
    name: string
    displayType: string
    values: string[]
}

export interface UpdateVariantOptionParams {
    name?: string
    displayType?: string
    values?: string[]
}

async function variantOptionBrowse(): Promise<{ data: VariantOption[] }> {
    try {
        const result = await apiFetch<VariantOption[]>("/api/variant-options")
        return { data: result || [] } // Endpoint returns list direct
    } catch {
        return { data: [] }
    }
}

async function variantOptionCreate(
    params: CreateVariantOptionParams,
): Promise<VariantOption | null> {
    try {
        const result = await apiFetch<VariantOption>("/api/variant-options", {
            method: "POST",
            body: JSON.stringify(params),
        })
        return result
    } catch {
        return null
    }
}

async function variantOptionUpdate(
    id: string,
    params: UpdateVariantOptionParams,
): Promise<VariantOption | null> {
    try {
        const result = await apiFetch<VariantOption>(
            `/api/variant-options/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(params),
            },
        )
        return result
    } catch {
        return null
    }
}

async function variantOptionDelete(id: string): Promise<boolean> {
    try {
        await apiFetch(`/api/variant-options/${id}`, {
            method: "DELETE",
        })
        return true
    } catch {
        return false
    }
}

async function brandCreate(params: CreateBrandParams): Promise<Brand | null> {
    try {
        const result = await apiFetch<Brand>("/api/brands", {
            method: "POST",
            body: JSON.stringify(params),
        })
        return result
    } catch {
        return null
    }
}

async function brandUpdate(
    id: string,
    params: UpdateBrandParams,
): Promise<Brand | null> {
    try {
        const result = await apiFetch<Brand>(`/api/brands/${id}`, {
            method: "PUT",
            body: JSON.stringify(params),
        })
        return result
    } catch {
        return null
    }
}

async function brandDelete(id: string): Promise<boolean> {
    try {
        await apiFetch(`/api/brands/${id}`, {
            method: "DELETE",
        })
        return true
    } catch {
        return false
    }
}

// ============ Cart API ============

async function cartGet(params: { cartId: string }): Promise<Cart | null> {
    try {
        const endpoint = `/api/cart?cartId=${params.cartId}`
        const result = await apiFetch<{ cart: Cart | null }>(endpoint)
        return result.cart
    } catch {
        return null
    }
}

async function cartGetBySession(params: {
    sessionId: string
}): Promise<Cart | null> {
    try {
        const endpoint = `/api/cart?sessionId=${params.sessionId}`
        const result = await apiFetch<{ cart: Cart | null }>(endpoint)
        return result.cart
    } catch {
        return null
    }
}

async function cartUpsert(params: {
    sessionId: string
    variantId: string
    quantity: number
}): Promise<Cart | null> {
    try {
        // Add item to cart - backend creates cart if doesn't exist
        // Response is { cartId: Guid, cart: CartDto }
        const result = await apiFetch<{ cart: Cart }>("/api/cart/items", {
            method: "POST",
            body: JSON.stringify({
                sessionId: params.sessionId,
                productId: params.variantId,
                variantId: params.variantId,
                quantity: params.quantity,
            }),
        })

        return result.cart
    } catch {
        return null
    }
}

async function cartRemoveItem(params: {
    cartId: string
    variantId: string
}): Promise<void> {
    await apiFetch(`/api/cart/${params.cartId}/items/${params.variantId}`, {
        method: "DELETE",
    })
}

async function cartUpdateItem(params: {
    cartId: string
    variantId: string
    quantity: number
}): Promise<Cart | null> {
    try {
        const result = await apiFetch<{ cart: Cart | null }>(
            `/api/cart/${params.cartId}/items/${params.variantId}`,
            {
                method: "PUT",
                body: JSON.stringify({ quantity: params.quantity }),
            },
        )
        return result.cart
    } catch {
        return null
    }
}

async function cartClear(params: { cartId: string }): Promise<boolean> {
    try {
        await apiFetch(`/api/cart/${params.cartId}`, {
            method: "DELETE",
        })
        return true
    } catch {
        return false
    }
}

// ============ Orders API ============

async function orderBrowse(): Promise<{ data: Order[] }> {
    try {
        const result = await apiFetch<{ orders: Order[] }>("/api/orders")
        return { data: result.orders || [] }
    } catch {
        return { data: [] }
    }
}

async function orderGet(params: { id: string }): Promise<Order | null> {
    try {
        // Check if it's a GUID or order number
        const isGuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                params.id,
            )

        const endpoint = isGuid
            ? `/api/orders/${params.id}`
            : `/api/orders/by-number/${params.id}`

        const result = await apiFetch<Order | { order: Order }>(endpoint)
        return (result as any).order ?? (result as Order)
    } catch {
        return null
    }
}

// ============ Customers API ============

async function customerBrowse(params: {
    page?: number
    limit?: number
    search?: string
}): Promise<{ data: Customer[]; total: number }> {
    try {
        const query = new URLSearchParams()
        if (params.page) query.append("Page", params.page.toString())
        if (params.limit) query.append("PageSize", params.limit.toString())
        if (params.search) query.append("Search", params.search)

        const result = await apiFetch<{
            customers: Customer[]
            totalCount: number
        }>(`/api/customers?${query.toString()}`)
        return { data: result.customers || [], total: result.totalCount }
    } catch {
        return { data: [], total: 0 }
    }
}

async function customerGet(params: {
    id: string
}): Promise<CustomerDetail | null> {
    try {
        const result = await apiFetch<
            CustomerDetail | { customer: CustomerDetail }
        >(`/api/customers/${params.id}`)
        return (result as any).customer ?? (result as CustomerDetail)
    } catch {
        return null
    }
}

async function customerGetByExternal(
    externalId: string,
): Promise<CustomerDetail | null> {
    try {
        const result = await apiFetch<
            CustomerDetail | { customer: CustomerDetail }
        >(`/api/customers/by-external/${externalId}`)
        return (result as any).customer ?? (result as CustomerDetail)
    } catch {
        return null
    }
}

async function addressCreate(params: {
    customerId: string
    label: string
    recipientName: string
    phone: string
    address: string
    ward: string
    district: string
    city: string
    note?: string
    setAsDefault?: boolean
}): Promise<{ addressId: string } | null> {
    try {
        const result = await apiFetch<{ addressId: string }>(
            `/api/customers/${params.customerId}/addresses`,
            {
                method: "POST",
                body: JSON.stringify({
                    label: params.label,
                    recipientName: params.recipientName,
                    phone: params.phone,
                    address: params.address,
                    ward: params.ward,
                    district: params.district,
                    city: params.city,
                    note: params.note,
                    setAsDefault: params.setAsDefault ?? false,
                }),
            },
        )
        return result
    } catch {
        return null
    }
}

async function addressUpdate(params: {
    customerId: string
    addressId: string
    label: string
    recipientName: string
    phone: string
    address: string
    ward: string
    district: string
    city: string
    note?: string
    isDefault: boolean
}): Promise<boolean> {
    try {
        await apiFetch(
            `/api/customers/${params.customerId}/addresses/${params.addressId}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    label: params.label,
                    recipientName: params.recipientName,
                    phone: params.phone,
                    address: params.address,
                    ward: params.ward,
                    district: params.district,
                    city: params.city,
                    note: params.note,
                    isDefault: params.isDefault,
                }),
            },
        )
        return true
    } catch {
        return false
    }
}

async function addressDelete(params: {
    customerId: string
    addressId: string
}): Promise<boolean> {
    try {
        await apiFetch(
            `/api/customers/${params.customerId}/addresses/${params.addressId}`,
            {
                method: "DELETE",
            },
        )
        return true
    } catch {
        return false
    }
}

async function addressSetDefault(params: {
    customerId: string
    addressId: string
}): Promise<boolean> {
    try {
        await apiFetch(
            `/api/customers/${params.customerId}/addresses/${params.addressId}/default`,
            {
                method: "PATCH",
            },
        )
        return true
    } catch {
        return false
    }
}

// ============ Vouchers API ============

async function voucherBrowse(): Promise<{ data: Voucher[] }> {
    try {
        const result = await apiFetch<{ vouchers: Voucher[] }>("/api/vouchers")
        return { data: result.vouchers || [] }
    } catch {
        return { data: [] }
    }
}

async function voucherGet(id: string): Promise<Voucher | null> {
    try {
        return await apiFetch<Voucher>(`/api/vouchers/${id}`)
    } catch {
        return null
    }
}

// ============ Sale Campaigns API ============

export interface SaleCampaignBrowseParams {
    isActive?: boolean
    isFeatured?: boolean
    onlyRunning?: boolean
    onlyUpcoming?: boolean
    type?: number
    page?: number
    pageSize?: number
}

export interface SaleCampaignItemPayload {
    productId: string
    variantId?: string | null
    salePrice: number
    originalPrice?: number | null
    discountPercentage?: number | null
    maxQuantity?: number | null
}

async function saleCampaignBrowse(
    params: SaleCampaignBrowseParams = {},
): Promise<{ data: SaleCampaign[]; totalCount: number }> {
    const searchParams = new URLSearchParams()
    if (params.isActive !== undefined)
        searchParams.set("IsActive", String(params.isActive))
    if (params.isFeatured !== undefined)
        searchParams.set("IsFeatured", String(params.isFeatured))
    if (params.onlyRunning !== undefined)
        searchParams.set("OnlyRunning", String(params.onlyRunning))
    if (params.onlyUpcoming !== undefined)
        searchParams.set("OnlyUpcoming", String(params.onlyUpcoming))
    if (params.type !== undefined) searchParams.set("Type", String(params.type))
    if (params.page) searchParams.set("Page", String(params.page))
    if (params.pageSize) searchParams.set("PageSize", String(params.pageSize))

    const endpoint = `/api/sale-campaigns${searchParams.toString() ? `?${searchParams.toString()}` : ""}`

    try {
        const result = await apiFetch<{
            campaigns: { items: SaleCampaign[]; totalCount: number }
        }>(endpoint)
        return {
            data: result.campaigns?.items || [],
            totalCount: result.campaigns?.totalCount || 0,
        }
    } catch {
        return { data: [], totalCount: 0 }
    }
}

async function saleCampaignGetBySlug(
    slug: string,
): Promise<SaleCampaignDetail | null> {
    try {
        const result = await apiFetch<
            SaleCampaignDetail | { campaign: SaleCampaignDetail }
        >(`/api/sale-campaigns/by-slug/${slug}`)
        return (result as any).campaign ?? (result as SaleCampaignDetail)
    } catch {
        return null
    }
}

async function saleCampaignGetById(
    id: string,
): Promise<SaleCampaignDetail | null> {
    try {
        const result = await apiFetch<
            SaleCampaignDetail | { campaign: SaleCampaignDetail }
        >(`/api/sale-campaigns/${id}`)
        return (result as any).campaign ?? (result as SaleCampaignDetail)
    } catch {
        return null
    }
}

async function saleCampaignCreate(params: {
    name: string
    description?: string
    bannerImageUrl?: string
    type: number
    startDate: string
    endDate: string
    isActive: boolean
    isFeatured: boolean
}): Promise<SaleCampaign | null> {
    const result = await apiFetch<SaleCampaign>(`/api/sale-campaigns`, {
        method: "POST",
        body: JSON.stringify(params),
    })
    return result
}

async function saleCampaignUpdate(
    id: string,
    params: {
        name?: string
        description?: string
        bannerImageUrl?: string
        type?: number
        startDate?: string
        endDate?: string
        isActive?: boolean
        isFeatured?: boolean
    },
): Promise<SaleCampaign | null> {
    const result = await apiFetch<SaleCampaign>(`/api/sale-campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify(params),
    })
    return result
}

async function saleCampaignDelete(id: string): Promise<boolean> {
    try {
        await apiFetch(`/api/sale-campaigns/${id}`, {
            method: "DELETE",
        })
        return true
    } catch {
        return false
    }
}

async function saleCampaignAddItem(
    campaignId: string,
    params: SaleCampaignItemPayload,
): Promise<boolean> {
    await apiFetch(`/api/sale-campaigns/${campaignId}/items`, {
        method: "POST",
        body: JSON.stringify(params),
    })
    return true
}

async function saleCampaignUpdateItem(
    itemId: string,
    params: Omit<SaleCampaignItemPayload, "productId" | "variantId">,
): Promise<boolean> {
    await apiFetch(`/api/sale-campaigns/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify(params),
    })
    return true
}

async function saleCampaignRemoveItem(itemId: string): Promise<boolean> {
    await apiFetch(`/api/sale-campaigns/items/${itemId}`, {
        method: "DELETE",
    })
    return true
}

async function saleItemsGet(params: {
    productIds?: string[]
    variantIds?: string[]
}): Promise<{ data: ActiveSaleItem[] }> {
    try {
        const searchParams = new URLSearchParams()
        if (params.productIds?.length)
            searchParams.set("productIds", params.productIds.join(","))
        if (params.variantIds?.length)
            searchParams.set("variantIds", params.variantIds.join(","))

        const endpoint = `/api/sale-campaigns/active-items${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
        const result = await apiFetch<{ items: ActiveSaleItem[] }>(endpoint)
        return { data: result.items || [] }
    } catch {
        return { data: [] }
    }
}

// ============ Store Info (stub - not needed for our backend) ============

// This was used by commerce-kit for YNS store info
// Our backend doesn't have this concept, so we return mock data
async function meGet(): Promise<{
    store: { subdomain: string; domain?: string }
    publicUrl: string
}> {
    return {
        store: { subdomain: "xuthi" },
        publicUrl: API_BASE_URL,
    }
}

// ============ Export API client ============

/**
 * XuThi API Client
 * Drop-in replacement for commerce-kit Commerce client
 */
export const api = {
    // Products
    productBrowse,
    productGet,

    // Categories (equivalent to commerce-kit collections)
    collectionBrowse: categoryBrowse, // Alias for compatibility
    collectionGet: categoryGet, // Alias for compatibility
    categoryBrowse,
    categoryGet,

    // Brands
    brandBrowse,
    brandGet,
    brandCreate,
    brandUpdate,
    brandDelete,

    // Variant Options
    variantOptionBrowse,
    variantOptionCreate,
    variantOptionUpdate,
    variantOptionDelete,

    // Cart
    cartGet,
    cartGetBySession,
    cartUpsert,
    cartRemoveItem,
    cartUpdateItem,
    cartClear,

    // Orders
    orderBrowse,
    orderGet,

    // Customers
    customerBrowse,
    customerGet,
    customerGetByExternal,
    addressCreate,
    addressUpdate,
    addressDelete,
    addressSetDefault,

    // Vouchers
    voucherBrowse,
    voucherGet,

    // Sale campaigns
    saleCampaignBrowse,
    saleCampaignGetBySlug,
    saleCampaignGetById,
    saleCampaignCreate,
    saleCampaignUpdate,
    saleCampaignDelete,
    saleCampaignAddItem,
    saleCampaignUpdateItem,
    saleCampaignRemoveItem,
    saleItemsGet,

    // Store info (stub)
    meGet,
}

// Default export for backward compatibility
export default api
