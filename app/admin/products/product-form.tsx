"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Loader2,
    Plus,
    Trash,
    RefreshCw,
    Upload,
    X,
    ImageIcon,
} from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { api } from "@/lib/api/client"
import { Category, Brand, Product, VariantOption } from "@/lib/api/types"

// ============ Schema ============

const variantSchema = z.object({
    id: z.string().optional(), // Added ID for updates
    sku: z.string().min(1, "SKU là bắt buộc"),
    price: z.coerce.number().min(0),
    compareAtPrice: z.coerce.number().optional(),
    stockQuantity: z.coerce.number().min(0),
    optionSelections: z.array(
        z.object({
            variantOptionId: z.string(),
            value: z.string(),
        }),
    ),
})

const productSchema = z
    .object({
        name: z.string().min(2, "Tên sản phẩm phải có ít nhất 2 ký tự"),
        description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
        categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
        brandId: z.string().min(1, "Vui lòng chọn thương hiệu"),
        isActive: z.boolean().default(true),
        images: z.array(z.string()).default([]),

        hasVariants: z.boolean().default(false),

        // Simple product fields (used when hasVariants is false)
        simplePrice: z.coerce.number().optional(),
        simpleCompareAtPrice: z.coerce.number().optional(),
        simpleSku: z.string().optional(),
        simpleStock: z.coerce.number().optional(),

        // Variants (used when hasVariants is true)
        variants: z.array(variantSchema).optional(),
    })
    .refine(
        (data) => {
            if (!data.hasVariants) {
                return !!data.simplePrice && !!data.simpleSku
            }
            return data.variants && data.variants.length > 0
        },
        { message: "Vui lòng nhập thông tin giá và tồn kho" },
    )

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
    initialData?: Product
}

const formatVndInput = (value?: number) => {
    if (value === undefined || value === null || Number.isNaN(value)) return ""
    return new Intl.NumberFormat("vi-VN").format(value)
}

const parseVndInput = (raw: string, allowEmpty = false) => {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return allowEmpty ? undefined : 0
    return Number(digits)
}

const toSkuSegment = (value: string) => {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toUpperCase()
}

const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"]

const isSupportedImageFile = (file: File) => {
    const lowerFileName = file.name.toLowerCase()
    return SUPPORTED_IMAGE_EXTENSIONS.some((extension) =>
        lowerFileName.endsWith(extension),
    )
}

// ============ Image Upload Component ============

