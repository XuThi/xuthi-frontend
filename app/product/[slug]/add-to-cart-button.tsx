"use client"

import { useMemo, useState, useTransition } from "react"
import { addToCart } from "@/app/cart/actions"
import { useCart } from "@/app/cart/cart-context"
import { QuantitySelector } from "@/app/product/[slug]/quantity-selector"
import { TrustBadges } from "@/app/product/[slug]/trust-badges"
import {
    VariantSelector,
    type Variant,
} from "@/app/product/[slug]/variant-selector"
import { CURRENCY, LOCALE } from "@/lib/constants"
import { cartT } from "@/lib/i18n/translations"
import { formatMoney } from "@/lib/money"

type AddToCartButtonProps = {
    variants: Variant[]
    product: {
        id: string
        name: string
        slug: string
        images: string[]
    }
    salePricing?: {
        byVariantId: Record<
            string,
            { salePrice: number; originalPrice?: number | null }
        >
        productFallback: {
            salePrice: number
            originalPrice?: number | null
        } | null
    }
}

export function AddToCartButton({
    variants,
    product,
    salePricing,
}: AddToCartButtonProps) {
    const [quantity, setQuantity] = useState(1)
    const [isPending, startTransition] = useTransition()
    const { openCart, dispatch } = useCart()

    // Manage selected variant with client-side state (not URL params)
    const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
        () => {
            // Auto-select first variant
            return variants.length >= 1 ? variants[0] : undefined
        },
    )

    const saleMatch = selectedVariant?.id
        ? salePricing?.byVariantId[selectedVariant.id]
        : undefined
    const activeSale = saleMatch ?? salePricing?.productFallback ?? null
    const unitPrice = activeSale?.salePrice ?? selectedVariant?.price ?? null
    const totalPrice = unitPrice
        ? BigInt(Math.round(unitPrice)) * BigInt(quantity)
        : null
    const variantDescription = selectedVariant?.attributes
        ? Object.entries(selectedVariant.attributes)
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ")
        : selectedVariant?.name

    const buttonText = useMemo(() => {
        if (isPending) return cartT.adding
        if (!selectedVariant) return cartT.selectOptions
        if (totalPrice) {
            return `${cartT.addToCart} — ${formatMoney({ amount: totalPrice, currency: CURRENCY, locale: LOCALE })}`
        }
        return cartT.addToCart
    }, [isPending, selectedVariant, totalPrice])

    const handleVariantChange = (variant: Variant | undefined) => {
        setSelectedVariant(variant)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedVariant) return

        // Open cart sidebar
        openCart()

        // Execute server action with optimistic update
        startTransition(async () => {
            // Dispatch inside transition for optimistic update
            // Using field names that match backend CartItemDto
            dispatch({
                type: "ADD_ITEM",
                item: {
                    id: `${product.id}-${selectedVariant.id}`,
                    productId: product.id,
                    productName: product.name,
                    variantId: selectedVariant.id,
                    variantSku: selectedVariant.sku,
                    variantDescription: variantDescription,
                    imageUrl: product.images[0] || selectedVariant.images[0],
                    unitPrice: activeSale?.salePrice ?? selectedVariant.price,
                    compareAtPrice: activeSale?.originalPrice ?? undefined,
                    quantity,
                    totalPrice:
                        (activeSale?.salePrice ?? selectedVariant.price) *
                        quantity,
                    addedAt: new Date().toISOString(),
                    availableStock: 10,
                    isInStock: true,
                    isOnSale: !!activeSale,
                },
            })

            await addToCart(selectedVariant.id, quantity)
            // Reset quantity after add
            setQuantity(1)
        })
    }

    return (
        <div className="space-y-8">
            {variants.length > 1 && (
                <VariantSelector
                    variants={variants}
                    selectedVariant={selectedVariant}
                    onVariantChange={handleVariantChange}
                />
            )}

            <QuantitySelector
                quantity={quantity}
                onQuantityChange={setQuantity}
                disabled={isPending}
            />

            <form onSubmit={handleSubmit}>
                <button
                    type="submit"
                    disabled={isPending || !selectedVariant}
                    className="w-full h-14 bg-foreground text-primary-foreground py-4 px-8 rounded-full text-base font-medium tracking-wide hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {buttonText}
                </button>
            </form>

            <TrustBadges />
        </div>
    )
}
