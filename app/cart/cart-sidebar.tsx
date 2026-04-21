"use client"

import { ShoppingBag } from "lucide-react"
import { useCart } from "@/app/cart/cart-context"
import { CartItem } from "@/app/cart/cart-item"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { AppLink } from "@/components/app-link"
import { useCurrency } from "@/lib/currency-provider"
import { cartT } from "@/lib/i18n/translations"

export function CartSidebar() {
    const { isOpen, closeCart, items, itemCount, subtotal } = useCart()
    const { formatFromVnd } = useCurrency()

    const checkoutUrl = `/checkout`

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
            <SheetContent className="flex flex-col w-full sm:max-w-lg">
                <SheetHeader className="border-b border-border pb-4">
                    <SheetTitle className="flex items-center gap-2">
                        {cartT.yourCart}
                        {itemCount > 0 && (
                            <span className="text-sm font-normal text-muted-foreground">
                                ({itemCount} {cartT.items})
                            </span>
                        )}
                    </SheetTitle>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-nav-hover">
                            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium">{cartT.empty}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {cartT.emptyDescription}
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={closeCart}
                            className="bg-nav-hover text-foreground hover:brightness-95"
                        >
                            {cartT.continueShopping}
                        </Button>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 px-4">
                            <div className="divide-y divide-border">
                                {items.map((item) => (
                                    <CartItem
                                        key={item.variantId}
                                        item={item}
                                    />
                                ))}
                            </div>
                        </ScrollArea>

                        <SheetFooter className="border-t border-border pt-4 mt-auto">
                            <div className="w-full space-y-4">
                                <div className="flex items-center justify-between text-base">
                                    <span className="font-medium">
                                        {cartT.subtotal}
                                    </span>
                                    <span className="font-semibold">
                                        {formatFromVnd(subtotal)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {cartT.shippingNote}
                                </p>
                                <Button
                                    asChild
                                    className="w-full h-12 text-base font-medium"
                                >
                                    <AppLink
                                        prefetch={false}
                                        href={checkoutUrl}
                                        onClick={closeCart}
                                    >
                                        {cartT.checkout}
                                    </AppLink>
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full h-10 text-sm bg-nav-hover text-foreground hover:brightness-95"
                                    onClick={closeCart}
                                >
                                    {cartT.continueShopping}
                                </Button>
                            </div>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
