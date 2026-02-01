/**
 * XuThi Backend API Client
 * Replaces the commerce-kit client with direct calls to our backend API
 */

import type {
	Cart,
	CartItem,
	Category,
	CategoryWithProducts,
	Order,
	Product,
	ProductSearchResult,
} from "./types";

// Get the API base URL from environment
const getApiBaseUrl = () => {
	// In development with Aspire, this will be set by the service discovery
	// Service name is "apiservice" so env vars are services__apiservice__*
	const apiUrl = process.env["services__apiservice__https__0"] || process.env["services__apiservice__http__0"];
	if (apiUrl) return apiUrl;

	// Fallback for local development
	return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const url = `${API_BASE_URL}${endpoint}`;

	try {
		const response = await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			// Add timeout to prevent hanging
			signal: AbortSignal.timeout(10000),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`API Error ${response.status}: ${errorText}`);
			throw new Error(`API Error ${response.status}: ${errorText}`);
		}

		// Handle empty responses
		const text = await response.text();
		if (!text) return {} as T;

		return JSON.parse(text) as T;
	} catch (error) {
		// Log but don't crash - return empty data for SSR resilience
		console.error(`API fetch failed for ${endpoint}:`, error);
		throw error;
	}
}

// ============ Products API ============

export interface ProductBrowseParams {
	active?: boolean;
	limit?: number;
	page?: number;
	categoryId?: string;
	brandId?: string;
	searchTerm?: string;
	minPrice?: number;
	maxPrice?: number;
	sortBy?: "name" | "price" | "createdAt";
	sortDirection?: "asc" | "desc";
}

async function productBrowse(params: ProductBrowseParams = {}): Promise<{
	data: Product[];
	totalCount: number;
}> {
	const searchParams = new URLSearchParams();

	if (params.active !== undefined) searchParams.set("isActive", String(params.active));
	if (params.limit) searchParams.set("pageSize", String(params.limit));
	if (params.page) searchParams.set("page", String(params.page));
	if (params.categoryId) searchParams.set("categoryId", params.categoryId);
	if (params.brandId) searchParams.set("brandId", params.brandId);
	if (params.searchTerm) searchParams.set("searchTerm", params.searchTerm);
	if (params.minPrice) searchParams.set("minPrice", String(params.minPrice));
	if (params.maxPrice) searchParams.set("maxPrice", String(params.maxPrice));
	if (params.sortBy) searchParams.set("sortBy", params.sortBy);
	if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);

	const queryString = searchParams.toString();
	const endpoint = `/api/products${queryString ? `?${queryString}` : ""}`;

	try {
		const result = await apiFetch<ProductSearchResult>(endpoint);
		return {
			data: result.products || [],
			totalCount: result.totalCount || 0,
		};
	} catch {
		// Return empty data on error so the page still renders
		return { data: [], totalCount: 0 };
	}
}

async function productGet(params: { idOrSlug: string }): Promise<Product | null> {
	try {
		// Try by slug first (more common for SEO-friendly URLs)
		const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			params.idOrSlug,
		);

		const endpoint = isGuid
			? `/api/products/${params.idOrSlug}`
			: `/api/products/by-slug/${params.idOrSlug}`;

		return await apiFetch<Product>(endpoint);
	} catch {
		return null;
	}
}

// ============ Categories API (replaces "Collections") ============

// Backend response type (different from frontend type)
interface BackendCategory {
	id: string;
	name: string;
	urlSlug: string; // Backend uses urlSlug
	description?: string;
	parentCategoryId?: string;
	sortOrder: number;
	productCount: number;
}

