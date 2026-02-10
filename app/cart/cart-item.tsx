"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeFromCart, setCartQuantity } from "@/app/cart/actions";
import { type CartLineItem, useCart } from "@/app/cart/cart-context";
import { CURRENCY, LOCALE } from "@/lib/constants";
import { formatMoney } from "@/lib/money";

type CartItemProps = {
	item: CartLineItem;
};

export function CartItem({ item }: CartItemProps) {
	const router = useRouter();
	const { dispatch, closeCart } = useCart();
	const [, startTransition] = useTransition();

	// Using correct backend field names
	const { variantId, productId, productName, imageUrl, variantDescription, unitPrice, quantity } = item;

	const lineTotal = BigInt(Math.round(unitPrice * 100)) * BigInt(quantity) / BigInt(100);

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
			<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary">
				{imageUrl && <Image src={imageUrl} alt={productName} fill className="object-cover" sizes="96px" />}
			</div>

			{/* Product Details */}
			<div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
				<div className="flex items-start justify-between gap-2">
					<div>
						<p className="text-sm font-medium leading-tight text-foreground line-clamp-2">
							{productName}
						</p>
						{variantDescription && (
							<p className="text-xs text-muted-foreground mt-0.5">{variantDescription}</p>
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
