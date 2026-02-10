"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useOptimistic, useState } from "react";
import type { Cart, CartItem } from "@/lib/api/types";

// Re-export types for components using old naming
export type CartLineItem = CartItem;
export type { Cart };

type CartAction =
	| { type: "INCREASE"; variantId: string }
	| { type: "DECREASE"; variantId: string }
	| { type: "REMOVE"; variantId: string }
	| { type: "ADD_ITEM"; item: CartItem }
	| { type: "CLEAR" };

type CartContextValue = {
	cart: Cart | null;
	items: CartItem[];
	itemCount: number;
	subtotal: bigint;
	isOpen: boolean;
	cartId: string | null;
	openCart: () => void;
	closeCart: () => void;
	clearCart: () => void;
	dispatch: (action: CartAction) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
	children: ReactNode;
	initialCart: Cart | null;
	initialCartId: string | null;
};

export function CartProvider({ children, initialCart, initialCartId }: CartProviderProps) {
	const [isOpen, setIsOpen] = useState(false);

	const [optimisticCart, dispatchCartAction] = useOptimistic(initialCart, (state, action: CartAction) => {
		if (!state) {
			// Handle ADD_ITEM when cart is null
			if (action.type === "ADD_ITEM") {
				return {
					id: "optimistic",
					items: [action.item],
					subtotal: action.item.totalPrice,
					total: action.item.totalPrice,
					voucherDiscount: 0,
					totalItems: action.item.quantity,
				} satisfies Cart;
			}
			return state;
		}

		switch (action.type) {
			case "INCREASE":
				return {
					...state,
					items: state.items.map((item) =>
						item.variantId === action.variantId 
							? { ...item, quantity: item.quantity + 1, totalPrice: item.unitPrice * (item.quantity + 1) } 
							: item,
					),
				};

			case "DECREASE":
				return {
					...state,
					items: state.items
						.map((item) => {
							if (item.variantId === action.variantId) {
								if (item.quantity - 1 <= 0) {
									return null;
								}
								return { ...item, quantity: item.quantity - 1, totalPrice: item.unitPrice * (item.quantity - 1) };
							}
							return item;
						})
						.filter((item): item is CartItem => item !== null),
				};

			case "REMOVE":
				return {
					...state,
					items: state.items.filter((item) => item.variantId !== action.variantId),
				};

			case "ADD_ITEM": {
				const existingItem = state.items.find(
					(item) => item.variantId === action.item.variantId,
				);

				if (existingItem) {
					return {
						...state,
						items: state.items.map((item) =>
							item.variantId === action.item.variantId
								? { 
									...item, 
									quantity: item.quantity + action.item.quantity,
									totalPrice: item.unitPrice * (item.quantity + action.item.quantity)
								}
								: item,
						),
					};
				}

				return {
					...state,
					items: [...state.items, action.item],
				};
			}

			case "CLEAR":
				return {
					...state,
					items: [],
					subtotal: 0,
					total: 0,
					totalItems: 0,
				};

			default:
				return state;
		}
	});

	const items = useMemo(() => optimisticCart?.items ?? [], [optimisticCart]);

	const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

	const subtotal = useMemo(
		() =>
			items.reduce((sum, item) => sum + BigInt(Math.round(item.unitPrice * 100)) * BigInt(item.quantity) / BigInt(100), BigInt(0)),
		[items],
	);

	const openCart = useCallback(() => setIsOpen(true), []);
	const closeCart = useCallback(() => setIsOpen(false), []);
	const clearCart = useCallback(() => dispatchCartAction({ type: "CLEAR" }), [dispatchCartAction]);

	// Derive cartId from optimistic cart or initial
	const currentCartId =
		optimisticCart?.id && optimisticCart.id !== "optimistic" ? optimisticCart.id : initialCartId;

	const value = useMemo(
		() => ({
			cart: optimisticCart,
			items,
			itemCount,
			subtotal,
			isOpen,
			cartId: currentCartId,
			openCart,
			closeCart,
			clearCart,
			dispatch: dispatchCartAction,
		}),
		[
			optimisticCart,
			items,
			itemCount,
			subtotal,
			isOpen,
			currentCartId,
			openCart,
			closeCart,
			clearCart,
			dispatchCartAction,
		],
	);

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error("useCart must be used within a CartProvider");
	}
	return context;
}
