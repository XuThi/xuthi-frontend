"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    User,
    Mail,
    LogOut,
    AlertCircle,
    CheckCircle,
    Send,
    Loader2,
} from "lucide-react"
import { api } from "@/lib/api/client"
import type { Address } from "@/lib/api/types"

const API_URL = "/api/bff"
const LOCATION_API = "https://provinces.open-api.vn/api"

interface Province {
    code: number
    name: string
}
interface District {
    code: number
    name: string
}
interface Ward {
    code: number
    name: string
}

export default function ProfilePage() {
    const {
        user,
        isAuthenticated,
        isLoading,
        logout,
        resendVerificationEmail,
    } = useAuth()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [resending, setResending] = useState(false)
    const [resendSuccess, setResendSuccess] = useState(false)
    const [customerId, setCustomerId] = useState<string | null>(null)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [addressLoading, setAddressLoading] = useState(false)
    const [addressError, setAddressError] = useState<string | null>(null)
    const [savingAddress, setSavingAddress] = useState(false)
    const [editingAddress, setEditingAddress] = useState<Address | null>(null)
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [addressForm, setAddressForm] = useState({
        label: "",
        recipientName: "",
        phone: "",
        address: "",
        ward: "",
        wardName: "",
        district: "",
        districtName: "",
        city: "",
        cityName: "",
        note: "",
        isDefault: false,
    })

    // Location dropdown data
    const [provinces, setProvinces] = useState<Province[]>([])
    const [districts, setDistricts] = useState<District[]>([])
    const [wards, setWards] = useState<Ward[]>([])
    const [loadingProvinces, setLoadingProvinces] = useState(false)
    const [loadingDistricts, setLoadingDistricts] = useState(false)
    const [loadingWards, setLoadingWards] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && !isLoading && !isAuthenticated) {
            router.push("/auth/login")
        }
    }, [mounted, isLoading, isAuthenticated, router])

    // Fetch provinces on mount
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true)
            try {
                const response = await fetch(`${LOCATION_API}/p/`)
                if (response.ok) {
                    const data = await response.json()
                    setProvinces(data || [])
                }
            } catch (err) {
                console.error("Failed to fetch provinces:", err)
            } finally {
                setLoadingProvinces(false)
            }
        }
        fetchProvinces()
    }, [])

    // Fetch districts when province changes
    useEffect(() => {
        if (!addressForm.city) {
            setDistricts([])
            setWards([])
            return
        }
        const fetchDistricts = async () => {
            setLoadingDistricts(true)
            setDistricts([])
            setWards([])
            setAddressForm((prev) => ({
                ...prev,
                district: "",
                districtName: "",
                ward: "",
                wardName: "",
            }))
            try {
                const response = await fetch(
                    `${LOCATION_API}/p/${addressForm.city}?depth=2`,
                )
                if (response.ok) {
                    const data = await response.json()
                    setDistricts(data.districts || [])
                }
            } catch (err) {
                console.error("Failed to fetch districts:", err)
            } finally {
                setLoadingDistricts(false)
            }
        }
        fetchDistricts()
    }, [addressForm.city])

    // Fetch wards when district changes
    useEffect(() => {
        if (!addressForm.district) {
            setWards([])
            return
        }
        const fetchWards = async () => {
            setLoadingWards(true)
            setWards([])
            setAddressForm((prev) => ({ ...prev, ward: "", wardName: "" }))
            try {
                const response = await fetch(
                    `${LOCATION_API}/d/${addressForm.district}?depth=2`,
                )
                if (response.ok) {
                    const data = await response.json()
                    setWards(data.wards || [])
                }
            } catch (err) {
                console.error("Failed to fetch wards:", err)
            } finally {
                setLoadingWards(false)
            }
        }
        fetchWards()
    }, [addressForm.district])

    const refreshAddresses = async () => {
        if (!user?.id) return
        setAddressLoading(true)
        setAddressError(null)
        try {
            const customer = await api.customerGetByExternal(user.id)
            if (!customer) {
                setAddresses([])
                setCustomerId(null)
                setAddressError("Không tìm thấy thông tin khách hàng.")
                return
            }
            setCustomerId(customer.id)
            // Sort: default address first
            const sorted = [...(customer.addresses ?? [])].sort((a, b) => {
                if (a.isDefault && !b.isDefault) return -1
                if (!a.isDefault && b.isDefault) return 1
                return a.label.localeCompare(b.label, "vi")
            })
            setAddresses(sorted)
        } catch (err) {
            console.error("Failed to load addresses:", err)
            setAddressError("Không thể tải danh sách địa chỉ.")
        } finally {
            setAddressLoading(false)
        }
    }

    useEffect(() => {
        if (mounted && isAuthenticated && user?.id) {
            refreshAddresses()
        }
    }, [mounted, isAuthenticated, user?.id])

    const handleResendVerification = async () => {
        if (!user?.email) return

        setResending(true)
        const result = await resendVerificationEmail(user.email)

        if (result.success) {
            setResendSuccess(true)
            setTimeout(() => setResendSuccess(false), 5000)
        } else {
            alert(result.error || "Có lỗi xảy ra")
        }

        setResending(false)
    }

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!isAuthenticated || !user) {
        return null
    }

    const displayName =
        user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email

    const resetAddressForm = () => {
        setEditingAddress(null)
        setShowAddressForm(false)
        setAddressForm({
            label: "",
            recipientName: "",
            phone: "",
            address: "",
            ward: "",
            wardName: "",
            district: "",
            districtName: "",
            city: "",
            cityName: "",
            note: "",
            isDefault: false,
        })
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

    const handleEditAddress = (addr: Address) => {
        setEditingAddress(addr)
        setShowAddressForm(true)

        // Try to match existing province/district/ward names to dropdown IDs
        const matchingProvince = provinces.find(
            (p) =>
                normalizeLocationName(p.name) ===
                normalizeLocationName(addr.city),
        )

        setAddressForm({
            label: addr.label,
            recipientName: addr.recipientName,
            phone: addr.phone,
            address: addr.address,
            ward: "",
            wardName: addr.ward,
            district: "",
            districtName: addr.district,
            city: matchingProvince ? String(matchingProvince.code) : "",
            cityName: addr.city,
            note: addr.note || "",
            isDefault: addr.isDefault,
        })
    }

    const handleDeleteAddress = async (addressId: string) => {
        if (!customerId) return
        if (!confirm("Bạn chắc chắn muốn xóa địa chỉ này?")) return
        const success = await api.addressDelete({ customerId, addressId })
        if (!success) {
            alert("Xóa địa chỉ thất bại.")
            return
        }
        await refreshAddresses()
    }

    const handleSetDefault = async (addressId: string) => {
        if (!customerId) return
        const success = await api.addressSetDefault({ customerId, addressId })
        if (!success) {
            alert("Không thể đặt địa chỉ mặc định.")
            return
        }

        setAddresses((prev) => {
            const next = prev.map((address) => ({
                ...address,
                isDefault: address.id === addressId,
            }))
            return next.sort((a, b) => {
                if (a.isDefault && !b.isDefault) return -1
                if (!a.isDefault && b.isDefault) return 1
                return a.label.localeCompare(b.label, "vi")
            })
        })

        await refreshAddresses()
    }

    const handleSubmitAddress = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!customerId) {
            setAddressError("Không tìm thấy thông tin khách hàng.")
            return
        }
        setSavingAddress(true)
        try {
            const cityToSend = addressForm.cityName || addressForm.city
            const districtToSend =
                addressForm.districtName || addressForm.district
            const wardToSend = addressForm.wardName || addressForm.ward

            if (editingAddress) {
                const success = await api.addressUpdate({
                    customerId,
                    addressId: editingAddress.id,
                    label: addressForm.label,
                    recipientName: addressForm.recipientName,
                    phone: addressForm.phone,
                    address: addressForm.address,
                    ward: wardToSend,
                    district: districtToSend,
                    city: cityToSend,
                    note: addressForm.note || undefined,
                    isDefault: addressForm.isDefault,
                })
                if (!success) {
                    setAddressError("Cập nhật địa chỉ thất bại.")
                    return
                }
            } else {
                const result = await api.addressCreate({
                    customerId,
                    label: addressForm.label,
                    recipientName: addressForm.recipientName,
                    phone: addressForm.phone,
                    address: addressForm.address,
                    ward: wardToSend,
                    district: districtToSend,
                    city: cityToSend,
                    note: addressForm.note || undefined,
                    setAsDefault: addressForm.isDefault,
                })
                if (!result) {
                    setAddressError("Thêm địa chỉ thất bại.")
                    return
                }
            }
            await refreshAddresses()
            resetAddressForm()
        } finally {
            setSavingAddress(false)
        }
    }

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provinceId = e.target.value
        const province = provinces.find((p) => String(p.code) === provinceId)
        setAddressForm((prev) => ({
            ...prev,
            city: provinceId,
            cityName: province?.name || "",
            district: "",
            districtName: "",
            ward: "",
            wardName: "",
        }))
    }

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const districtId = e.target.value
        const district = districts.find((d) => String(d.code) === districtId)
        setAddressForm((prev) => ({
            ...prev,
            district: districtId,
            districtName: district?.name || "",
            ward: "",
            wardName: "",
        }))
    }

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const wardId = e.target.value
        const ward = wards.find((w) => String(w.code) === wardId)
        setAddressForm((prev) => ({
            ...prev,
            ward: wardId,
            wardName: ward?.name || "",
        }))
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Tài khoản của tôi</h1>

            {/* Email Verification Banner */}
            {!user.emailConfirmed && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-yellow-800">
                            Email chưa được xác nhận
                        </h3>
                        <p className="text-yellow-700 text-sm mt-1">
                            Vui lòng xác nhận địa chỉ email{" "}
                            <strong>{user.email}</strong> để sử dụng đầy đủ tính
                            năng.
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            {resendSuccess ? (
                                <span className="inline-flex items-center text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Đã gửi! Kiểm tra email của bạn.
                                </span>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleResendVerification}
                                    disabled={resending}
                                    className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    {resending
                                        ? "Đang gửi..."
                                        : "Gửi lại email xác nhận"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Email Verified Banner */}
            {user.emailConfirmed && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">
                        Email đã được xác nhận
                    </span>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold">
                            {displayName}
                        </h2>
                        <p className="text-gray-500">{user.email}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Thông tin cá nhân
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <User className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Họ tên
                                    </p>
                                    <p className="font-medium">{displayName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Mail className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Email
                                    </p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Địa chỉ giao hàng
                        </h3>
                        {addressLoading ? (
                            <div className="text-sm text-gray-500">
                                Đang tải địa chỉ...
                            </div>
                        ) : addressError ? (
                            <div className="text-sm text-red-600">
                                {addressError}
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="text-sm text-gray-500">
                                Chưa có địa chỉ nào.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className={`border rounded-lg p-4 ${addr.isDefault ? "border-green-300 bg-green-50/50" : ""}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">
                                                {addr.label}
                                                {addr.isDefault && (
                                                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                        Mặc định
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!addr.isDefault && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleSetDefault(
                                                                addr.id,
                                                            )
                                                        }
                                                    >
                                                        Đặt mặc định
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleEditAddress(addr)
                                                    }
                                                >
                                                    Sửa
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDeleteAddress(
                                                            addr.id,
                                                        )
                                                    }
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-2">
                                            {addr.recipientName} - {addr.phone}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {addr.address}, {addr.ward},{" "}
                                            {addr.district}, {addr.city}
                                        </div>
                                        {addr.note && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {addr.note}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6">
                            {!showAddressForm ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowAddressForm(true)}
                                >
                                    Thêm địa chỉ giao hàng
                                </Button>
                            ) : (
                                <form
                                    onSubmit={handleSubmitAddress}
                                    className="space-y-4"
                                >
                                    <h4 className="font-semibold">
                                        {editingAddress
                                            ? "Cập nhật địa chỉ"
                                            : "Thêm địa chỉ mới"}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nhãn
                                            </label>
                                            <input
                                                value={addressForm.label}
                                                onChange={(e) =>
                                                    setAddressForm((prev) => ({
                                                        ...prev,
                                                        label: e.target.value,
                                                    }))
                                                }
                                                placeholder="Vd: Nhà, Cơ quan, Nhà bạn..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Người nhận
                                            </label>
                                            <input
                                                value={
                                                    addressForm.recipientName
                                                }
                                                onChange={(e) =>
                                                    setAddressForm((prev) => ({
                                                        ...prev,
                                                        recipientName:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="Họ và tên người nhận"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Số điện thoại
                                            </label>
                                            <input
                                                value={addressForm.phone}
                                                onChange={(e) =>
                                                    setAddressForm((prev) => ({
                                                        ...prev,
                                                        phone: e.target.value,
                                                    }))
                                                }
                                                placeholder="Vd: 0901234567"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Địa chỉ (Số nhà, đường)
                                            </label>
                                            <input
                                                value={addressForm.address}
                                                onChange={(e) =>
                                                    setAddressForm((prev) => ({
                                                        ...prev,
                                                        address: e.target.value,
                                                    }))
                                                }
                                                placeholder="Vd: 123 Nguyễn Huệ"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                required
                                            />
                                        </div>

                                        {/* Province/City dropdown */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tỉnh/Thành phố *
                                            </label>
                                            {loadingProvinces ? (
                                                <div className="flex items-center gap-2 py-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm text-gray-500">
                                                        Đang tải...
                                                    </span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={addressForm.city}
                                                    onChange={
                                                        handleProvinceChange
                                                    }
                                                    required
                                                    disabled={
                                                        provinces.length === 0
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="">
                                                        -- Chọn Tỉnh/Thành phố
                                                        --
                                                    </option>
                                                    {provinces.map((p) => (
                                                        <option
                                                            key={p.code}
                                                            value={p.code}
                                                        >
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        {/* District dropdown */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quận/Huyện *
                                            </label>
                                            {loadingDistricts ? (
                                                <div className="flex items-center gap-2 py-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm text-gray-500">
                                                        Đang tải...
                                                    </span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={addressForm.district}
                                                    onChange={
                                                        handleDistrictChange
                                                    }
                                                    required
                                                    disabled={
                                                        !addressForm.city ||
                                                        districts.length === 0
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="">
                                                        {addressForm.city
                                                            ? "-- Chọn Quận/Huyện --"
                                                            : "-- Chọn Tỉnh/Thành phố trước --"}
                                                    </option>
                                                    {districts.map((d) => (
                                                        <option
                                                            key={d.code}
                                                            value={d.code}
                                                        >
                                                            {d.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        {/* Ward dropdown */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phường/Xã
                                            </label>
                                            {loadingWards ? (
                                                <div className="flex items-center gap-2 py-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm text-gray-500">
                                                        Đang tải...
                                                    </span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={addressForm.ward}
                                                    onChange={handleWardChange}
                                                    disabled={
                                                        !addressForm.district ||
                                                        wards.length === 0
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="">
                                                        {addressForm.district
                                                            ? "-- Chọn Phường/Xã --"
                                                            : "-- Chọn Quận/Huyện trước --"}
                                                    </option>
                                                    {wards.map((w) => (
                                                        <option
                                                            key={w.code}
                                                            value={w.code}
                                                        >
                                                            {w.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ghi chú
                                            </label>
                                            <input
                                                value={addressForm.note}
                                                onChange={(e) =>
                                                    setAddressForm((prev) => ({
                                                        ...prev,
                                                        note: e.target.value,
                                                    }))
                                                }
                                                placeholder="Vd: Giao giờ hành chính"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={addressForm.isDefault}
                                                onChange={(e) =>
                                                    setAddressForm((prev) => ({
                                                        ...prev,
                                                        isDefault:
                                                            e.target.checked,
                                                    }))
                                                }
                                            />
                                            Đặt làm mặc định
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="submit"
                                            disabled={savingAddress}
                                        >
                                            {savingAddress
                                                ? "Đang lưu..."
                                                : editingAddress
                                                  ? "Cập nhật"
                                                  : "Thêm mới"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetAddressForm}
                                        >
                                            Hủy
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Hành động
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/orders")}
                            >
                                Xem đơn hàng
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    logout()
                                    router.push("/")
                                }}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
