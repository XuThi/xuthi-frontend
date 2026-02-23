"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api/client"
import type { Product, SaleCampaignDetail } from "@/lib/api/types"
import { toast } from "sonner"
import { Trash2, Undo2, Plus } from "lucide-react"

function extractApiErrorMessage(error: any) {
    const raw = error?.message || ""
    const jsonStart = raw.indexOf("{")
    if (jsonStart >= 0) {
        try {
            const payload = JSON.parse(raw.slice(jsonStart))
            return payload.detail || payload.message || payload.title || raw
        } catch {
            return raw
        }
    }
    return raw
}

// Maps to backend SaleCampaignType enum
const CAMPAIGN_TYPES = [
    { value: "1", label: "Flash Sale (vài giờ - 1 ngày)" },
    { value: "2", label: "Seasonal Sale (Black Friday, 11.11...)" },
    { value: "3", label: "Clearance (Xả kho)" },
    { value: "4", label: "Member Exclusive (Dành cho thành viên)" },
]

// Format number with dots (1000000 -> 1.000.000)
function formatVND(value: string | number): string {
    const num =
        typeof value === "string" ? value.replace(/\./g, "") : String(value)
    if (!num || isNaN(Number(num))) return ""
    return Number(num).toLocaleString("vi-VN")
}

// Parse formatted string back to raw number string
function parseVND(formatted: string): string {
    return formatted.replace(/\./g, "").replace(/,/g, "")
}

interface PendingItem {
    tempId: string
    productId: string
    productName: string
    salePrice: string
    originalPrice: string
    discountPercentage: string
    maxQuantity: string
}

