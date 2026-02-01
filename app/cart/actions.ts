"use server";

import { commerce } from "@/lib/commerce";
import type { Cart } from "@/lib/api/types";
import { getCartCookieJson, setCartCookie } from "@/lib/cookies";

export async function getCart(): Promise<Cart | null> {
	const cartCookie = await getCartCookieJson();

	if (!cartCookie?.id) {
		return null;
	}

	try {
		return await commerce.cartGet({ cartId: cartCookie.id });
	} catch {
		return null;
	}
}

export async function addToCart(variantId: string, quantity = 1) {
	const cartCookie = await getCartCookieJson();

	const cart = await commerce.cartUpsert({
		cartId: cartCookie?.id,
		variantId,
		quantity,
	});

	if (!cart) {
		return { success: false, cart: null };
	}

	await setCartCookie({ id: cart.id });

	// Fetch full cart data to sync with client
	const fullCart = await commerce.cartGet({ cartId: cart.id });

	return { success: true, cart: fullCart };
}

export async function removeFromCart(variantId: string) {
	const cartCookie = await getCartCookieJson();

	if (!cartCookie?.id) {
		return { success: false, cart: null };
	}

	try {
		// Set quantity to 0 to remove the item
		await commerce.cartUpsert({
			cartId: cartCookie.id,
			variantId,
			quantity: 0,
		});

		// Fetch updated cart
		const cart = await commerce.cartGet({ cartId: cartCookie.id });
		return { success: true, cart };
	} catch {
		return { success: false, cart: null };
	}
}

// Set absolute quantity for a cart item
// NOTE: Our backend cart API uses delta-based quantity updates
// This function calculates the delta internally
export async function setCartQuantity(variantId: string, quantity: number) {
	const cartCookie = await getCartCookieJson();

	if (!cartCookie?.id) {
		return { success: false, cart: null };
	}

	try {
		// Get current cart to calculate delta
		const currentCart = await commerce.cartGet({ cartId: cartCookie.id });
		// Find item by variantId (our API uses variantId, not productVariant.id)
		const currentItem = currentCart?.items.find((item) => item.variantId === variantId);
		const currentQuantity = currentItem?.quantity ?? 0;

		if (quantity <= 0) {
			// Remove item by setting quantity to 0
			await commerce.cartUpsert({ cartId: cartCookie.id, variantId, quantity: 0 });
		} else {
			// Calculate delta for cartUpsert
			const delta = quantity - currentQuantity;
			if (delta !== 0) {
				await commerce.cartUpsert({ cartId: cartCookie.id, variantId, quantity: delta });
			}
		}

		// Fetch updated cart
		const cart = await commerce.cartGet({ cartId: cartCookie.id });
		return { success: true, cart };
	} catch {
		return { success: false, cart: null };
	}
}
