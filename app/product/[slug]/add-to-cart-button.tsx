"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { addToCart } from "@/app/cart/actions"
import { useCart } from "@/app/cart/cart-context"
import { QuantitySelector } from "@/app/product/[slug]/quantity-selector"
import { TrustBadges } from "@/app/product/[slug]/trust-badges"
import {
    VariantSelector,
    type Variant,
} from "@/app/product/[slug]/variant-selector"
import { useCurrency } from "@/lib/currency-provider"
import { cartT } from "@/lib/i18n/translations"

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
    optionNames?: Record<string, string>
}

export function AddToCartButton({
    variants,
    product,
    salePricing,
    optionNames,
}: AddToCartButtonProps) {
    const [quantity, setQuantity] = useState(1)
    const [isPending, startTransition] = useTransition()
    const { openCart, dispatch, items } = useCart()
    const { formatFromVnd } = useCurrency()

    // Manage selected variant with client-side state (not URL params)
    const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
        () => {
            // Auto-select first in-stock variant if available
            const firstInStock = variants.find(
                (variant) => variant.stockQuantity > 0,
            )
            return (
                firstInStock ?? (variants.length >= 1 ? variants[0] : undefined)
            )
        },
    )

    // Calculate effective max: stock minus what's already in cart for this variant
    const existingCartQty = selectedVariant
        ? (items.find((item) => item.variantId === selectedVariant.id)
              ?.quantity ?? 0)
        : 0
    const effectiveMax = Math.max(
        0,
        (selectedVariant?.stockQuantity ?? 0) - existingCartQty,
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
              .map(([key, value]) => `${optionNames?.[key] ?? key}: ${value}`)
              .join(", ")
        : selectedVariant?.name

    const buttonText = useMemo(() => {
        if (isPending) return cartT.adding
        if (!selectedVariant) return cartT.selectOptions
        if (selectedVariant.stockQuantity <= 0) return "Hết hàng"
        if (effectiveMax <= 0) return "Đã đạt giới hạn tồn kho"
        if (totalPrice) {
            return `${cartT.addToCart} — ${formatFromVnd(totalPrice)}`
        }
        return cartT.addToCart
    }, [effectiveMax, formatFromVnd, isPending, selectedVariant, totalPrice])

    const handleVariantChange = useCallback((variant: Variant | undefined) => {
        setSelectedVariant(variant)
        // Reset quantity to 1 when changing variant (new effective max may be different)
        setQuantity(1)
    }, [])

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()

            if (!selectedVariant) return

            // Open cart sidebar instantly to improve perceived responsiveness.
            openCart()

            // Execute server action with optimistic update.
            startTransition(async () => {
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
                        availableStock: selectedVariant.stockQuantity,
                        isInStock: selectedVariant.stockQuantity > 0,
                        isOnSale: !!activeSale,
                    },
                })

                await addToCart(selectedVariant.id, quantity)
                setQuantity(1)
            })
        },
        [
            activeSale,
            dispatch,
            openCart,
            product.id,
            product.images,
            product.name,
            quantity,
            selectedVariant,
            startTransition,
            variantDescription,
        ],
    )

    return (
        <div className="space-y-8">
            {variants.length > 1 && (
                <VariantSelector
                    variants={variants}
                    selectedVariant={selectedVariant}
                    onVariantChange={handleVariantChange}
                    salePricing={salePricing}
                    optionNames={optionNames}
                />
            )}

            <QuantitySelector
                quantity={quantity}
                onQuantityChange={setQuantity}
                max={effectiveMax}
                disabled={isPending}
            />

            <form onSubmit={handleSubmit}>
                <button
                    type="submit"
                    disabled={
                        isPending ||
                        !selectedVariant ||
                        selectedVariant.stockQuantity <= 0 ||
                        effectiveMax <= 0
                    }
                    className="h-14 w-full rounded-md bg-primary px-8 py-4 text-base font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {buttonText}
                </button>
            </form>

            <TrustBadges />
        </div>
    )
}