export default function SaleCampaignForm({
    initialData,
}: {
    initialData?: SaleCampaignDetail
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
        bannerImageUrl: initialData?.bannerImageUrl || "",
        type: String(initialData?.type ?? "2"),
        startDate: initialData
            ? new Date(initialData.startDate).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        endDate: initialData
            ? new Date(initialData.endDate).toISOString().slice(0, 16)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 16),
        isActive: initialData?.isActive ?? true,
        isFeatured: initialData?.isFeatured ?? false,
    })

    // -- Batch management: track existing items, pending adds, and pending deletes --
    const [existingItems, setExistingItems] = useState(
        (initialData?.items || []).map((item) => ({
            id: item.id,
            productId: item.productId,
            salePrice: String(item.salePrice ?? ""),
            originalPrice: String(item.originalPrice ?? ""),
            discountPercentage: String(item.discountPercentage ?? ""),
            maxQuantity: String(item.maxQuantity ?? ""),
            soldQuantity: item.soldQuantity,
            dirty: false, // Track if user modified this item
        })),
    )
    const [pendingAdds, setPendingAdds] = useState<PendingItem[]>([])
    const [pendingDeletes, setPendingDeletes] = useState<string[]>([])

    // New item form
    const [newItem, setNewItem] = useState({
        productId: "",
        salePrice: "",
        originalPrice: "",
        discountPercentage: "",
        maxQuantity: "",
    })

    useEffect(() => {
        const loadProducts = async () => {
            const result = await api.productBrowse({ limit: 200 })
            setProducts(result.data || [])
        }
        loadProducts()
    }, [])

    // Auto-fill original price when product is selected for new item
    const handleNewItemProductChange = (productId: string) => {
        const product = products.find((p) => p.id === productId)
        const price = product?.variants?.[0]?.price
        setNewItem((prev) => ({
            ...prev,
            productId,
            originalPrice: price ? String(price) : "",
        }))
    }

    const handleAddPendingItem = () => {
        if (!newItem.productId || !newItem.salePrice) {
            toast.error("Vui lòng chọn sản phẩm và nhập giá sale")
            return
        }

        // Check if product is already in campaign
        const isAlreadyExisting = existingItems.some(
            (item) =>
                item.productId === newItem.productId &&
                !pendingDeletes.includes(item.id),
        )
        const isAlreadyPending = pendingAdds.some(
            (item) => item.productId === newItem.productId,
        )

        if (isAlreadyExisting || isAlreadyPending) {
            toast.error("Sản phẩm này đã có trong campaign")
            return
        }

        const product = products.find((p) => p.id === newItem.productId)
        setPendingAdds((prev) => [
            ...prev,
            {
                tempId: `temp-${Date.now()}`,
                productId: newItem.productId,
                productName: product?.name || newItem.productId,
                salePrice: newItem.salePrice,
                originalPrice: newItem.originalPrice,
                discountPercentage: newItem.discountPercentage,
                maxQuantity: newItem.maxQuantity,
            },
        ])
        setNewItem({
            productId: "",
            salePrice: "",
            originalPrice: "",
            discountPercentage: "",
            maxQuantity: "",
        })
        toast.success("Đã thêm sản phẩm (chưa lưu)")
    }

    const handleMarkForDelete = (itemId: string) => {
        setPendingDeletes((prev) => [...prev, itemId])
        toast.info("Sản phẩm sẽ bị xóa khi lưu")
    }

    const handleUndoDelete = (itemId: string) => {
        setPendingDeletes((prev) => prev.filter((id) => id !== itemId))
    }

    const handleRemovePendingAdd = (tempId: string) => {
        setPendingAdds((prev) => prev.filter((item) => item.tempId !== tempId))
    }

    const handleExistingItemEdit = (
        itemId: string,
        field: string,
        value: string,
    ) => {
        setExistingItems((prev) =>
            prev.map((item) =>
                item.id === itemId
                    ? { ...item, [field]: value, dirty: true }
                    : item,
            ),
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                name: formData.name,
                description: formData.description || undefined,
                bannerImageUrl: formData.bannerImageUrl || undefined,
                type: Number(formData.type) || 2,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                isActive: formData.isActive,
                isFeatured: formData.isFeatured,
            }

            let campaignId = initialData?.id

            if (initialData) {
                const result = await api.saleCampaignUpdate(
                    initialData.id,
                    payload,
                )
                if (!result) {
                    toast.error("Không thể cập nhật campaign")
                    setLoading(false)
                    return
                }
            } else {
                const result = await api.saleCampaignCreate(payload)
                if (!result) {
                    toast.error("Không thể tạo campaign")
                    setLoading(false)
                    return
                }
                campaignId = (result as any).id || result
            }

            // Batch operations for items (only when editing)
            if (campaignId && initialData) {
                // 1. Delete marked items
                for (const itemId of pendingDeletes) {
                    await api.saleCampaignRemoveItem(itemId)
                }

                // 2. Update dirty existing items
                for (const item of existingItems) {
                    if (item.dirty && !pendingDeletes.includes(item.id)) {
                        await api.saleCampaignUpdateItem(item.id, {
                            salePrice: Number(item.salePrice),
                            originalPrice: item.originalPrice
                                ? Number(item.originalPrice)
                                : null,
                            discountPercentage: item.discountPercentage
                                ? Number(item.discountPercentage)
                                : null,
                            maxQuantity: item.maxQuantity
                                ? Number(item.maxQuantity)
                                : null,
                        })
                    }
                }

                // 3. Add new items
                for (const item of pendingAdds) {
                    try {
                        await api.saleCampaignAddItem(campaignId as string, {
                            productId: item.productId,
                            salePrice: Number(item.salePrice),
                            originalPrice: item.originalPrice
                                ? Number(item.originalPrice)
                                : null,
                            discountPercentage: item.discountPercentage
                                ? Number(item.discountPercentage)
                                : null,
                            maxQuantity: item.maxQuantity
                                ? Number(item.maxQuantity)
                                : null,
                        })
                    } catch (addErr: any) {
                        const errMsg = extractApiErrorMessage(addErr)
                        if (
                            errMsg.includes("trùng sản phẩm") ||
                            errMsg.includes("duplicate")
                        ) {
                            toast.error(
                                `Sản phẩm "${item.productName}" đã tồn tại trong campaign khác đang hoạt động.`,
                            )
                        } else {
                            toast.error(
                                `Lỗi thêm "${item.productName}": ${errMsg}`,
                            )
                        }
                    }
                }
            }

            toast.success(
                initialData ? "Đã cập nhật campaign" : "Đã tạo campaign",
            )
            router.push("/admin/sale-campaigns")
            router.refresh()
        } catch (error: any) {
            console.error("Submit error:", error)
            const errMsg = extractApiErrorMessage(error)
            if (
                errMsg.includes("trùng sản phẩm") ||
                errMsg.includes("duplicate")
            ) {
                toast.error(
                    "Campaign bị trùng sản phẩm với campaign khác đang hoạt động.",
                )
            } else {
                toast.error(errMsg || "Có lỗi xảy ra khi lưu")
            }
        } finally {
            setLoading(false)
        }
    }

    // Filter out products that are already in the campaign
    const availableProducts = products.filter((p) => {
        const inExisting = existingItems.some(
            (item) =>
                item.productId === p.id && !pendingDeletes.includes(item.id),
        )
        const inPending = pendingAdds.some((item) => item.productId === p.id)
        return !inExisting && !inPending
    })

    // CSS to hide number input spinners
    const noSpinnerStyle = `
        [data-no-spinner]::-webkit-outer-spin-button,
        [data-no-spinner]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        [data-no-spinner] {
            -moz-appearance: textfield;
        }
    `

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            <style>{noSpinnerStyle}</style>

            <div>
                <label className="text-sm font-medium">Tên campaign</label>
                <Input
                    value={formData.name}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                        }))
                    }
                    placeholder="Vd: Black Friday 2025"
                    required
                />
            </div>

            <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                    value={formData.description}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                        }))
                    }
                    placeholder="Mô tả chiến dịch khuyến mãi..."
                />
            </div>

            <div>
                <label className="text-sm font-medium">Banner URL</label>
                <Input
                    value={formData.bannerImageUrl}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            bannerImageUrl: e.target.value,
                        }))
                    }
                    placeholder="https://example.com/banner.jpg"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Loại campaign</label>
                    <Select
                        value={formData.type}
                        onValueChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                type: value,
                            }))
                        }
                    >
                        <SelectTrigger className="mt-1 w-full">
                            <SelectValue placeholder="Chọn loại campaign" />
                        </SelectTrigger>
                        <SelectContent>
                            {CAMPAIGN_TYPES.map((ct) => (
                                <SelectItem key={ct.value} value={ct.value}>
                                    {ct.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 pt-5">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    isActive: e.target.checked,
                                }))
                            }
                        />
                        Kích hoạt
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={formData.isFeatured}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    isFeatured: e.target.checked,
                                }))
                            }
                        />
                        Nổi bật (hiển thị trên trang chủ)
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Bắt đầu</label>
                    <Input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                            }))
                        }
                        required
                        step="1"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Kết thúc</label>
                    <Input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                            }))
                        }
                        required
                        step="1"
                    />
                </div>
            </div>

            {/* Product Management Section */}
            {initialData && (
                <div className="rounded-lg border p-4 space-y-4">
                    <h3 className="text-lg font-semibold">
                        Sản phẩm trong campaign
                    </h3>

                    {/* Add new product row */}
                    <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/40 p-4 md:grid-cols-[minmax(320px,2.2fr)_1fr_1fr_auto] md:items-end">
                        <Select
                            value={newItem.productId}
                            onValueChange={handleNewItemProductChange}
                        >
                            <SelectTrigger className="min-w-0 bg-background md:min-w-[320px]">
                                <SelectValue placeholder="-- Chọn sản phẩm --" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableProducts.map((product) => (
                                    <SelectItem
                                        key={product.id}
                                        value={product.id}
                                    >
                                        {product.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Giá sale *"
                            data-no-spinner
                            type="text"
                            inputMode="numeric"
                            value={formatVND(newItem.salePrice)}
                            onChange={(e) =>
                                setNewItem((prev) => ({
                                    ...prev,
                                    salePrice: parseVND(e.target.value),
                                }))
                            }
                            className="min-w-0"
                        />
                        <Input
                            placeholder="Giá gốc"
                            type="text"
                            value={formatVND(newItem.originalPrice)}
                            readOnly
                            className="min-w-0 bg-gray-100 text-gray-600"
                            title="Tự động lấy từ giá sản phẩm"
                        />
                        <Button
                            type="button"
                            onClick={handleAddPendingItem}
                            className="gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm
                        </Button>
                    </div>

                    {/* Existing + pending items list */}
                    <div className="space-y-2">
                        {existingItems.length === 0 &&
                            pendingAdds.length === 0 && (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                    Chưa có sản phẩm nào trong campaign.
                                </p>
                            )}

                        {(existingItems.length > 0 ||
                            pendingAdds.length > 0) && (
                            <div className="hidden rounded-lg border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[2.2fr_1fr_1fr_auto] md:gap-3">
                                <span className="tracking-wide uppercase">
                                    Sản phẩm
                                </span>
                                <span className="tracking-wide uppercase">
                                    Giá sale
                                </span>
                                <span className="tracking-wide uppercase">
                                    Giá gốc
                                </span>
                                <span className="text-right">Tác vụ</span>
                            </div>
                        )}

                        {existingItems.map((item) => {
                            const isDeleted = pendingDeletes.includes(item.id)
                            const product = products.find(
                                (p) => p.id === item.productId,
                            )

                            return (
                                <div
                                    key={item.id}
                                    className={`grid grid-cols-1 gap-3 rounded-lg border p-3 transition-all md:grid-cols-[2.2fr_1fr_1fr_auto] md:items-center ${
                                        isDeleted
                                            ? "opacity-50 bg-red-50/50 border-red-200"
                                            : item.dirty
                                              ? "bg-yellow-50/50 border-yellow-200"
                                              : "bg-white hover:bg-gray-50/50"
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div
                                            className={`font-medium text-sm ${isDeleted ? "line-through text-gray-400" : ""}`}
                                        >
                                            {product?.name || item.productId}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex gap-2 items-center">
                                            <span>
                                                Đã bán: {item.soldQuantity}
                                            </span>
                                            {item.dirty && !isDeleted && (
                                                <span className="text-yellow-600 font-medium">
                                                    (đã sửa)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <label className="text-xs text-muted-foreground md:hidden">
                                            Giá sale
                                        </label>
                                        <Input
                                            data-no-spinner
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="Giá sale"
                                            value={formatVND(item.salePrice)}
                                            onChange={(e) =>
                                                handleExistingItemEdit(
                                                    item.id,
                                                    "salePrice",
                                                    parseVND(e.target.value),
                                                )
                                            }
                                            disabled={isDeleted}
                                            className={
                                                isDeleted ? "line-through" : ""
                                            }
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <label className="text-xs text-muted-foreground md:hidden">
                                            Giá gốc
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Giá gốc"
                                            value={formatVND(
                                                item.originalPrice,
                                            )}
                                            readOnly
                                            className="bg-gray-100 text-gray-600"
                                            title="Giá gốc từ sản phẩm"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end">
                                        {isDeleted ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleUndoDelete(item.id)
                                                }
                                                className="gap-1.5 hover:bg-gray-100 transition-colors"
                                            >
                                                <Undo2 className="w-4 h-4" />
                                                Hoàn tác
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleMarkForDelete(item.id)
                                                }
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                                title="Xóa sản phẩm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Pending adds */}
                        {pendingAdds.map((item) => (
                            <div
                                key={item.tempId}
                                className="grid grid-cols-1 gap-3 rounded-lg border border-green-200 bg-green-50/50 p-3 md:grid-cols-[2.2fr_1fr_1fr_auto] md:items-center"
                            >
                                <div className="min-w-0">
                                    <div className="font-medium text-sm">
                                        {item.productName}
                                    </div>
                                    <div className="text-green-600 text-xs font-medium">
                                        (mới thêm - chưa lưu)
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <Input
                                        data-no-spinner
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Giá sale"
                                        value={formatVND(item.salePrice)}
                                        onChange={(e) =>
                                            setPendingAdds((prev) =>
                                                prev.map((p) =>
                                                    p.tempId === item.tempId
                                                        ? {
                                                              ...p,
                                                              salePrice:
                                                                  parseVND(
                                                                      e.target
                                                                          .value,
                                                                  ),
                                                          }
                                                        : p,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                                <div className="min-w-0">
                                    <Input
                                        type="text"
                                        value={formatVND(item.originalPrice)}
                                        readOnly
                                        className="bg-gray-100 text-gray-600"
                                    />
                                </div>
                                <div className="flex items-center justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            handleRemovePendingAdd(item.tempId)
                                        }
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                        title="Bỏ sản phẩm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary of pending changes */}
                    {(pendingAdds.length > 0 ||
                        pendingDeletes.length > 0 ||
                        existingItems.some((i) => i.dirty)) && (
                        <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg border flex items-center gap-3 flex-wrap">
                            <span className="font-medium">
                                Thay đổi chưa lưu:
                            </span>
                            {pendingAdds.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs font-medium">
                                    +{pendingAdds.length} thêm
                                </span>
                            )}
                            {existingItems.filter((i) => i.dirty).length >
                                0 && (
                                <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full text-xs font-medium">
                                    ~
                                    {
                                        existingItems.filter((i) => i.dirty)
                                            .length
                                    }{" "}
                                    sửa
                                </span>
                            )}
                            {pendingDeletes.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-xs font-medium">
                                    -{pendingDeletes.length} xóa
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            <Button
                type="submit"
                disabled={loading}
                className="w-full px-8 md:w-auto"
            >
                {loading
                    ? "Đang lưu..."
                    : initialData
                      ? "Lưu tất cả thay đổi"
                      : "Tạo campaign"}
            </Button>
        </form>
    )
}
