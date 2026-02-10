import { CheckCircle } from "lucide-react";
import { cacheLife } from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppLink } from "@/components/app-link";
import { commerce } from "@/lib/commerce";
import type { OrderLineItem } from "@/lib/api/types";
import { CURRENCY, LOCALE } from "@/lib/constants";
import { formatMoney } from "@/lib/money";

export default async function OrderSuccessPage(props: { params: Promise<{ id: string }> }) {
	"use cache";
	cacheLife("seconds");

	return <OrderDetails params={props.params} />;
}

const OrderDetails = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;
	const order = await commerce.orderGet({ id });

	if (!order) {
		notFound();
	}

	// Map to our API structure
	const lineItems = order.items;
    
    // Construct simplified objects for display
	const shippingAddressObj = {
        fullName: order.customerName,
        addressLine1: order.shippingAddress,
        addressLine2: `${order.shippingWard}, ${order.shippingDistrict}`,
        city: order.shippingCity,
        state: "", // Not used
        postalCode: "",
        country: "Vietnam",
        phone: order.customerPhone
    };
    
	const customerObj = {
        email: order.customerEmail,
        name: order.customerName
    };

	const subtotal = BigInt(Math.round(order.subtotal));
	const shippingCost = BigInt(Math.round(order.shippingFee));
	const total = BigInt(Math.round(order.total));

	return (
		<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			{/* Success Header */}
			<div className="text-center mb-10">
				<div className="flex justify-center mb-4">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
						<CheckCircle className="h-8 w-8 text-green-600" />
					</div>
				</div>
				<h1 className="text-3xl font-semibold tracking-tight">Cảm ơn bạn đã đặt hàng!</h1>
				<p className="text-muted-foreground mt-2">Đơn hàng #{order.orderNumber} đã được xác nhận</p>
				{customerObj.email && (
					<p className="text-sm text-muted-foreground mt-1">
						Một email xác nhận sẽ được gửi đến {customerObj.email}
					</p>
				)}
			</div>

			{/* Order Items */}
			<div className="border border-border rounded-lg overflow-hidden">
				<div className="bg-secondary/50 px-6 py-4 border-b border-border">
					<h2 className="font-medium">Sản phẩm</h2>
				</div>
				<div className="divide-y divide-border">
					{lineItems.map((item) => (
						<OrderItemComponent key={item.id} item={item} />
					))}
				</div>

				{/* Order Summary */}
				<div className="bg-secondary/30 px-6 py-4 space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Tạm tính</span>
						<span>{formatMoney({ amount: subtotal, currency: CURRENCY, locale: LOCALE })}</span>
					</div>
					{shippingCost > 0 && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Phí vận chuyển</span>
							<span>{formatMoney({ amount: shippingCost, currency: CURRENCY, locale: LOCALE })}</span>
						</div>
					)}
					{order.discountAmount > 0 && (
						<div className="flex items-center justify-between text-sm text-green-600">
							<span>Giảm giá</span>
							<span>-{formatMoney({ amount: BigInt(Math.round(order.discountAmount)), currency: CURRENCY, locale: LOCALE })}</span>
						</div>
					)}
					<div className="flex items-center justify-between font-semibold pt-2 border-t border-border">
						<span>Tổng cộng</span>
						<span>{formatMoney({ amount: total, currency: CURRENCY, locale: LOCALE })}</span>
					</div>
				</div>
			</div>

			{/* Shipping Address */}
			<div className="border border-border rounded-lg overflow-hidden mt-6">
				<div className="bg-secondary/50 px-6 py-4 border-b border-border">
					<h2 className="font-medium">Địa chỉ giao hàng</h2>
				</div>
				<div className="px-6 py-4 text-sm text-muted-foreground">
					<p className="text-foreground font-medium">{shippingAddressObj.fullName}</p>
					<p>{shippingAddressObj.addressLine1}</p>
					<p>{shippingAddressObj.addressLine2}</p>
					<p>{shippingAddressObj.city}</p>
					<p>{shippingAddressObj.country}</p>
					{shippingAddressObj.phone && <p>SĐT: {shippingAddressObj.phone}</p>}
				</div>
			</div>

			{/* Continue Shopping Button */}
			<div className="mt-8 text-center">
				<Button asChild>
					<AppLink prefetch="eager" href="/">
						Tiếp tục mua sắm
					</AppLink>
				</Button>
			</div>
		</div>
	);
};

function OrderItemComponent({ item }: { item: OrderLineItem }) {
	// Map fields from OrderLineItem
    const productName = item.productName;
    const productImage = item.imageUrl;
    const variantName = item.variantDescription || item.variantSku;
    const quantity = item.quantity;
    const subtotal = BigInt(Math.round(item.totalPrice));

	return (
		<div className="flex gap-4 p-6">
			{/* Product Image */}
			<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
				{productImage && <Image src={productImage} alt={productName} fill className="object-cover" sizes="80px" />}
			</div>

			{/* Product Details */}
			<div className="flex min-w-0 flex-1 flex-col justify-between">
				<div>
					<p className="text-sm font-medium leading-tight text-foreground line-clamp-2">
						{productName}
					</p>
					{variantName && <p className="text-xs text-muted-foreground">{variantName}</p>}
					<p className="text-sm text-muted-foreground mt-1">SL: {quantity}</p>
				</div>
				<p className="text-sm font-semibold">
					{formatMoney({ amount: subtotal, currency: CURRENCY, locale: LOCALE })}
				</p>
			</div>
		</div>
	);
}
