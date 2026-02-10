import { cookies } from "next/headers";

export const CART_COOKIE = "yns_cart";
export const SESSION_COOKIE = "xuthi_session";
export type CartCookieJson = { id: string };

export async function setCartCookie(cartCookieJson: CartCookieJson) {
	try {
		(await cookies()).set(CART_COOKIE, JSON.stringify(cartCookieJson), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});
	} catch (error) {
		console.error("Failed to set cart cookie", error);
	}
}

export async function clearCartCookie(): Promise<void> {
	(await cookies()).set(CART_COOKIE, "", { maxAge: 0 });
}

export async function getCartCookieJson(): Promise<null | CartCookieJson> {
	const cartCookieJson_ = (await cookies()).get(CART_COOKIE)?.value;
	try {
		const cartCookieJson = cartCookieJson_ ? JSON.parse(cartCookieJson_) : null;
		if (
			!cartCookieJson ||
			typeof cartCookieJson !== "object" ||
			!("id" in cartCookieJson) ||
			typeof cartCookieJson.id !== "string"
		) {
			return null;
		}
		return cartCookieJson as CartCookieJson;
	} catch {
		return null;
	}
}

// Session ID for anonymous cart - persisted in cookie for server-side access
export async function getOrCreateSessionId(): Promise<string> {
	const cookieStore = await cookies();
	let sessionId = cookieStore.get(SESSION_COOKIE)?.value;
	
	if (!sessionId) {
		sessionId = crypto.randomUUID();
		cookieStore.set(SESSION_COOKIE, sessionId, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});
	}
	
	return sessionId;
}

export async function getSessionId(): Promise<string | null> {
	const cookieStore = await cookies();
	return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}
