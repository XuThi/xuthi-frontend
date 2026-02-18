"use server"

import { commerce } from "@/lib/commerce"
import type { Cart } from "@/lib/api/types"
import {
    getCartCookieJson,
    setCartCookie,
    getOrCreateSessionId,
    getSessionId,
    clearCartCookie,
} from "@/lib/cookies"

export async function getCart(): Promise<Cart | null> {
    const cartCookie = await getCartCookieJson()
    const sessionId = await getSessionId()

    // Try by sessionId first (our backend uses sessionId)
    if (sessionId) {
        try {
            const cart = await commerce.cartGetBySession({ sessionId })
            if (cart && cart.id) {
                // Make sure cookie is in sync
                if (!cartCookie || cartCookie.id !== cart.id) {
                    await setCartCookie({ id: cart.id })
                }
                return cart
            }
        } catch {
            // Fall through to cookie-based lookup
        }
    }

    // Fallback to cookie cartId
    if (!cartCookie?.id) {
        return null
    }

    try {
        return await commerce.cartGet({ cartId: cartCookie.id })
    } catch {
        return null
    }
}

export async function addToCart(variantId: string, quantity = 1) {
    // Get or create a persistent session ID
    const sessionId = await getOrCreateSessionId()

    const cart = await commerce.cartUpsert({
        sessionId,
        variantId,
        quantity,
    })

    if (!cart) {
        return { success: false, cart: null }
    }

    // Save cart ID in cookie for future lookups
    await setCartCookie({ id: cart.id })

    // Fetch full cart data to sync with client
    const fullCart = await commerce.cartGet({ cartId: cart.id })

    return { success: true, cart: fullCart }
}

export async function removeFromCart(variantId: string) {
    const cartCookie = await getCartCookieJson()

    if (!cartCookie?.id) {
        return { success: false, cart: null }
    }

    try {
        await commerce.cartRemoveItem({
            cartId: cartCookie.id,
            variantId,
        })

        // Fetch updated cart
        const cart = await commerce.cartGet({ cartId: cartCookie.id })
        return { success: true, cart }
    } catch {
        return { success: false, cart: null }
    }
}

// Set absolute quantity for a cart item
export async function setCartQuantity(variantId: string, quantity: number) {
    const cartCookie = await getCartCookieJson()

    if (!cartCookie?.id) {
        return { success: false, cart: null }
    }

    try {
        if (quantity <= 0) {
            // Remove item
            await commerce.cartRemoveItem({ cartId: cartCookie.id, variantId })
        } else {
            // Update quantity - use update endpoint
            await commerce.cartUpdateItem({
                cartId: cartCookie.id,
                variantId,
                quantity,
            })
        }

        // Fetch updated cart
        const cart = await commerce.cartGet({ cartId: cartCookie.id })
        return { success: true, cart }
    } catch {
        return { success: false, cart: null }
    }
}

export async function clearCartAction() {
    const cartCookie = await getCartCookieJson()

    if (cartCookie?.id) {
        try {
            await commerce.cartClear({ cartId: cartCookie.id })
        } catch {
            // Best-effort clear
        }
    }

    await clearCartCookie()
    return { success: true }
}
