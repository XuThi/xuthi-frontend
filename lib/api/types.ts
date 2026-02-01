/**
 * XuThi Backend API Types
 * These types match the DTOs from the .NET backend
 */

// ============ Product Types ============
export interface ProductVariant {
	id: string;
	sku: string;
	name: string;
	price: number; // In cents/smallest currency unit
	compareAtPrice?: number;
	stockQuantity: number;
	images: string[];
	attributes: Record<string, string>;
}

export interface Product {
	id: string;
	name: string;
	slug: string;
	summary?: string;
	description?: string;
	images: string[];
	categoryId?: string;
	categoryName?: string;
	brandId?: string;
	brandName?: string;
	isActive: boolean;
	variants: ProductVariant[];
	createdAt: string;
	updatedAt?: string;
}

export interface ProductSearchResult {
	products: Product[];
	totalCount: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

// ============ Category Types (equivalent to YNS "Collections") ============
export interface Category {
	id: string;
	name: string;
	slug: string; // urlSlug from backend
	description?: string;
	parentCategoryId?: string;
	sortOrder: number;
	productCount: number;
	image?: string;
}

export interface CategoryWithProducts extends Category {
	products: Product[];
}

// ============ Cart Types ============
export interface CartItem {
	id: string;
	productId: string;
	productName: string;
	productSlug: string;
	productImage?: string;
	variantId: string;
	variantName: string;
	variantSku: string;
	price: number;
	quantity: number;
	subtotal: number;
}

export interface Cart {
	id: string;
	sessionId?: string;
	customerId?: string;
	items: CartItem[];
	subtotal: number;
	total: number;
	discountAmount?: number;
	appliedVoucherCode?: string;
}

// ============ Order Types ============
export interface OrderLineItem {
	productId: string;
	productName: string;
	productImage?: string;
	variantId: string;
	variantName: string;
	price: number;
	quantity: number;
	subtotal: number;
}

export interface ShippingAddress {
	fullName: string;
	addressLine1: string;
	addressLine2?: string;
	city: string;
	state?: string;
	postalCode: string;
	country: string;
	phone?: string;
}

export interface OrderCustomer {
	id?: string;
	email: string;
	name?: string;
}

export interface Order {
	id: string;
	orderNumber: string;
	status: string;
	customer?: OrderCustomer;
	shippingAddress?: ShippingAddress;
	lineItems: OrderLineItem[];
	subtotal: number;
	shippingCost: number;
	discountAmount: number;
	total: number;
	createdAt: string;
}

// ============ API Response wrapper ============
export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message?: string;
}
