"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeFromCart, setCartQuantity } from "@/app/cart/actions";
import { type CartLineItem, useCart } from "@/app/cart/cart-context";
import { AppLink } from "@/components/app-link";
import { CURRENCY, LOCALE } from "@/lib/constants";
import { formatMoney } from "@/lib/money";

type CartItemProps = {
	item: CartLineItem;
};

export function CartItem({ item }: CartItemProps) {
	const router = useRouter();
	const { dispatch, closeCart } = useCart();
	const [, startTransition] = useTransition();

	// Use our API structure (CartItem from types.ts)
	const { variantId, productName, productSlug, productImage, variantName, price, quantity } = item;

	const lineTotal = BigInt(price) * BigInt(quantity);

	const handleRemove = () => {
		startTransition(async () => {
			dispatch({ type: "REMOVE", variantId });
			await removeFromCart(variantId);
			router.refresh();
		});
	};

	const handleIncrement = () => {
		startTransition(async () => {
			dispatch({ type: "INCREASE", variantId });
			await setCartQuantity(variantId, quantity + 1);
			router.refresh();
		});
	};

	const handleDecrement = () => {
		if (quantity <= 1) {
			handleRemove();
			return;
		}
		startTransition(async () => {
			dispatch({ type: "DECREASE", variantId });
			await setCartQuantity(variantId, quantity - 1);
			router.refresh();
		});
	};

	return (
		<div className="flex gap-3 py-4">
			{/* Product Image */}
			<AppLink
				prefetch={"eager"}
				href={`/product/${productSlug}`}
				onClick={closeCart}
				className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary"
			>
				{productImage && <Image src={productImage} alt={productName} fill className="object-cover" sizes="96px" />}
			</AppLink>

			{/* Product Details */}
			<div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
				<div className="flex items-start justify-between gap-2">
					<div>
						<AppLink
							prefetch={"eager"}
							href={`/product/${productSlug}`}
							onClick={closeCart}
							className="text-sm font-medium leading-tight text-foreground hover:underline line-clamp-2"
						>
							{productName}
						</AppLink>
						{variantName && (
							<p className="text-xs text-muted-foreground mt-0.5">{variantName}</p>
						)}
					</div>
					<button
						type="button"
						onClick={handleRemove}
						className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>

				<div className="flex items-center justify-between">
					{/* Quantity Controls */}
					<div className="inline-flex items-center rounded-full border border-border">
						<button
							type="button"
							onClick={handleDecrement}
							className="shrink-0 flex h-7 w-7 items-center justify-center rounded-l-full hover:bg-secondary transition-colors"
						>
							<Minus className="h-3 w-3" />
						</button>
						<span className="flex h-7 w-8 items-center justify-center text-sm tabular-nums">{quantity}</span>
						<button
							type="button"
							onClick={handleIncrement}
							className="shrink-0 flex h-7 w-7 items-center justify-center rounded-r-full hover:bg-secondary transition-colors"
						>
							<Plus className="h-3 w-3" />
						</button>
					</div>

					{/* Price */}
					<span className="text-sm font-semibold">
						{formatMoney({ amount: lineTotal, currency: CURRENCY, locale: LOCALE })}
					</span>
				</div>
			</div>
		</div>
	);
}
