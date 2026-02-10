import "@/app/globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { CartProvider } from "@/app/cart/cart-context";
import { CartSidebar } from "@/app/cart/cart-sidebar";
import { CartButton } from "@/app/cart-button";
import { Footer } from "@/app/footer";
import { Navbar } from "@/app/navbar";
import { AppLink } from "@/components/app-link";
import { commerce } from "@/lib/commerce";
import { getCartCookieJson, getSessionId } from "@/lib/cookies";
import { UserNav } from "@/components/user-nav";
import { Providers } from "@/app/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "XuThi Store",
	description: "XuThi e-commerce store",
};

async function getInitialCart() {
	const cartCookie = await getCartCookieJson();
	const sessionId = await getSessionId();

	// Support both cookie-stored CartId and current SessionId
	const cartId = cartCookie?.id;

	try {
		if (cartId) {
			const cart = await commerce.cartGet({ cartId });
			if (cart) return { cart, cartId };
		}
		
		if (sessionId) {
			const cart = await commerce.cartGetBySession({ sessionId });
			if (cart) return { cart, cartId: cart.id };
		}

		return { cart: null, cartId: cartId || null };
	} catch (error) {
		console.error("Failed to load initial cart", error);
		return { cart: null, cartId: cartId || null };
	}
}

async function CartProviderWrapper({ children }: { children: React.ReactNode }) {
	const { cart, cartId } = await getInitialCart();

	return (
		<CartProvider initialCart={cart} initialCartId={cartId}>
			<div className="flex min-h-screen flex-col">
				<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-16">
							<div className="flex items-center gap-8">
								<AppLink prefetch={"eager"} href="/" className="text-xl font-bold">
									XuThi Store
								</AppLink>
								<Navbar />
							</div>
							<div className="flex items-center gap-4">
								<CartButton />
								<UserNav />
							</div>
						</div>
					</div>
				</header>
				<div className="flex-1">{children}</div>
				<Footer />
			</div>
			<CartSidebar />
		</CartProvider>
	);
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Providers>
				    <Suspense>
					    <CartProviderWrapper>{children}</CartProviderWrapper>
				    </Suspense>
                </Providers>
			</body>
		</html>
	);
}
