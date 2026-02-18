/**
 * XuThi Backend API Types
 * These types match the DTOs from the .NET backend exactly
 */

// ============ Product Types ============
export interface ProductVariant {
    id: string
    sku: string
    name: string
    price: number // In cents/smallest currency unit
    compareAtPrice?: number
    stockQuantity: number
    images: string[]
    attributes: Record<string, string>
}

export interface Product {
    id: string
    name: string
    slug: string
    summary?: string
    description?: string
    images: string[]
    categoryId?: string
    categoryName?: string
    brandId?: string
    brandName?: string
    isActive: boolean
    variants: ProductVariant[]
    createdAt: string
    updatedAt?: string
}

export interface ProductSearchResult {
    products: Product[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
}

// ============ Category Types (equivalent to YNS "Collections") ============
export interface Category {
    id: string
    name: string
    slug: string // urlSlug from backend
    description?: string
    parentCategoryId?: string
    sortOrder: number
    productCount: number
    image?: string
}

export interface CategoryWithProducts extends Category {
    products: Product[]
}

// ============ Cart Types (matches backend CartDto exactly) ============

/**
 * Cart item from backend - matches CartItemDto
 */
export interface CartItem {
    id: string
    productId: string
    variantId: string
    productName: string
    variantSku: string
    variantDescription?: string
    imageUrl?: string
    unitPrice: number
    compareAtPrice?: number
    quantity: number
    totalPrice: number
    addedAt?: string
    availableStock: number
    isInStock: boolean
    isOnSale: boolean
}

/**
 * Cart from backend - matches CartDto
 */
export interface Cart {
    id: string
    sessionId?: string
    customerId?: string
    items: CartItem[]
    subtotal: number
    voucherDiscount: number
    appliedVoucherCode?: string
    total: number
    totalItems: number
}

// ============ Order Types ============
export interface OrderLineItem {
    id: string
    productId: string
    variantId: string
    productName: string
    variantSku: string
    variantDescription?: string
    imageUrl?: string
    unitPrice: number
    compareAtPrice?: number
    quantity: number
    totalPrice: number
}

export interface Order {
    id: string
    orderNumber: string
    customerName: string
    customerEmail: string
    customerPhone: string
    shippingAddress: string
    shippingCity: string
    shippingDistrict: string
    shippingWard: string
    shippingNote?: string
    subtotal: number
    discountAmount: number
    shippingFee: number
    total: number
    voucherCode?: string
    status: string
    paymentStatus: string
    paymentMethod: string
    createdAt: string
    paidAt?: string
    shippedAt?: string
    deliveredAt?: string
    cancelledAt?: string
    cancellationReason?: string
    items: OrderLineItem[]
}

// ============ Customer Types ============
export interface Customer {
    id: string
    fullName: string
    email: string
    phone?: string
    tier: string
    totalSpent: number
    totalOrders: number
    createdAt: string
}

export interface CustomerDetail extends Customer {
    externalUserId: string
    dateOfBirth?: string
    gender?: string
    loyaltyPoints: number
    tierDiscountPercentage: number
    addresses: Address[]
}

export interface Address {
    id: string
    label: string
    recipientName: string
    address: string
    ward: string
    district: string
    city: string
    phone: string
    note?: string
    isDefault: boolean
}

// ============ Voucher Types ============
export enum VoucherType {
    Percentage = 1,
    FixedAmount = 2,
    FreeShipping = 3,
}

export interface Voucher {
    id: string
    code: string
    description?: string
    type: VoucherType | string // Handle string from JSON
    discountValue: number
    minimumOrderAmount?: number
    maximumDiscountAmount?: number
    maxUsageCount?: number
    currentUsageCount: number
    maxUsagePerCustomer?: number
    startDate: string
    endDate: string
    applicableCategoryId?: string
    applicableProductIds?: string[]
    minimumCustomerTier?: string
    canCombineWithOtherVouchers: boolean
    canCombineWithSalePrice: boolean
    firstPurchaseOnly: boolean
    isActive: boolean
    isValid: boolean
}

// ============ Sale Campaign Types ============
export interface SaleCampaignItem {
    id: string
    productId: string
    variantId?: string | null
    salePrice: number
    originalPrice?: number | null
    discountPercentage?: number | null
    maxQuantity?: number | null
    soldQuantity: number
    hasStock: boolean
}

export interface SaleCampaign {
    id: string
    name: string
    slug?: string | null
    description?: string | null
    bannerImageUrl?: string | null
    type: number | string
    startDate: string
    endDate: string
    isActive: boolean
    isFeatured: boolean
    isRunning: boolean
    isUpcoming: boolean
    itemCount: number
}

export interface SaleCampaignDetail extends Omit<SaleCampaign, "itemCount"> {
    items: SaleCampaignItem[]
}

export interface ActiveSaleItem {
    id: string
    campaignId: string
    campaignName: string
    productId: string
    variantId?: string | null
    salePrice: number
    originalPrice?: number | null
    discountPercentage?: number | null
}

// ============ API Response wrapper ============
export interface ApiResponse<T> {
    data: T
    success: boolean
    message?: string
}
// ============ Brand Types ============
export interface Brand {
    id: string
    name: string
    urlSlug: string
    description?: string
    isActive: boolean
    logoUrl?: string
}

// ============ Variant Option Types ============
export interface VariantOption {
    id: string // "size", "color"
    name: string // "Size", "Color"
    displayType: string
    values: string[]
}
