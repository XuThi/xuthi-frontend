"use client"

import { useEffect, useState, useTransition } from "react"
import { commerce } from "@/lib/commerce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Check, AlertCircle, Loader2 } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"

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

export default function SettingsPage() {
    const [enabled, setEnabled] = useState(true)
    const [flatRate, setFlatRate] = useState(30000)
    const [useGhn, setUseGhn] = useState(false)
    const [ghnToken, setGhnToken] = useState("")
    const [ghnShopId, setGhnShopId] = useState(0)
    
    // Warehouse origin configs (local codes and names)
    const [warehouseCityCode, setWarehouseCityCode] = useState("12")
    const [warehouseCityName, setWarehouseCityName] = useState("Thành phố Hồ Chí Minh")
    const [warehouseDistrictCode, setWarehouseDistrictCode] = useState("")
    const [warehouseDistrictName, setWarehouseDistrictName] = useState("")
    const [warehouseWardCode, setWarehouseWardCode] = useState("25363")
    const [warehouseWardName, setWarehouseWardName] = useState("Phường Đông Hưng Thuận")
    const [useThreeLevelAddress, setUseThreeLevelAddress] = useState(false)

    // Location loading states
    const [provinces, setProvinces] = useState<Province[]>([])
    const [districts, setDistricts] = useState<District[]>([])
    const [wards, setWards] = useState<District[]>([])
    const [loadingProvinces, setLoadingProvinces] = useState(false)
    const [loadingDistricts, setLoadingDistricts] = useState(false)
    const [loadingWards, setLoadingWards] = useState(false)

    // Fallback rates
    const [hcmFallbackRate, setHcmFallbackRate] = useState(18000)
    const [nationalFallbackRate, setNationalFallbackRate] = useState(30000)

    // Package dimensions
    const [packageWeightGrams, setPackageWeightGrams] = useState(1000)
    const [packageLengthCm, setPackageLengthCm] = useState(28)
    const [packageWidthCm, setPackageWidthCm] = useState(18)
    const [packageHeightCm, setPackageHeightCm] = useState(9)

    const [loading, setLoading] = useState(true)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    // Fetch provinces on mount (and when address level changes)
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true)
            try {
                const endpoint = useThreeLevelAddress 
                    ? "/api/locations/three-level/provinces" 
                    : "/api/locations/provinces"
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
    }, [useThreeLevelAddress])

    // Fetch level 2 locations (districts in 3-level, wards in 2-level) when warehouseCityCode changes
    useEffect(() => {
        if (!warehouseCityCode) {
            setDistricts([])
            return
        }
        const fetchDistricts = async () => {
            setLoadingDistricts(true)
            try {
                const endpoint = useThreeLevelAddress
                    ? `/api/locations/three-level/districts?provinceCode=${warehouseCityCode}`
                    : `/api/locations/wards?provinceCode=${warehouseCityCode}`
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
    }, [warehouseCityCode, useThreeLevelAddress])

    // Fetch level 3 locations (wards in 3-level) when warehouseDistrictCode changes
    useEffect(() => {
        if (!useThreeLevelAddress || !warehouseCityCode || !warehouseDistrictCode) {
            setWards([])
            return
        }
        const fetchWards = async () => {
            setLoadingWards(true)
            try {
                const response = await fetch(
                    `/api/locations/three-level/wards?provinceCode=${warehouseCityCode}&districtCode=${warehouseDistrictCode}`
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
    }, [warehouseCityCode, warehouseDistrictCode, useThreeLevelAddress])

    useEffect(() => {
        commerce.orderGetShippingSettings()
            .then(res => {
                setEnabled(res.enabled)
                setFlatRate(res.flatRate)
                setUseGhn(res.useGhn || false)
                setGhnToken(res.ghnToken || "")
                setGhnShopId(res.ghnShopId || 0)
                setHcmFallbackRate(res.hcmFallbackRate ?? 18000)
                setNationalFallbackRate(res.nationalFallbackRate ?? 30000)
                setPackageWeightGrams(res.packageWeightGrams ?? 1000)
                setPackageLengthCm(res.packageLengthCm ?? 28)
                setPackageWidthCm(res.packageWidthCm ?? 18)
                setPackageHeightCm(res.packageHeightCm ?? 9)
                
                // Set warehouse location properties
                setWarehouseCityCode(res.warehouseCityCode || "12")
                setWarehouseCityName(res.warehouseCityName || "Thành phố Hồ Chí Minh")
                setWarehouseWardCode(res.warehouseWardCode || "25363")
                setWarehouseWardName(res.warehouseWardName || "Phường Đông Hưng Thuận")
                
                // 3-level fields
                setUseThreeLevelAddress(res.useThreeLevelAddress || false)
                setWarehouseDistrictCode(res.warehouseDistrictCode || "")
                setWarehouseDistrictName(res.warehouseDistrictName || "")
                
                setLoading(false)
            })
            .catch(() => {
                setError("Không thể tải cấu hình phí vận chuyển.")
                setLoading(false)
            })
    }, [])

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        startTransition(async () => {
            const successResult = await commerce.orderUpdateShippingSettings({
                enabled,
                flatRate: Number(flatRate),
                useGhn,
                ghnToken,
                ghnShopId: Number(ghnShopId),
                hcmFallbackRate: Number(hcmFallbackRate),
                nationalFallbackRate: Number(nationalFallbackRate),
                packageWeightGrams: Number(packageWeightGrams),
                packageLengthCm: Number(packageLengthCm),
                packageWidthCm: Number(packageWidthCm),
                packageHeightCm: Number(packageHeightCm),
                warehouseCityCode,
                warehouseCityName,
                warehouseWardCode,
                warehouseWardName,
                useThreeLevelAddress,
                warehouseDistrictCode,
                warehouseDistrictName
            })

            if (successResult) {
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            } else {
                setError("Có lỗi xảy ra khi lưu cài đặt. Vui lòng thử lại.")
            }
        })
    }

    const applyPreset = (rate: number) => {
        if (rate === 0) {
            setEnabled(false)
            setFlatRate(0)
        } else {
            setEnabled(true)
            setFlatRate(rate)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải cấu hình cài đặt...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    Cài đặt hệ thống
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                    Quản lý cấu hình dịch vụ, giao hàng và các tính năng vận hành của Eshop.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="rounded-2xl border border-border shadow-md bg-card overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/20 p-6">
                        <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Truck className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Cấu hình phí vận chuyển (Shipping Config)</CardTitle>
                                <CardDescription className="text-sm">
                                    Quản lý chính sách phí giao hàng flat-rate toàn hệ thống.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {error && (
                            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-center gap-2 animate-scale-up">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-scale-up">
                                <Check className="h-4 w-4 shrink-0" />
                                <span>Cài đặt phí vận chuyển đã được cập nhật thành công! 🎉</span>
                            </div>
                        )}

                        {/* Toggle switch */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/15">
                            <div className="space-y-1 pr-4">
                                <Label htmlFor="shipping-enabled" className="text-sm font-semibold cursor-pointer">
                                    Bật thu phí vận chuyển
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Nếu tắt phí vận chuyển, hệ thống sẽ tự động áp dụng chính sách **Miễn phí giao hàng (Free Shipping)** cho toàn bộ đơn hàng checkout.
                                </p>
                            </div>
                            <Switch
                                id="shipping-enabled"
                                checked={enabled}
                                onCheckedChange={setEnabled}
                            />
                        </div>

                        {/* 3-Level Address Switch */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/15">
                            <div className="space-y-1 pr-4">
                                <Label htmlFor="use-three-level-address" className="text-sm font-semibold cursor-pointer">
                                    Sử dụng địa chỉ 3 cấp (Tỉnh {"->"} Quận {"->"} Xã)
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Bật để áp dụng địa chỉ giao hàng và địa chỉ kho 3 cấp (Tỉnh/Thành phố, Quận/Huyện, Xã/Phường/Thị trấn) thay vì 2 cấp (Tỉnh/Thành phố, Xã/Phường). **Bắt buộc khi sử dụng phí động GHN.**
                                </p>
                            </div>
                            <Switch
                                id="use-three-level-address"
                                checked={useThreeLevelAddress}
                                onCheckedChange={(val) => {
                                    setUseThreeLevelAddress(val)
                                    // Reset warehouse selects when switching modes
                                    setWarehouseCityCode("")
                                    setWarehouseCityName("")
                                    setWarehouseDistrictCode("")
                                    setWarehouseDistrictName("")
                                    setWarehouseWardCode("")
                                    setWarehouseWardName("")
                                }}
                            />
                        </div>

                        {/* GHN Dynamic Shipping Toggle */}
                        <div className={`flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/15 transition-all duration-300 ${enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                            <div className="space-y-1 pr-4">
                                <Label htmlFor="use-ghn" className="text-sm font-semibold cursor-pointer">
                                    Bật tính phí động GiaoHangNhanh (GHN)
                                </Label>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Kết nối trực tiếp API GiaoHangNhanh để tính phí động. Nếu thất bại sẽ tự động dùng mức COD (HCMC: 18k, tỉnh khác: 30k).
                                </p>
                            </div>
                            <Switch
                                id="use-ghn"
                                checked={useGhn}
                                onCheckedChange={setUseGhn}
                                disabled={!enabled}
                            />
                        </div>

                        {/* GHN Settings (API Key / Shop ID) */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${enabled && useGhn ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                    GHN API Token
                                </Label>
                                <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg p-3 font-medium">
                                    Mã token được cấu hình bảo mật trực tiếp thông qua biến môi trường (Environment Variable) trên Server.
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ghn-shopid" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                    GHN Shop ID (Tùy chọn)
                                </Label>
                                <Input
                                    id="ghn-shopid"
                                    type="number"
                                    value={ghnShopId || ""}
                                    onChange={(e) => setGhnShopId(Number(e.target.value))}
                                    disabled={!enabled || !useGhn}
                                    placeholder="Ví dụ: 195232"
                                    className="text-sm focus-visible:ring-1"
                                />
                            </div>
                        </div>

                        {/* GHN Warehouse Origin Config */}
                        <div className={`space-y-4 transition-all duration-300 ${enabled && useGhn ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Cài đặt địa chỉ kho gửi hàng (Origin Address)</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Province/City Select */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold block">Tỉnh/Thành phố gửi *</Label>
                                    {loadingProvinces ? (
                                        <div className="flex items-center gap-2 py-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span className="text-xs text-muted-foreground">Đang tải danh sách...</span>
                                        </div>
                                    ) : (
                                        <SearchableSelect
                                            value={warehouseCityCode}
                                            onValueChange={(code) => {
                                                const province = provinces.find((p) => String(p.code) === code)
                                                setWarehouseCityCode(code)
                                                setWarehouseCityName(province?.name_with_type || "")
                                                setWarehouseDistrictCode("")
                                                setWarehouseDistrictName("")
                                                setWarehouseWardCode("")
                                                setWarehouseWardName("")
                                            }}
                                            disabled={!enabled || !useGhn || provinces.length === 0}
                                            placeholder="-- Chọn Tỉnh/Thành phố gửi --"
                                            searchPlaceholder="Tìm tỉnh/thành phố"
                                            emptyText="Không tìm thấy tỉnh/thành phố"
                                            options={provinces.map((province) => ({
                                                value: String(province.code),
                                                label: province.name_with_type,
                                            }))}
                                        />
                                    )}
                                </div>

                                {useThreeLevelAddress ? (
                                    <>
                                        {/* District Select for 3-Level */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold block">Quận/Huyện gửi *</Label>
                                            {loadingDistricts ? (
                                                <div className="flex items-center gap-2 py-2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                    <span className="text-xs text-muted-foreground">Đang tải danh sách...</span>
                                                </div>
                                            ) : (
                                                <SearchableSelect
                                                    value={warehouseDistrictCode}
                                                    onValueChange={(code) => {
                                                        const district = districts.find((d) => String(d.code) === code)
                                                        setWarehouseDistrictCode(code)
                                                        setWarehouseDistrictName(district?.name_with_type || "")
                                                        setWarehouseWardCode("")
                                                        setWarehouseWardName("")
                                                    }}
                                                    disabled={!enabled || !useGhn || !warehouseCityCode || districts.length === 0}
                                                    placeholder={
                                                        warehouseCityCode
                                                            ? "-- Chọn Quận/Huyện gửi --"
                                                            : "-- Chọn Tỉnh/Thành phố gửi trước --"
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

                                        {/* Ward Select for 3-Level */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold block">Xã/Phường/Thị trấn gửi *</Label>
                                            {loadingWards ? (
                                                <div className="flex items-center gap-2 py-2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                    <span className="text-xs text-muted-foreground">Đang tải danh sách...</span>
                                                </div>
                                            ) : (
                                                <SearchableSelect
                                                    value={warehouseWardCode}
                                                    onValueChange={(code) => {
                                                        const ward = wards.find((w) => String(w.code) === code)
                                                        setWarehouseWardCode(code)
                                                        setWarehouseWardName(ward?.name_with_type || "")
                                                    }}
                                                    disabled={!enabled || !useGhn || !warehouseDistrictCode || wards.length === 0}
                                                    placeholder={
                                                        warehouseDistrictCode
                                                            ? "-- Chọn Xã/Phường/Thị trấn gửi --"
                                                            : "-- Chọn Quận/Huyện gửi trước --"
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
                                    /* Ward Select for 2-Level */
                                    <div className="space-y-2 col-span-2">
                                        <Label className="text-xs font-semibold block">Xã/Phường/Thị trấn gửi *</Label>
                                        {loadingDistricts ? (
                                            <div className="flex items-center gap-2 py-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                <span className="text-xs text-muted-foreground">Đang tải danh sách...</span>
                                            </div>
                                        ) : (
                                            <SearchableSelect
                                                value={warehouseWardCode}
                                                onValueChange={(code) => {
                                                    const district = districts.find((d) => String(d.code) === code)
                                                    setWarehouseWardCode(code)
                                                    setWarehouseWardName(district?.name_with_type || "")
                                                }}
                                                disabled={!enabled || !useGhn || !warehouseCityCode || districts.length === 0}
                                                placeholder={
                                                    warehouseCityCode
                                                        ? "-- Chọn Xã/Phường/Thị trấn gửi --"
                                                        : "-- Chọn Tỉnh/Thành phố gửi trước --"
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
                        </div>

                        {/* Package Dimensions */}
                        <div className={`space-y-4 border-t pt-4 border-border/40 transition-all duration-300 ${enabled && useGhn ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Thông số Gói Hàng (Package Metrics)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="package-weight" className="text-xs font-semibold">Cân nặng (grams)</Label>
                                    <Input
                                        id="package-weight"
                                        type="number"
                                        value={packageWeightGrams || ""}
                                        onChange={(e) => setPackageWeightGrams(Number(e.target.value))}
                                        disabled={!enabled || !useGhn}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="package-length" className="text-xs font-semibold">Chiều dài (cm)</Label>
                                    <Input
                                        id="package-length"
                                        type="number"
                                        value={packageLengthCm || ""}
                                        onChange={(e) => setPackageLengthCm(Number(e.target.value))}
                                        disabled={!enabled || !useGhn}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="package-width" className="text-xs font-semibold">Chiều rộng (cm)</Label>
                                    <Input
                                        id="package-width"
                                        type="number"
                                        value={packageWidthCm || ""}
                                        onChange={(e) => setPackageWidthCm(Number(e.target.value))}
                                        disabled={!enabled || !useGhn}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="package-height" className="text-xs font-semibold">Chiều cao (cm)</Label>
                                    <Input
                                        id="package-height"
                                        type="number"
                                        value={packageHeightCm || ""}
                                        onChange={(e) => setPackageHeightCm(Number(e.target.value))}
                                        disabled={!enabled || !useGhn}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fallback Pricing Rules */}
                        <div className={`space-y-4 border-t pt-4 border-border/40 transition-all duration-300 ${enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Mức Phí COD Dự Phòng (Fallback Rates)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fallback-hcm" className="text-xs font-semibold">Nội thành Hồ Chí Minh (VND)</Label>
                                    <Input
                                        id="fallback-hcm"
                                        type="number"
                                        value={hcmFallbackRate || ""}
                                        onChange={(e) => setHcmFallbackRate(Number(e.target.value))}
                                        disabled={!enabled}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fallback-national" className="text-xs font-semibold">Các tỉnh thành khác (VND)</Label>
                                    <Input
                                        id="fallback-national"
                                        type="number"
                                        value={nationalFallbackRate || ""}
                                        onChange={(e) => setNationalFallbackRate(Number(e.target.value))}
                                        disabled={!enabled}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Flat rate input (conditionally styled based on toggle) */}
                        <div className={`space-y-2 transition-all duration-300 ${enabled && !useGhn ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                            <Label htmlFor="shipping-rate" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                Phí vận chuyển tiêu chuẩn (VND)
                            </Label>
                            <div className="relative">
                                <Input
                                    id="shipping-rate"
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={flatRate}
                                    onChange={(e) => setFlatRate(Number(e.target.value))}
                                    disabled={!enabled || useGhn}
                                    className="pr-12 text-sm focus-visible:ring-1"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                                    đ
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Khách hàng sẽ phải trả thêm mức phí này vào hóa đơn khi tính theo flat-rate cố định.
                            </p>
                        </div>

                        {/* Quick Action Presets */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                Cài đặt nhanh (Presets)
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => applyPreset(30000)}
                                    className="text-xs px-3 py-1.5 bg-secondary hover:bg-primary/10 border border-border/80 rounded-lg text-muted-foreground hover:text-primary transition-all font-medium"
                                >
                                    Phí tiêu chuẩn (30.000đ)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyPreset(50000)}
                                    className="text-xs px-3 py-1.5 bg-secondary hover:bg-primary/10 border border-border/80 rounded-lg text-muted-foreground hover:text-primary transition-all font-medium"
                                >
                                    Giao nhanh (50.000đ)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyPreset(0)}
                                    className="text-xs px-3 py-1.5 bg-secondary hover:bg-primary/10 border border-border/80 rounded-lg text-muted-foreground hover:text-primary transition-all font-medium"
                                >
                                    Freeship toàn sàn (0đ)
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t border-border bg-muted/10 p-6 flex justify-end gap-3">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl font-bold min-w-[140px] shadow-sm"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin animate-pulse" />
                                    Đang lưu...
                                </>
                            ) : (
                                "Lưu thay đổi"
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
