import type { Metadata } from "next";
import "./globals.css";
import { Playfair_Display, Be_Vietnam_Pro } from "next/font/google";
import { Suspense } from "react";
import Image from "next/image";
import { cookies } from "next/headers";
import { CartProvider } from "@/app/cart/cart-context";
import { CartSidebar } from "@/app/cart/cart-sidebar";
import { CartButton } from "@/app/cart-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/app/footer";
import { Navbar } from "@/app/navbar";
import { HeaderWrapper, FooterWrapper } from "@/components/layout-wrapper";
import { AppLink } from "@/components/app-link";
import { commerce } from "@/lib/commerce";
import { getCartCookieJson, getSessionId } from "@/lib/cookies";
import { UserNav } from "@/components/user-nav";
import { Providers } from "@/app/providers";
import { CartErrorBoundary } from "@/app/cart/cart-error-boundary";
import { CURRENCY_COOKIE_NAME, parseSupportedCurrency } from "@/lib/currency";
import { DeliveryReviewModal } from "@/components/delivery-review-modal";
import { ChatWidget } from "@/components/chat-widget";

const headingFont = Playfair_Display({
	variable: "--font-heading",
	subsets: ["latin", "vietnamese"],
	weight: ["400", "500", "600", "700"],
	display: "swap",
});

const bodyFont = Be_Vietnam_Pro({
	variable: "--font-body",
	subsets: ["latin", "vietnamese"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "XuThi Store",
	description: "XuThi e-commerce store",
	icons: {
		icon: "https://res.cloudinary.com/dxlhncwp0/image/upload/v1769941817/logo_qlelti.svg",
	},
};

const THEME_COOKIE_KEY = "xuthi_theme";
const DEFAULT_THEME = "monochrome";
const VALID_THEMES = new Set(["amber", "monochrome"]);

function normalizeTheme(theme: string | undefined) {
	return VALID_THEMES.has(theme || "") ? (theme as string) : DEFAULT_THEME;
}

function ThemeCookieScript({ theme }: { theme: string }) {
	return (
		<script
			dangerouslySetInnerHTML={{
				__html: `document.documentElement.setAttribute("data-theme", "${theme}")`,
			}}
		/>
	);
}

async function RequestThemeScript() {
	const cookieStore = await cookies();
	const cookieTheme = cookieStore.get(THEME_COOKIE_KEY)?.value;
	const theme = normalizeTheme(cookieTheme);
	return <ThemeCookieScript theme={theme} />;
}

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
				<HeaderWrapper>
					<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="flex items-center justify-between h-16">
								<div className="flex items-center gap-8">
									<AppLink prefetch={"eager"} href="/" className="flex items-center gap-2 text-xl font-bold">
									<Image
										src="https://res.cloudinary.com/dxlhncwp0/image/upload/v1769941817/logo_qlelti.svg"
										alt="XuThi"
										width={32}
										height={32}
										priority
									/>
									<span>XuThi Store</span>
								</AppLink>
									<Navbar />
								</div>
								<div className="flex items-center gap-4">
									<ThemeToggle />
									<CartButton />
									<UserNav />
								</div>
							</div>
						</div>
					</header>
				</HeaderWrapper>
				<div className="flex-1">{children}</div>
				<FooterWrapper>
					<Footer />
				</FooterWrapper>
			</div>
			<CartSidebar />
			<DeliveryReviewModal />
			<ChatWidget />
		</CartProvider>
	);
}
async function ProvidersWrapper({ children }: { children: React.ReactNode }) {
	const cookieStore = await cookies();
	const initialCurrency = parseSupportedCurrency(
		cookieStore.get(CURRENCY_COOKIE_NAME)?.value,
	);

	return (
		<Providers initialCurrency={initialCurrency}>
			<CartErrorBoundary>
				<Suspense>
					<CartProviderWrapper>{children}</CartProviderWrapper>
				</Suspense>
			</CartErrorBoundary>
		</Providers>
	);
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="vi" data-theme={DEFAULT_THEME} suppressHydrationWarning>
			<body className={`${headingFont.variable} ${bodyFont.variable} font-sans antialiased`}>
                <Suspense fallback={null}>
					<RequestThemeScript />
				</Suspense>
                <Suspense fallback={null}>
				    <ProvidersWrapper>{children}</ProvidersWrapper>
                </Suspense>
			</body>
		</html>
	);
}
