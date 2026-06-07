"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useCart } from "@/app/cart/cart-context"
import { clearCartAction } from "@/app/cart/actions"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
    CreditCard,
    Truck,
    MapPin,
    ShoppingBag,
    ArrowLeft,
    CheckCircle,
    Tag,
    Loader2,
    X,
    Bell,
} from "lucide-react"
import Link from "next/link"
import { api, type ShippingSettings } from "@/lib/api/client"
import type { Address } from "@/lib/api/types"
import { useCurrency } from "@/lib/currency-provider"

const API_URL = "/api/bff"
// Using internal API to serve our local JSON data
const LOCATION_API = "/api/locations"

// Types for location data
interface Province {
    code: string
    name: string
    name_with_type: string
}

interface District {
    code: string
    name: string
    name_with_type: string
}


function normalizeLocationName(name: string) {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(
            /^(tinh|thanh pho|tp\.?|quan|huyen|thi xa|phuong|xa|thi tran)\s+/i,
            "",
        )
        .replace(/\s+/g, " ")
        .trim()
}

export default function CheckoutPage() {
    const { user, isAuthenticated, isLoading, token } = useAuth()
    const { cart, clearCart } = useCart()
    const { formatFromVnd } = useCurrency()
    const [mounted, setMounted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [orderComplete, setOrderComplete] = useState<{
        orderNumber: string
        total: number
    } | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Location data state
    const [provinces, setProvinces] = useState<Province[]>([])
    const [districts, setDistricts] = useState<District[]>([])
    const [loadingProvinces, setLoadingProvinces] = useState(false)
    const [loadingDistricts, setLoadingDistricts] = useState(false)
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
    const [selectedAddressId, setSelectedAddressId] = useState("")
    const [addressLoading, setAddressLoading] = useState(false)
    // useManualLocation removed - always use dropdowns
    const [customerProfileId, setCustomerProfileId] = useState<string | null>(
        null,
    )
    const [alreadySubscribed, setAlreadySubscribed] = useState(false)

    // Voucher state
    const [voucherCode, setVoucherCode] = useState("")
    const [voucherApplied, setVoucherApplied] = useState<{
        code: string
        discount: number
        message: string
    } | null>(null)
    const [voucherError, setVoucherError] = useState<string | null>(null)
    const [applyingVoucher, setApplyingVoucher] = useState(false)
    const [subscribeNewsletter, setSubscribeNewsletter] = useState(false)

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        address: "",
        city: "",
        cityName: "",
        district: "",
        districtName: "",
        ward: "",
        wardName: "",
        notes: "",
        paymentMethod: "cod",
    })

    const [shipping, setShipping] = useState(30000)
    const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null)
    const [isGhnUsed, setIsGhnUsed] = useState(false)

    useEffect(() => {
        api.orderGetShippingSettings()
            .then(res => {
                setShippingSettings(res)
                setShipping(res.enabled ? res.flatRate : 0)
            })
            .catch(err => {
                console.error("Failed to load shipping settings for checkout:", err)
            })
    }, [])

    useEffect(() => {
        if (!shippingSettings) return

        if (!shippingSettings.enabled) {
            setShipping(0)
            setIsGhnUsed(false)
            return
        }

        const calculateShipping = async () => {
            try {
                if (formData.paymentMethod !== "cod") {
                    setShipping(0)
                    setIsGhnUsed(false)
                    return
                }

                const useThreeLevel = !!shippingSettings.useThreeLevelAddress
                
                if (useThreeLevel) {
                    if (!formData.city || !formData.district || !formData.ward) {
                        setShipping(shippingSettings.nationalFallbackRate ?? 30000)
                        setIsGhnUsed(false)
                        return
                    }
                } else {
                    if (!formData.city || !formData.district) {
                        setShipping(shippingSettings.nationalFallbackRate ?? 30000)
                        setIsGhnUsed(false)
                        return
                    }
                }

                const methodParam = formData.paymentMethod === "cod" ? 1 : 3
                const requestBody = {
                    paymentMethod: methodParam,
                    shippingCity: formData.cityName || formData.city,
                    shippingWard: useThreeLevel 
                        ? (formData.wardName || formData.ward) 
                        : (formData.districtName || formData.district),
                    shippingDistrict: useThreeLevel 
                        ? (formData.districtName || formData.district) 
                        : undefined,
                    items: cart?.items.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity
                    })) || []
                }

                const res = await fetch(`${API_URL}/api/orders/calculate-shipping`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestBody)
                })

                if (res.ok) {
                    const data = await res.json()
                    setShipping(Number(data.shippingFee))
                    setIsGhnUsed(!!data.isGhnUsed)
                } else {
                    throw new Error("API returned non-OK status")
                }
            } catch (err) {
                console.error("Failed to calculate shipping via backend:", err)
                setIsGhnUsed(false)
                // Fallback to local configuration-driven rules
                if (formData.paymentMethod !== "cod") {
                    setShipping(0)
                } else {
                    const isHcm = (formData.cityName || "").toLowerCase().includes("ho chi minh") ||
                                  (formData.cityName || "").toLowerCase().includes("hồ chí minh") ||
                                  formData.city === "12" ||
                                  formData.city === "79"
                    const hcmRate = shippingSettings?.hcmFallbackRate ?? 18000
                    const nationalRate = shippingSettings?.nationalFallbackRate ?? 30000
                    setShipping(isHcm ? hcmRate : nationalRate)
                }
            }
        }

        calculateShipping()
    }, [formData.paymentMethod, formData.city, formData.cityName, formData.district, formData.districtName, formData.ward, formData.wardName, shippingSettings, cart?.items])

    const formatCurrency = (amount: number) => formatFromVnd(amount)

    const [wards, setWards] = useState<District[]>([])
    const [loadingWards, setLoadingWards] = useState(false)

    // Fetch provinces on mount (depends on shippingSettings)
    useEffect(() => {
        setMounted(true)
        if (!shippingSettings) return

        const fetchProvinces = async () => {
            setLoadingProvinces(true)
            try {
                const endpoint = shippingSettings.useThreeLevelAddress
                    ? `/api/locations/three-level/provinces`
                    : `${LOCATION_API}/provinces`
                const response = await fetch(endpoint)
                if (response.ok) {
                    const result = await response.json()
                    setProvinces(result.data || [])
                }
            } catch (err) {
                console.error("Failed to fetch provinces:", err)
            } finally {
                setLoadingProvinces(false)
            }
        }
        fetchProvinces()
    }, [shippingSettings])

    // Fetch level 2 locations (districts in 3-level, wards in 2-level) when province changes
    useEffect(() => {
        if (!formData.city || !shippingSettings) {
            setDistricts([])
            return
        }
        const fetchDistricts = async () => {
            setLoadingDistricts(true)
            setDistricts([])
            setFormData((prev) => ({
                ...prev,
                district: "",
                districtName: "",
                ward: "",
                wardName: "",
            }))
            try {
                const endpoint = shippingSettings.useThreeLevelAddress
                    ? `/api/locations/three-level/districts?provinceCode=${formData.city}`
                    : `${LOCATION_API}/wards?provinceCode=${formData.city}`
                const response = await fetch(endpoint)
                if (response.ok) {
                    const result = await response.json()
                    setDistricts(result.data || [])
                }
            } catch (err) {
                console.error("Failed to fetch districts:", err)
            } finally {
                setLoadingDistricts(false)
            }
        }
        fetchDistricts()
    }, [formData.city, shippingSettings])

    // Fetch level 3 locations (wards in 3-level) when district changes
    useEffect(() => {
        if (!shippingSettings?.useThreeLevelAddress || !formData.city || !formData.district) {
            setWards([])
            return
        }
        const fetchWards = async () => {
            setLoadingWards(true)
            setWards([])
            setFormData((prev) => ({
                ...prev,
                ward: "",
                wardName: "",
            }))
            try {
                const response = await fetch(
                    `/api/locations/three-level/wards?provinceCode=${formData.city}&districtCode=${formData.district}`
                )
                if (response.ok) {
                    const result = await response.json()
                    setWards(result.data || [])
                }
            } catch (err) {
                console.error("Failed to fetch wards:", err)
            } finally {
                setLoadingWards(false)
            }
        }
        fetchWards()
    }, [formData.city, formData.district, shippingSettings])

    // Error message is now handled by the auth guards below, not via a stale useEffect

    // Pre-fill name from user
    useEffect(() => {
        if (user) {
            setFormData((prev) => ({
                ...prev,
                fullName:
                    user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : prev.fullName,
            }))
        }
    }, [user])

    const applyAddress = (addr: Address) => {
        setSelectedAddressId(addr.id)
        const isThreeLevel = !!shippingSettings?.useThreeLevelAddress

        let districtName = ""
        let wardName = addr.ward || ""

        if (isThreeLevel && addr.ward?.includes(",")) {
            const parts = addr.ward.split(",")
            if (parts.length >= 2) {
                districtName = parts[0].trim()
                wardName = parts[1].trim()
            }
        }

        setFormData((prev) => ({
            ...prev,
            fullName: addr.recipientName || prev.fullName,
            phone: addr.phone || prev.phone,
            address: addr.address,
            city: "",
            cityName: addr.city || "",
            district: "",
            districtName: isThreeLevel ? districtName : wardName,
            ward: "",
            wardName: isThreeLevel ? wardName : "",
        }))
    }

    useEffect(() => {
        if (!formData.cityName || provinces.length === 0) {
            return
        }

        const cityMatch = provinces.find(
            (p) =>
                normalizeLocationName(p.name) ===
                normalizeLocationName(formData.cityName),
        )

        if (cityMatch && String(cityMatch.code) !== formData.city) {
            setFormData((prev) => ({
                ...prev,
                city: String(cityMatch.code),
                cityName: cityMatch.name_with_type,
            }))
        }
    }, [formData.cityName, formData.city, provinces])

    useEffect(() => {
        if (
            !formData.districtName ||
            districts.length === 0 ||
            !formData.city
        ) {
            return
        }

        const districtMatch = districts.find(
            (d) =>
                normalizeLocationName(d.name) ===
                normalizeLocationName(formData.districtName),
        )

        if (districtMatch && String(districtMatch.code) !== formData.district) {
            setFormData((prev) => ({
                ...prev,
                district: String(districtMatch.code),
                districtName: districtMatch.name_with_type,
            }))
        }
    }, [formData.districtName, formData.district, formData.city, districts])

    useEffect(() => {
        if (
            !shippingSettings?.useThreeLevelAddress ||
            !formData.wardName ||
            wards.length === 0 ||
            !formData.district
        ) {
            return
        }

        const wardMatch = wards.find(
            (w) =>
                normalizeLocationName(w.name) ===
                normalizeLocationName(formData.wardName),
        )

        if (wardMatch && String(wardMatch.code) !== formData.ward) {
            setFormData((prev) => ({
                ...prev,
                ward: String(wardMatch.code),
                wardName: wardMatch.name_with_type,
            }))
        }
    }, [formData.wardName, formData.ward, formData.district, wards, shippingSettings])


    useEffect(() => {
        const fetchAddresses = async () => {
            if (!user?.id) return
            setAddressLoading(true)
            try {
                const customer = await api.customerGetByExternal(user.id)
                const nextAddresses = (customer?.addresses ?? []).sort(
                    (a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0),
                )
                setSavedAddresses(nextAddresses)
                setCustomerProfileId(customer?.id ?? null)
                if (customer?.acceptsMarketing) {
                    setAlreadySubscribed(true)
                }

                const defaultAddress = nextAddresses.find((a) => a.isDefault)
                if (defaultAddress) {
                    applyAddress(defaultAddress)
                }
            } catch (err) {
                console.error("Failed to load saved addresses:", err)
            } finally {
                setAddressLoading(false)
            }
        }

        if (mounted && isAuthenticated) {
            fetchAddresses()
        }
    }, [mounted, isAuthenticated, user?.id])

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-2xl font-semibold mb-3">
                        Cần đăng nhập để thanh toán
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Bạn cần đăng nhập trước khi đặt hàng.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Link
                            href="/auth/login?redirect=/checkout"
                            className="px-5 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            Đăng nhập
                        </Link>
                        <Link
                            href="/cart"
                            className="px-5 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Quay lại giỏ hàng
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Check if email is verified
    if (user && user.emailConfirmed === false) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                        <MapPin className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-3">
                        Vui lòng xác thực email
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Bạn cần xác thực email <strong>{user.email}</strong>{" "}
                        trước khi đặt hàng. Vui lòng kiểm tra hộp thư để xác
                        thực tài khoản.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Link
                            href="/profile"
                            className="px-5 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                        >
                            Đi đến tài khoản
                        </Link>
                        <Link
                            href="/cart"
                            className="px-5 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Quay lại giỏ hàng
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Order success screen
    if (orderComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-primary/5 py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Đặt hàng thành công!
                        </h2>
                        <p className="text-gray-600 mb-2">
                            Mã đơn hàng:{" "}
                            <strong className="text-primary">
                                {orderComplete.orderNumber}
                            </strong>
                        </p>
                        <p className="text-gray-600 mb-6">
                            Tổng tiền:{" "}
                            <strong className="text-green-600">
                                {formatCurrency(orderComplete.total)}
                            </strong>
                        </p>
                        <p className="text-sm text-gray-500 mb-8">
                            Cảm ơn bạn đã mua sắm tại XuThi Store! Chúng tôi sẽ
                            liên hệ để xác nhận đơn hàng.
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/orders"
                                className="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                            >
                                Xem đơn hàng
                            </Link>
                            <Link
                                href="/"
                                className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Tiếp tục mua sắm
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-600 mb-2">
                        Giỏ hàng trống
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Thêm sản phẩm vào giỏ hàng để thanh toán
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        )
    }

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleProvinceSelect = (provinceId: string) => {
        const province = provinces.find((p) => String(p.code) === provinceId)
        setFormData((prev) => ({
            ...prev,
            city: provinceId,
            cityName: province?.name_with_type || "",
            district: "",
            districtName: "",
            ward: "",
            wardName: "",
        }))
    }

    const handleDistrictSelect = (districtId: string) => {
        const district = districts.find((d) => String(d.code) === districtId)
        setFormData((prev) => ({
            ...prev,
            district: districtId,
            districtName: district?.name_with_type || "",
            ward: "",
            wardName: "",
        }))
    }

    const handleWardSelect = (wardId: string) => {
        const ward = wards.find((w) => String(w.code) === wardId)
        setFormData((prev) => ({
            ...prev,
            ward: wardId,
            wardName: ward?.name_with_type || "",
        }))
    }


    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return
        setApplyingVoucher(true)
        setVoucherError(null)
        setVoucherApplied(null)

        try {
            const response = await fetch(`${API_URL}/api/vouchers/validate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    code: voucherCode.trim(),
                    cartTotal: subtotal,
                    productIds: cart.items.map((item) => item.productId),
                    customerId: customerProfileId,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                if (data.isValid) {
                    setVoucherApplied({
                        code: voucherCode.trim(),
                        discount: data.discountAmount || 0,
                        message:
                            data.discountAmount > 0
                                ? "Áp dụng thành công!"
                                : "Voucher hợp lệ.",
                    })
                } else {
                    setVoucherError(
                        data.errorMessage || "Mã giảm giá không hợp lệ.",
                    )
                }
            } else {
                const errorData = await response.json().catch(() => ({}))
                setVoucherError(
                    errorData.message ||
                        errorData.detail ||
                        "Mã giảm giá không hợp lệ.",
                )
            }
        } catch (err) {
            console.error("Voucher validation error:", err)
            setVoucherError("Không thể kiểm tra voucher. Vui lòng thử lại.")
        } finally {
            setApplyingVoucher(false)
        }
    }

    const handleRemoveVoucher = () => {
        setVoucherCode("")
        setVoucherApplied(null)
        setVoucherError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const useThreeLevel = !!shippingSettings?.useThreeLevelAddress
        if (useThreeLevel) {
            if (!formData.city || !formData.district || !formData.ward) {
                setError("Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Xã/Phường/Thị trấn.")
                return
            }
        } else {
            if (!formData.city || !formData.district) {
                setError("Vui lòng chọn Tỉnh/Thành phố và Xã/Phường/Thị trấn.")
                return
            }
        }

        setIsSubmitting(true)

        try {
            // Prepare checkout request
            const checkoutData = {
                customerId: user?.id || null,
                customerName: formData.fullName,
                customerEmail: user?.email || "",
                customerPhone: formData.phone,
                shippingAddress: formData.address,
                shippingCity: formData.cityName || formData.city,
                shippingWard: useThreeLevel 
                    ? (formData.wardName || formData.ward) 
                    : (formData.districtName || formData.district),
                shippingDistrict: useThreeLevel 
                    ? (formData.districtName || formData.district) 
                    : undefined,
                shippingNote: formData.notes || null,
                paymentMethod: formData.paymentMethod === "cod" ? 1 : 3,
                items: cart.items.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                })),
                voucherCode: voucherApplied?.code || null,
                returnUrl: `${window.location.origin}/payment/payos/success`,
                cancelUrl: `${window.location.origin}/payment/payos/cancel`,
            }

            const response = await fetch(`${API_URL}/api/orders/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(checkoutData),
            })

            if (response.ok) {
                const result = await response.json()

                // PayOS/bank transfer: redirect immediately before any local success/cart side-effects.
                if (result.paymentUrl) {
                    window.location.href = result.paymentUrl
                    return
                }

                // Subscribe to newsletter if checked (fire-and-forget)
                if (subscribeNewsletter && customerProfileId) {
                    api.customerUpdate({
                        customerId: customerProfileId,
                        acceptsMarketing: true,
                    }).catch(() => {})
                }

                // COD: show success screen FIRST, then clear cart in background
                if (!result.paymentUrl) {
                    setOrderComplete({
                        orderNumber: result.orderNumber,
                        total: result.total,
                    })
                }

                // Clear the cart via backend endpoint
                try {
                    const cartId = cart.id
                    if (cartId && cartId !== "optimistic") {
                        await fetch(`${API_URL}/api/cart/${cartId}`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                        })
                    }
                } catch (clearErr) {
                    console.warn("Failed to clear cart on backend:", clearErr)
                }

                // Clear cart cookie + local state
                await clearCartAction()
                clearCart()
            } else {
                const errorData = await response.json().catch(() => ({}))
                setError(
                    errorData.detail ||
                        errorData.message ||
                        "Đặt hàng thất bại. Vui lòng thử lại.",
                )
            }
        } catch (err) {
            console.error("Checkout error:", err)
            setError("Đã xảy ra lỗi. Vui lòng thử lại.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const subtotal = cart.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
    )
    const discount = voucherApplied?.discount || 0
    const total = subtotal + shipping - discount

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <Link
                href="/cart"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại giỏ hàng
            </Link>

            <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Checkout Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit}>
                        {/* Shipping Info */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold">
                                    Thông tin giao hàng
                                </h2>
                            </div>

                            {addressLoading ? (
                                <div className="text-sm text-gray-500 mb-4">
                                    Đang tải địa chỉ...
                                </div>
                            ) : savedAddresses.length > 0 ? (
                                <div className="mb-4 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Địa chỉ đã lưu
                                        </label>
                                        <select
                                            value={selectedAddressId}
                                            onChange={(e) => {
                                                const selected =
                                                    savedAddresses.find(
                                                        (a) =>
                                                            a.id ===
                                                            e.target.value,
                                                    )
                                                if (selected) {
                                                    applyAddress(selected)
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ring focus:border-ring"
                                        >
                                            <option value="">
                                                -- Chọn địa chỉ --
                                            </option>
                                            {savedAddresses.map((addr) => (
                                                <option
                                                    key={addr.id}
                                                    value={addr.id}
                                                >
                                                    {addr.label} -{" "}
                                                    {addr.recipientName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ tên người nhận *
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nguyễn Văn A"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ring focus:border-ring"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        placeholder="0912 345 678"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ring focus:border-ring"
                                    />
                                </div>

                                {/* Address selectors inside nested grid */}
                                <div className={`md:col-span-2 grid grid-cols-1 ${shippingSettings?.useThreeLevelAddress ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`}>
                                    {/* Province/City */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tỉnh/Thành phố *
                                        </label>
                                        {loadingProvinces ? (
                                            <div className="flex items-center gap-2 py-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                <span className="text-sm text-gray-500">
                                                    Đang tải...
                                                </span>
                                            </div>
                                        ) : (
                                            <SearchableSelect
                                                value={formData.city}
                                                onValueChange={handleProvinceSelect}
                                                disabled={provinces.length === 0}
                                                placeholder="-- Chọn Tỉnh/Thành phố --"
                                                searchPlaceholder="Tìm tỉnh/thành phố"
                                                emptyText="Không tìm thấy tỉnh/thành phố"
                                                options={provinces.map((province) => ({
                                                    value: String(province.code),
                                                    label: province.name_with_type,
                                                }))}
                                            />
                                        )}
                                    </div>

                                    {shippingSettings?.useThreeLevelAddress ? (
                                        <>
                                            {/* District for 3-Level */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Quận/Huyện *
                                                </label>
                                                {loadingDistricts ? (
                                                    <div className="flex items-center gap-2 py-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                        <span className="text-sm text-gray-500">
                                                            Đang tải...
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <SearchableSelect
                                                        value={formData.district}
                                                        onValueChange={handleDistrictSelect}
                                                        disabled={
                                                            !formData.city ||
                                                            districts.length === 0
                                                        }
                                                        placeholder={
                                                            formData.city
                                                                ? "-- Chọn Quận/Huyện --"
                                                                : "-- Chọn Tỉnh/Thành phố trước --"
                                                        }
                                                        searchPlaceholder="Tìm quận/huyện"
                                                        emptyText="Không tìm thấy quận/huyện"
                                                        options={districts.map((district) => ({
                                                            value: String(district.code),
                                                            label: district.name_with_type,
                                                        }))}
                                                    />
                                                )}
                                            </div>

                                            {/* Ward for 3-Level */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Xã/Phường/Thị trấn *
                                                </label>
                                                {loadingWards ? (
                                                    <div className="flex items-center gap-2 py-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                        <span className="text-sm text-gray-500">
                                                            Đang tải...
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <SearchableSelect
                                                        value={formData.ward}
                                                        onValueChange={handleWardSelect}
                                                        disabled={
                                                            !formData.district ||
                                                            wards.length === 0
                                                        }
                                                        placeholder={
                                                            formData.district
                                                                ? "-- Chọn Xã/Phường/Thị trấn --"
                                                                : "-- Chọn Quận/Huyện trước --"
                                                        }
                                                        searchPlaceholder="Tìm xã/phường/thị trấn"
                                                        emptyText="Không tìm thấy xã/phường/thị trấn"
                                                        options={wards.map((ward) => ({
                                                            value: String(ward.code),
                                                            label: ward.name_with_type,
                                                        }))}
                                                    />
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        /* Ward/District for 2-Level */
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Xã/Phường/Thị trấn *
                                            </label>
                                            {loadingDistricts ? (
                                                <div className="flex items-center gap-2 py-2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                    <span className="text-sm text-gray-500">
                                                        Đang tải...
                                                    </span>
                                                </div>
                                            ) : (
                                                <SearchableSelect
                                                    value={formData.district}
                                                    onValueChange={handleDistrictSelect}
                                                    disabled={
                                                        !formData.city ||
                                                        districts.length === 0
                                                    }
                                                    placeholder={
                                                        formData.city
                                                            ? "-- Chọn Xã/Phường/Thị trấn --"
                                                            : "-- Chọn Tỉnh/Thành phố trước --"
                                                    }
                                                    searchPlaceholder="Tìm xã/phường/thị trấn"
                                                    emptyText="Không tìm thấy xã/phường/thị trấn"
                                                    options={districts.map((district) => ({
                                                        value: String(district.code),
                                                        label: district.name_with_type,
                                                    }))}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>


                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Địa chỉ cụ thể *
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        placeholder="Số nhà, tên đường"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ring focus:border-ring"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ghi chú
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-ring focus:border-ring"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Voucher Input */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Tag className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold">
                                    Mã giảm giá
                                </h2>
                            </div>

                            {voucherApplied ? (
                                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div>
                                        <span className="font-medium text-green-700">
                                            {voucherApplied.code}
                                        </span>
                                        <span className="text-sm text-green-600 ml-2">
                                            {voucherApplied.message}
                                        </span>
                                        {voucherApplied.discount > 0 && (
                                            <span className="text-sm font-medium text-green-700 ml-2">
                                                (-
                                                {formatCurrency(
                                                    voucherApplied.discount,
                                                )}
                                                )
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveVoucher}
                                        className="p-1 hover:bg-green-100 rounded"
                                    >
                                        <X className="w-4 h-4 text-green-600" />
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={voucherCode}
                                            onChange={(e) => {
                                                setVoucherCode(e.target.value)
                                                setVoucherError(null)
                                            }}
                                            placeholder="Nhập mã giảm giá"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-ring focus:border-ring"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleApplyVoucher}
                                            disabled={
                                                applyingVoucher ||
                                                !voucherCode.trim()
                                            }
                                        >
                                            {applyingVoucher ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "Áp dụng"
                                            )}
                                        </Button>
                                    </div>
                                    {voucherError && (
                                        <p className="mt-2 text-sm text-red-600">
                                            {voucherError}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <CreditCard className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-semibold">
                                    Phương thức thanh toán
                                </h2>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={
                                            formData.paymentMethod === "cod"
                                        }
                                        onChange={handleChange}
                                        className="mr-3"
                                    />
                                    <Truck className="w-5 h-5 mr-3 text-gray-500" />
                                    <div>
                                        <span className="font-medium">
                                            Thanh toán khi nhận hàng (COD)
                                        </span>
                                        <p className="text-sm text-gray-500">
                                            Thanh toán bằng tiền mặt khi nhận
                                            hàng
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="bank"
                                        checked={
                                            formData.paymentMethod === "bank"
                                        }
                                        onChange={handleChange}
                                        className="mr-3"
                                    />
                                    <CreditCard className="w-5 h-5 mr-3 text-gray-500" />
                                    <div>
                                        <span className="font-medium">
                                            Chuyển khoản ngân hàng
                                        </span>
                                        <p className="text-sm text-gray-500">
                                            Chuyển khoản trước khi giao hàng
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Newsletter Subscription */}
                        {isAuthenticated && !alreadySubscribed && (
                            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={subscribeNewsletter}
                                        onChange={(e) =>
                                            setSubscribeNewsletter(
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-ring"
                                    />
                                    <Bell className="w-5 h-5 text-primary shrink-0" />
                                    <div>
                                        <span className="text-sm font-medium">
                                            Nhận thông tin khuyến mãi
                                        </span>
                                        <p className="text-xs text-gray-500">
                                            Nhận email khi có sản phẩm mới hoặc
                                            chương trình sale
                                        </p>
                                    </div>
                                </label>
                            </div>
                        )}

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Đang xử lý..."
                                : `Đặt hàng - ${formatCurrency(total)}`}
                        </Button>
                    </form>
                </div>

                {/* Order Summary */}
                <div>
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                        <h2 className="text-lg font-semibold mb-4">
                            Đơn hàng của bạn
                        </h2>

                        <div className="space-y-3 mb-4">
                            {cart.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between text-sm"
                                >
                                    <div className="text-gray-600">
                                        <div>
                                            {item.productName} x{item.quantity}
                                        </div>
                                        {item.variantDescription && (
                                            <div className="text-xs text-gray-500">
                                                {item.variantDescription}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div>
                                            {formatCurrency(
                                                item.unitPrice * item.quantity,
                                            )}
                                        </div>
                                        {item.compareAtPrice &&
                                            item.compareAtPrice >
                                                item.unitPrice && (
                                                <div className="text-xs text-gray-400 line-through">
                                                    {formatCurrency(
                                                        item.compareAtPrice *
                                                            item.quantity,
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tạm tính</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex flex-col">
                                    <span className="text-gray-600">
                                        Phí vận chuyển
                                    </span>
                                    {formData.city && formData.district && shippingSettings?.enabled && (
                                        <span className={`text-[10px] font-semibold mt-0.5 self-start px-1.5 py-0.5 rounded-full ${
                                            isGhnUsed 
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                        }`}>
                                            {isGhnUsed ? "✓ GHN - Tính phí động" : "⚠ Phí COD - Dự phòng"}
                                        </span>
                                    )}
                                </div>
                                <span>{formatCurrency(shipping)}</span>
                            </div>
                            {voucherApplied && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Voucher {voucherApplied.code}</span>
                                    <span>
                                        {discount > 0
                                            ? `-${formatCurrency(discount)}`
                                            : "0 đ"}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                                <span>Tổng cộng</span>
                                <span className="text-primary">
                                    {formatCurrency(total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
