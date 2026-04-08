"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/app/cart/cart-context";

export function CartButton() {
	const { itemCount, openCart } = useCart();

	return (
		<button
			type="button"
			onClick={openCart}
			className="p-2 hover:bg-nav-hover rounded-full transition-colors relative text-foreground"
			aria-label="Shopping cart"
		>
			<ShoppingCart className="w-6 h-6" />
			{itemCount > 0 ? (
				<span className="absolute -top-1 -right-1 bg-primary text-primary-foreground font-bold text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
					{itemCount}
				</span>
			) : null}
		</button>
	);
}