async function categoryBrowse(params: { limit?: number; parentId?: string } = {}): Promise<{
	data: Category[];
}> {
	const searchParams = new URLSearchParams();
	if (params.parentId) searchParams.set("parentId", params.parentId);

	const queryString = searchParams.toString();
	const endpoint = `/api/categories${queryString ? `?${queryString}` : ""}`;

	try {
		const result = await apiFetch<{ categories: BackendCategory[] }>(endpoint);
		let categories = (result.categories || []).map((c) => ({
			id: c.id,
			name: c.name,
			slug: c.urlSlug, // Map urlSlug to slug
			description: c.description,
			parentCategoryId: c.parentCategoryId,
			sortOrder: c.sortOrder,
			productCount: c.productCount,
		}));

		// Apply limit if specified
		if (params.limit && categories.length > params.limit) {
			categories = categories.slice(0, params.limit);
		}

		return { data: categories };
	} catch {
		// Return empty array if categories endpoint fails (backend might not be ready)
		return { data: [] };
	}
}

async function categoryGet(params: { idOrSlug: string }): Promise<CategoryWithProducts | null> {
	try {
		// First get all categories to find by slug
		const { data: categories } = await categoryBrowse({});
		const category = categories.find(
			(c) => c.id === params.idOrSlug || c.slug === params.idOrSlug,
		);

		if (!category) return null;

		// Get products in this category
		const { data: products } = await productBrowse({
			categoryId: category.id,
			active: true,
		});

		return {
			...category,
			products,
		};
	} catch {
		return null;
	}
}

// ============ Cart API ============

let currentSessionId: string | null = null;

function getSessionId(): string {
	if (typeof window !== "undefined") {
		currentSessionId = localStorage.getItem("xuthi_session_id");
		if (!currentSessionId) {
			currentSessionId = crypto.randomUUID();
			localStorage.setItem("xuthi_session_id", currentSessionId);
		}
	} else if (!currentSessionId) {
		currentSessionId = crypto.randomUUID();
	}
	return currentSessionId;
}

async function cartGet(params: { cartId: string }): Promise<Cart | null> {
	try {
		// Our backend uses sessionId, not cartId for anonymous users
		const endpoint = `/api/cart?sessionId=${params.cartId}`;
		const result = await apiFetch<Cart>(endpoint);
		return result;
	} catch {
		return null;
	}
}

async function cartUpsert(params: {
	cartId?: string;
	variantId: string;
	quantity: number;
}): Promise<Cart | null> {
	try {
		const sessionId = params.cartId || getSessionId();

		if (params.quantity === 0) {
			// Remove item
			// Note: Our backend might need the cart ID, not just session ID
			// This is a simplification - you may need to adjust based on your actual cart structure
			const cart = await cartGet({ cartId: sessionId });
			if (cart?.id) {
				await apiFetch(`/api/cart/${cart.id}/items/${params.variantId}`, {
					method: "DELETE",
				});
				return await cartGet({ cartId: sessionId });
			}
			return null;
		}

		// Add or update item
		const result = await apiFetch<Cart>("/api/cart/items", {
			method: "POST",
			body: JSON.stringify({
				sessionId,
				productId: params.variantId, // May need adjustment based on your product/variant structure
				variantId: params.variantId,
				quantity: params.quantity,
			}),
		});

		return result;
	} catch {
		return null;
	}
}

// ============ Orders API ============

async function orderGet(params: { id: string }): Promise<Order | null> {
	try {
		// Check if it's a GUID or order number
		const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			params.id,
		);

		const endpoint = isGuid
			? `/api/orders/${params.id}`
			: `/api/orders/by-number/${params.id}`;

		return await apiFetch<Order>(endpoint);
	} catch {
		return null;
	}
}

// ============ Store Info (stub - not needed for our backend) ============

// This was used by commerce-kit for YNS store info
// Our backend doesn't have this concept, so we return mock data
async function meGet(): Promise<{
	store: { subdomain: string; domain?: string };
	publicUrl: string;
}> {
	return {
		store: { subdomain: "xuthi" },
		publicUrl: API_BASE_URL,
	};
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

	// Cart
	cartGet,
	cartUpsert,

	// Orders
	orderGet,

	// Store info (stub)
	meGet,
};

// Default export for backward compatibility
export default api;