function ImageUploader({
    images,
    uploading,
    onPickFiles,
    onRemoveImage,
}: {
    images: string[]
    uploading: boolean
    onPickFiles: (files: FileList) => void
    onRemoveImage: (index: number) => void
}) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return
        onPickFiles(files)

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
                {images.map((url, index) => (
                    <div
                        key={index}
                        className="relative aspect-square rounded-lg border overflow-hidden group"
                    >
                        <Image
                            src={url}
                            alt={`Product image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="150px"
                        />
                        <button
                            type="button"
                            onClick={() => onRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                        {index === 0 && (
                            <Badge
                                className="absolute bottom-1 left-1 text-xs"
                                variant="secondary"
                            >
                                Chính
                            </Badge>
                        )}
                    </div>
                ))}

                {/* Upload button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/50 transition-colors disabled:opacity-50"
                >
                    {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    ) : (
                        <>
                            <Upload className="w-6 h-6 text-gray-400" />
                            <span className="text-xs text-gray-500">
                                Tải ảnh
                            </span>
                        </>
                    )}
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                multiple
                onChange={handleUpload}
                className="hidden"
            />

            {images.length === 0 && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    Chưa có ảnh nào. Tải lên ảnh sản phẩm để hiển thị.
                </p>
            )}
        </div>
    )
}

// ============ Form Component ============

export default function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([])
    const [pendingImagePreviews, setPendingImagePreviews] = useState<string[]>(
        [],
    )

    // Data sources
    const [categories, setCategories] = useState<Category[]>([])
    const [brands, setBrands] = useState<Brand[]>([])
    const [allOptions, setAllOptions] = useState<VariantOption[]>([])

    // Variant generation state
    const [selectedOptions, setSelectedOptions] = useState<
        { optionId: string; rawInput: string }[]
    >([])

    // Initialize form
    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: getInitialValues(initialData),
    })

    useEffect(() => {
        form.reset(getInitialValues(initialData))
        setPendingImageFiles([])
        setPendingImagePreviews([])

        if (initialData && initialData.variants.length > 0) {
            const firstVar = initialData.variants[0]
            const hasVar = Object.keys(firstVar.attributes || {}).length > 0
            if (hasVar) {
                const usedOptionIds = Object.keys(firstVar.attributes)
                const mappedOptions = usedOptionIds.map((optId) => {
                    const values = new Set<string>()
                    initialData.variants.forEach((v) => {
                        if (v.attributes[optId]) values.add(v.attributes[optId])
                    })
                    return {
                        optionId: optId,
                        rawInput: Array.from(values).join(", "),
                    }
                })
                setSelectedOptions(mappedOptions)
            } else {
                setSelectedOptions([])
            }
        } else {
            setSelectedOptions([])
        }
    }, [initialData, form])

    const { fields: variantFields, replace: replaceVariants } = useFieldArray({
        control: form.control,
        name: "variants",
        keyName: "fieldId",
    })

    const hasVariants = form.watch("hasVariants")
    const currentImages = form.watch("images") || []
    const displayImages = [...currentImages, ...pendingImagePreviews]

    const handlePickFiles = (files: FileList) => {
        const list = Array.from(files)
        const validFiles = list.filter(isSupportedImageFile)
        const invalidCount = list.length - validFiles.length

        if (invalidCount > 0) {
            alert(
                `Có ${invalidCount} ảnh không hỗ trợ định dạng. Chỉ chấp nhận: ${SUPPORTED_IMAGE_EXTENSIONS.join(", ")}`,
            )
        }

        if (validFiles.length === 0) {
            return
        }

        const previews = validFiles.map((file) => URL.createObjectURL(file))
        setPendingImageFiles((prev) => [...prev, ...validFiles])
        setPendingImagePreviews((prev) => [...prev, ...previews])
    }

    const handleRemoveImage = (index: number) => {
        if (index < currentImages.length) {
            const updated = currentImages.filter((_, i) => i !== index)
            form.setValue("images", updated)
            return
        }

        const localIndex = index - currentImages.length
        setPendingImagePreviews((prev) => {
            const next = [...prev]
            const removed = next.splice(localIndex, 1)
            if (removed[0]) URL.revokeObjectURL(removed[0])
            return next
        })
        setPendingImageFiles((prev) => prev.filter((_, i) => i !== localIndex))
    }

    // Load data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoriesRes, brandsRes, optionsRes] =
                    await Promise.all([
                        api.categoryBrowse({ limit: 100 }),
                        api.brandBrowse(),
                        api.variantOptionBrowse(),
                    ])
                setCategories(categoriesRes.data)
                setBrands(brandsRes.data)
                setAllOptions(optionsRes.data)
            } catch (error) {
                console.error("Failed to fetch data:", error)
            }
        }
        fetchData()
    }, [initialData])

    // Helper to generate variant key from option selections for comparison
    const getVariantKey = (
        selections: { variantOptionId: string; value: string }[],
    ) => {
        return selections
            .map((s) => `${s.variantOptionId}:${s.value}`)
            .sort()
            .join("|")
    }

    // Fix #8: Generate variants while preserving user edits
    const generateVariants = () => {
        if (selectedOptions.length === 0) return

        const cartesian = (sets: string[][]) => {
            return sets.reduce<string[][]>(
                (acc, curr) => {
                    return acc.flatMap((x) => curr.map((y) => [...x, y]))
                },
                [[]],
            )
        }

        const optionIds = selectedOptions.map((o) => o.optionId)
        // Parse raw input into values at generation time
        const valueSets = selectedOptions.map((o) =>
            parseOptionValues(o.rawInput),
        )

        // Filter out options with no values
        if (valueSets.some((vs) => vs.length === 0)) return

        const permutations = cartesian(valueSets)

        // Build a map of existing variant data by key
        const existingVariants = form.getValues("variants") || []
        const existingMap = new Map<string, (typeof existingVariants)[number]>()
        for (const v of existingVariants) {
            const key = getVariantKey(v.optionSelections)
            existingMap.set(key, v)
        }

        const newVariants = permutations.map((perm) => {
            const selections = perm.map((val, idx) => ({
                variantOptionId: optionIds[idx],
                value: val,
            }))

            const key = getVariantKey(selections)
            const existing = existingMap.get(key)

            // If this variant existed before, preserve user edits and ID
            if (existing) {
                return {
                    ...existing,
                    optionSelections: selections,
                }
            }

            // New variant — generate defaults
            const skuSuffix =
                perm
                    .map((value) => toSkuSegment(value))
                    .filter(Boolean)
                    .join("-") || "VARIANT"
            const baseSku = form.getValues("simpleSku") || "SKU"

            return {
                sku: `${baseSku}-${skuSuffix}`,
                price: form.getValues("simplePrice") || 0,
                compareAtPrice: form.getValues("simpleCompareAtPrice"),
                stockQuantity: 10,
                optionSelections: selections,
            }
        })

        replaceVariants(newVariants)
    }

    // Fix #9: Improved parsing for variant option values
    const parseOptionValues = (input: string): string[] => {
        // Support comma-separated and Enter-separated values
        return (
            input
                .split(/[,\n]/)
                .map((s) => s.trim())
                .filter(Boolean)
                // Deduplicate
                .filter((v, i, arr) => arr.indexOf(v) === i)
        )
    }

    const onSubmit = async (data: ProductFormValues) => {
        try {
            setLoading(true)

            const payload: any = {
                name: data.name,
                description: data.description,
                categoryId: data.categoryId,
                brandId: data.brandId,
                isActive: data.isActive,
                images: (data.images || []).filter(
                    (url) => !url.startsWith("blob:"),
                ),
            }

            if (data.hasVariants) {
                payload.variants = data.variants?.map((v) => ({
                    id: v.id,
                    sku: v.sku,
                    price: v.price,
                    compareAtPrice: v.compareAtPrice,
                    stockQuantity: v.stockQuantity,
                    isActive: true,
                    optionSelections: v.optionSelections,
                }))
            } else {
                payload.variants = [
                    {
                        id: initialData?.variants?.[0]?.id,
                        sku: data.simpleSku,
                        price: data.simplePrice,
                        compareAtPrice: data.simpleCompareAtPrice,
                        stockQuantity: data.simpleStock,
                        isActive: true,
                        optionSelections: [],
                    },
                ]
            }

            const token = localStorage.getItem("xuthi_auth_token")
            const API_URL = "/api/bff"
            const formData = new FormData()
            formData.append("data", JSON.stringify(payload))
            pendingImageFiles.forEach((file) => {
                formData.append("images", file, file.name)
            })

            if (initialData) {
                const response = await fetch(
                    `${API_URL}/api/products/${initialData.id}/with-images`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                    },
                )

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(errorText || "Failed to update product")
                }
            } else {
                const response = await fetch(`${API_URL}/api/products`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(errorText || "Failed to create product")
                }
            }

            router.push("/admin/products")
        } catch (error) {
            console.error("Submit error:", error)
            alert(
                error instanceof Error
                    ? error.message
                    : "Lưu sản phẩm thất bại",
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 w-full max-w-5xl"
            >
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên sản phẩm</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Áo thun..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mô tả</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={5}
                                            placeholder="Mô tả chi tiết sản phẩm..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Danh mục</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn danh mục" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="brandId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thương hiệu</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn thương hiệu" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {brands.map((b) => (
                                                    <SelectItem
                                                        key={b.id}
                                                        value={b.id}
                                                    >
                                                        {b.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Fix #10: Product Image Upload */}
                        <div className="rounded-lg border p-4 space-y-3">
                            <h3 className="font-medium flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Ảnh sản phẩm
                            </h3>
                            <ImageUploader
                                images={displayImages}
                                uploading={loading}
                                onPickFiles={handlePickFiles}
                                onRemoveImage={handleRemoveImage}
                            />
                        </div>
                    </div>

                    {/* Product Options & Pricing */}
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Trạng thái hoạt động
                                        </FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="hasVariants"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Sản phẩm có nhiều biến thể
                                        </FormLabel>
                                        <FormDescription>
                                            Ví dụ: Kích thước, Màu sắc khác nhau
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {!hasVariants ? (
                            // Simple Product Fields
                            <div className="rounded-lg border p-4 space-y-4">
                                <h3 className="font-medium">
                                    Thông tin bán hàng
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="simplePrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Giá bán (VNĐ)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        inputMode="numeric"
                                                        placeholder="1.000.000"
                                                        value={formatVndInput(
                                                            field.value,
                                                        )}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                parseVndInput(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="simpleCompareAtPrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Giá gốc (VNĐ)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        inputMode="numeric"
                                                        placeholder="1.200.000"
                                                        value={formatVndInput(
                                                            field.value,
                                                        )}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                parseVndInput(
                                                                    e.target
                                                                        .value,
                                                                    true,
                                                                ),
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="simpleSku"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>SKU</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="simpleStock"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tồn kho</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        ) : (
                            // Variants Configuration
                            <div className="space-y-6">
                                {/* Option Selector */}
                                <div className="rounded-lg border p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium">
                                            Cấu hình thuộc tính
                                        </h3>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setSelectedOptions([
                                                    ...selectedOptions,
                                                    {
                                                        optionId: "",
                                                        rawInput: "",
                                                    },
                                                ])
                                            }
                                        >
                                            <Plus className="mr-2 h-4 w-4" />{" "}
                                            Thêm thuộc tính
                                        </Button>
                                    </div>

                                    {selectedOptions.map((opt, idx) => (
                                        <div
                                            key={idx}
                                            className="flex gap-4 items-start p-3 bg-muted/30 rounded border"
                                        >
                                            <div className="w-44 shrink-0">
                                                <Select
                                                    value={opt.optionId}
                                                    onValueChange={(val) => {
                                                        const newOpts = [
                                                            ...selectedOptions,
                                                        ]
                                                        newOpts[idx] = {
                                                            optionId: val,
                                                            rawInput: "",
                                                        }
                                                        setSelectedOptions(
                                                            newOpts,
                                                        )
                                                    }}
                                                >
                                                    <SelectTrigger className="w-44">
                                                        <SelectValue placeholder="Chọn thuộc tính" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {allOptions.map((o) => (
                                                            <SelectItem
                                                                key={o.id}
                                                                value={o.id}
                                                                disabled={selectedOptions.some(
                                                                    (so) =>
                                                                        so.optionId ===
                                                                            o.id &&
                                                                        so !==
                                                                            opt,
                                                                )}
                                                            >
                                                                {o.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex-1">
                                                {(() => {
                                                    const optionValues =
                                                        allOptions.find(
                                                            (o) =>
                                                                o.id ===
                                                                opt.optionId,
                                                        )?.values
                                                    const selectedValues =
                                                        parseOptionValues(
                                                            opt.rawInput,
                                                        )

                                                    if (
                                                        !optionValues ||
                                                        optionValues.length ===
                                                            0
                                                    ) {
                                                        return null
                                                    }

                                                    return (
                                                        <div className="mb-2 flex flex-wrap gap-2">
                                                            {optionValues.map(
                                                                (value) => {
                                                                    const isSelected =
                                                                        selectedValues.includes(
                                                                            value,
                                                                        )

                                                                    return (
                                                                        <Button
                                                                            key={
                                                                                value
                                                                            }
                                                                            type="button"
                                                                            size="sm"
                                                                            variant={
                                                                                isSelected
                                                                                    ? "default"
                                                                                    : "outline"
                                                                            }
                                                                            className="h-7 px-2"
                                                                            onClick={() => {
                                                                                const current =
                                                                                    parseOptionValues(
                                                                                        opt.rawInput,
                                                                                    )
                                                                                const nextValues =
                                                                                    current.includes(
                                                                                        value,
                                                                                    )
                                                                                        ? current.filter(
                                                                                              (
                                                                                                  item,
                                                                                              ) =>
                                                                                                  item !==
                                                                                                  value,
                                                                                          )
                                                                                        : [
                                                                                              ...current,
                                                                                              value,
                                                                                          ]

                                                                                const newOpts =
                                                                                    [
                                                                                        ...selectedOptions,
                                                                                    ]
                                                                                newOpts[
                                                                                    idx
                                                                                ] =
                                                                                    {
                                                                                        ...newOpts[
                                                                                            idx
                                                                                        ],
                                                                                        rawInput:
                                                                                            nextValues.join(
                                                                                                ", ",
                                                                                            ),
                                                                                    }
                                                                                setSelectedOptions(
                                                                                    newOpts,
                                                                                )
                                                                            }}
                                                                        >
                                                                            {
                                                                                value
                                                                            }
                                                                        </Button>
                                                                    )
                                                                },
                                                            )}
                                                        </div>
                                                    )
                                                })()}

                                                <Input
                                                    placeholder="Hoặc thêm giá trị khác (VD: 37, 38, 39)"
                                                    value={opt.rawInput}
                                                    onChange={(e) => {
                                                        const newOpts = [
                                                            ...selectedOptions,
                                                        ]
                                                        newOpts[idx] = {
                                                            ...newOpts[idx],
                                                            rawInput:
                                                                e.target.value,
                                                        }
                                                        setSelectedOptions(
                                                            newOpts,
                                                        )
                                                    }}
                                                    onKeyDown={(e) => {
                                                        // Prevent Enter from submitting the form
                                                        if (e.key === "Enter") {
                                                            e.preventDefault()
                                                        }
                                                    }}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Chọn nhanh từ giá trị đã cấu
                                                    hình hoặc nhập thêm, phân
                                                    cách bằng dấu phẩy.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    const newOpts =
                                                        selectedOptions.filter(
                                                            (_, i) => i !== idx,
                                                        )
                                                    setSelectedOptions(newOpts)
                                                }}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        className="w-full"
                                        onClick={generateVariants}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />{" "}
                                        Tạo các biến thể
                                    </Button>
                                </div>

                                {/* Computed Variants Table */}
                                {variantFields.length > 0 && (
                                    <div className="rounded-lg border overflow-x-auto">
                                        <Table className="w-full min-w-245 table-fixed">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[16%] whitespace-nowrap">
                                                        Biến thể
                                                    </TableHead>
                                                    <TableHead className="w-[13%] whitespace-nowrap">
                                                        Giá
                                                    </TableHead>
                                                    <TableHead className="w-[13%] whitespace-nowrap">
                                                        Giá gốc
                                                    </TableHead>
                                                    <TableHead className="w-[15%] whitespace-nowrap">
                                                        SKU
                                                    </TableHead>
                                                    <TableHead className="w-[9%] whitespace-nowrap">
                                                        Tồn kho
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {variantFields.map(
                                                    (field, index) => {
                                                        const name =
                                                            field.optionSelections
                                                                .map(
                                                                    (os) =>
                                                                        os.value,
                                                                )
                                                                .join(" / ")

                                                        return (
                                                            <TableRow
                                                                key={
                                                                    field.fieldId
                                                                }
                                                            >
                                                                <TableCell className="font-medium whitespace-normal wrap-break-word align-top">
                                                                    {name}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <FormField
                                                                        control={
                                                                            form.control
                                                                        }
                                                                        name={`variants.${index}.price`}
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <Input
                                                                                className="h-8 w-full min-w-0"
                                                                                inputMode="numeric"
                                                                                placeholder="1.000.000"
                                                                                value={formatVndInput(
                                                                                    field.value,
                                                                                )}
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    field.onChange(
                                                                                        parseVndInput(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        ),
                                                                                    )
                                                                                }
                                                                            />
                                                                        )}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <FormField
                                                                        control={
                                                                            form.control
                                                                        }
                                                                        name={`variants.${index}.compareAtPrice`}
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <Input
                                                                                className="h-8 w-full min-w-0"
                                                                                inputMode="numeric"
                                                                                placeholder="1.200.000"
                                                                                value={formatVndInput(
                                                                                    field.value,
                                                                                )}
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    field.onChange(
                                                                                        parseVndInput(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                            true,
                                                                                        ),
                                                                                    )
                                                                                }
                                                                            />
                                                                        )}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <FormField
                                                                        control={
                                                                            form.control
                                                                        }
                                                                        name={`variants.${index}.sku`}
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <Input
                                                                                className="h-8 w-full min-w-0"
                                                                                {...field}
                                                                            />
                                                                        )}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <FormField
                                                                        control={
                                                                            form.control
                                                                        }
                                                                        name={`variants.${index}.stockQuantity`}
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <Input
                                                                                type="number"
                                                                                className="h-8 w-full min-w-0"
                                                                                {...field}
                                                                            />
                                                                        )}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    },
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <Button type="submit" disabled={loading} size="lg">
                    {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {initialData ? "Lưu thay đổi" : "Tạo sản phẩm"}
                </Button>
            </form>
        </Form>
    )
}

function getInitialValues(data?: Product): ProductFormValues {
    if (!data)
        return {
            name: "",
            description: "",
            categoryId: "",
            brandId: "",
            isActive: true,
            images: [],
            hasVariants: false,
            simplePrice: 0,
            simpleCompareAtPrice: 0,
            simpleSku: "",
            simpleStock: 10,
            variants: [],
        }

    const hasVar =
        data.variants.length > 1 ||
        (data.variants.length === 1 &&
            Object.keys(data.variants[0].attributes).length > 0)

    return {
        name: data.name,
        description: data.description || "",
        categoryId: data.categoryId || "",
        brandId: data.brandId || "",
        isActive: data.isActive,
        images: data.images || [],
        hasVariants: hasVar,
        simplePrice: !hasVar ? data.variants[0]?.price : 0,
        simpleCompareAtPrice: !hasVar
            ? data.variants[0]?.compareAtPrice
            : undefined,
        simpleSku: !hasVar ? data.variants[0]?.sku : "",
        simpleStock: !hasVar ? data.variants[0]?.stockQuantity : 10,
        variants: hasVar
            ? data.variants.map((v) => ({
                  id: v.id, // Map existing ID
                  sku: v.sku,
                  price: v.price,
                  compareAtPrice: v.compareAtPrice,
                  stockQuantity: v.stockQuantity,
                  optionSelections: Object.entries(v.attributes).map(
                      ([k, val]) => ({
                          variantOptionId: k,
                          value: val,
                      }),
                  ),
              }))
            : [],
    }
}
