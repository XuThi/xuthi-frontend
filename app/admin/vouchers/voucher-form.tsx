"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

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
import { Voucher, VoucherType } from "@/lib/api/types"

const voucherSchema = z.object({
    code: z
        .string()
        .min(3, "Mã giảm giá phải có ít nhất 3 ký tự")
        .toUpperCase(),
    description: z.string().optional(),
    type: z.coerce.number(), // VoucherType enum
    discountValue: z.coerce.number().min(0),
    minimumOrderAmount: z.coerce.number().min(0).optional(),
    maxUsageCount: z.coerce.number().min(0).optional(),
    startDate: z.date(),
    endDate: z.date(),
    isActive: z.boolean().default(true),
})

type VoucherFormValues = z.infer<typeof voucherSchema>

interface VoucherFormProps {
    initialData?: Voucher
}

function parseVoucherType(type: Voucher["type"]): VoucherType {
    if (type === VoucherType.Percentage || type === "Percentage") {
        return VoucherType.Percentage
    }
    if (type === VoucherType.FixedAmount || type === "FixedAmount") {
        return VoucherType.FixedAmount
    }
    if (type === VoucherType.FreeShipping || type === "FreeShipping") {
        return VoucherType.FreeShipping
    }
    return VoucherType.FixedAmount
}

function formatNumberInput(value: number | undefined) {
    if (value === undefined || Number.isNaN(value)) {
        return ""
    }
    return new Intl.NumberFormat("vi-VN").format(value)
}

function parseNumberInput(value: string) {
    const cleaned = value.replace(/[^\d]/g, "")
    if (!cleaned) {
        return 0
    }
    return Number(cleaned)
}

function dateToInputValue(value: Date | undefined) {
    if (!value) return ""
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

export default function VoucherForm({ initialData }: VoucherFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [discountInput, setDiscountInput] = useState(
        formatNumberInput(initialData?.discountValue),
    )
    const [minimumOrderInput, setMinimumOrderInput] = useState(
        formatNumberInput(initialData?.minimumOrderAmount || 0),
    )
    const isInitialUnlimited = !initialData?.maxUsageCount || initialData.maxUsageCount === 0
    const [unlimitedUsage, setUnlimitedUsage] = useState(isInitialUnlimited)
    const [maxUsageInput, setMaxUsageInput] = useState(
        isInitialUnlimited ? "" : formatNumberInput(initialData?.maxUsageCount || 100),
    )

    const form = useForm<VoucherFormValues>({
        resolver: zodResolver(voucherSchema) as any,
        defaultValues: initialData
            ? {
                  code: initialData.code,
                  description: initialData.description || "",
                  type: parseVoucherType(initialData.type),
                  discountValue: initialData.discountValue,
                  minimumOrderAmount: initialData.minimumOrderAmount || 0,
                  maxUsageCount: initialData.maxUsageCount || 0,
                  startDate: new Date(initialData.startDate),
                  endDate: new Date(initialData.endDate),
                  isActive: initialData.isActive,
              }
            : {
                  code: "",
                  description: "",
                  type: VoucherType.FixedAmount,
                  discountValue: 0,
                  minimumOrderAmount: 0,
                  maxUsageCount: 0,
                  startDate: new Date(),
                  endDate: new Date(
                      new Date().setDate(new Date().getDate() + 30),
                  ), // +30 days
                  isActive: true,
              },
    })

    const watchedType = form.watch("type")
    const isFreeShipping = Number(watchedType) === VoucherType.FreeShipping

    // Reset discount value when switching to FreeShipping
    useEffect(() => {
        if (isFreeShipping) {
            form.setValue("discountValue", 0)
            setDiscountInput("")
        }
    }, [isFreeShipping, form])

    const getDiscountLabel = () => {
        const t = Number(watchedType)
        if (t === VoucherType.Percentage) return "Giá trị giảm (%)"
        if (t === VoucherType.FixedAmount) return "Giá trị giảm (VNĐ)"
        return "Giá trị giảm"
    }

    const getDiscountDescription = () => {
        const t = Number(watchedType)
        if (t === VoucherType.Percentage) return "Nhập số phần trăm, vd: 10 = giảm 10%"
        if (t === VoucherType.FixedAmount) return "Nhập số tiền giảm trực tiếp"
        return "Không cần nhập cho loại miễn phí vận chuyển"
    }

    const onSubmit = async (data: VoucherFormValues) => {
        try {
            setLoading(true)

            const payload = {
                ...data,
                type: Number(data.type), // Ensure enum value
                startDate: data.startDate.toISOString(),
                endDate: data.endDate.toISOString(),
                // Simple default values for now
                isValid: true,
                canCombineWithOtherVouchers: false,
                canCombineWithSalePrice: false,
                firstPurchaseOnly: false,
                currentUsageCount: 0,
            }

            const token = localStorage.getItem("xuthi_auth_token")
            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }

            if (initialData) {
                const response = await fetch(
                    `/api/bff/api/vouchers/${initialData.id}`,
                    {
                        method: "PUT",
                        headers,
                        body: JSON.stringify(payload),
                    },
                )
                if (!response.ok) throw new Error("Failed to update voucher")
            } else {
                const response = await fetch("/api/bff/api/vouchers", {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                })
                if (!response.ok) throw new Error("Failed to create voucher")
            }

            toast.success(
                initialData ? "Đã cập nhật voucher" : "Đã tạo voucher",
            )
            router.push("/admin/vouchers")
            router.refresh()
        } catch (error) {
            console.error("Submit error:", error)
            toast.error(
                "Không thể lưu voucher. Vui lòng kiểm tra quyền truy cập.",
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 w-full max-w-2xl"
            >
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã giảm giá</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Vd: SUMMER2024"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Loại giảm giá</FormLabel>
                                <Select
                                    onValueChange={(v) => field.onChange(Number(v))}
                                    defaultValue={field.value.toString()}
                                    value={field.value.toString()}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn loại" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem
                                            value={VoucherType.Percentage.toString()}
                                        >
                                            Phần trăm (%)
                                        </SelectItem>
                                        <SelectItem
                                            value={VoucherType.FixedAmount.toString()}
                                        >
                                            Số tiền cố định (VNĐ)
                                        </SelectItem>
                                        <SelectItem
                                            value={VoucherType.FreeShipping.toString()}
                                        >
                                            Miễn phí vận chuyển
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Mô tả chi tiết..."
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
                        name="discountValue"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{getDiscountLabel()}</FormLabel>
                                <FormControl>
                                    <Input
                                        value={discountInput}
                                        inputMode="numeric"
                                        disabled={isFreeShipping}
                                        placeholder={isFreeShipping ? "Không cần nhập" : "Nhập giá trị"}
                                        onChange={(e) => {
                                            const parsed = parseNumberInput(
                                                e.target.value,
                                            )
                                            field.onChange(parsed)
                                            setDiscountInput(
                                                formatNumberInput(parsed),
                                            )
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>
                                    {getDiscountDescription()}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="minimumOrderAmount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Đơn hàng tối thiểu</FormLabel>
                                <FormControl>
                                    <Input
                                        value={minimumOrderInput}
                                        inputMode="numeric"
                                        onChange={(e) => {
                                            const parsed = parseNumberInput(
                                                e.target.value,
                                            )
                                            field.onChange(parsed)
                                            setMinimumOrderInput(
                                                formatNumberInput(parsed),
                                            )
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="maxUsageCount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Lượt sử dụng tối đa</FormLabel>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={unlimitedUsage}
                                        onChange={(e) => {
                                            const checked = e.target.checked
                                            setUnlimitedUsage(checked)
                                            if (checked) {
                                                field.onChange(0)
                                                setMaxUsageInput("")
                                            } else {
                                                field.onChange(100)
                                                setMaxUsageInput(formatNumberInput(100))
                                            }
                                        }}
                                    />
                                    Không giới hạn
                                </label>
                                {!unlimitedUsage && (
                                    <FormControl>
                                        <Input
                                            value={maxUsageInput}
                                            inputMode="numeric"
                                            placeholder="Nhập số lượt sử dụng"
                                            onChange={(e) => {
                                                const parsed = parseNumberInput(
                                                    e.target.value,
                                                )
                                                field.onChange(parsed)
                                                setMaxUsageInput(
                                                    formatNumberInput(parsed),
                                                )
                                            }}
                                        />
                                    </FormControl>
                                )}
                            </div>
                            <FormDescription>
                                {unlimitedUsage
                                    ? "Voucher có thể sử dụng không giới hạn"
                                    : "Số lần voucher có thể được sử dụng"}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ngày bắt đầu</FormLabel>
                                <FormControl>
                                    <Input
                                        type="datetime-local"
                                        value={dateToInputValue(field.value)}
                                        onChange={(e) =>
                                            field.onChange(
                                                new Date(e.target.value),
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
                        name="endDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ngày kết thúc</FormLabel>
                                <FormControl>
                                    <Input
                                        type="datetime-local"
                                        value={dateToInputValue(field.value)}
                                        onChange={(e) =>
                                            field.onChange(
                                                new Date(e.target.value),
                                            )
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                    Kích hoạt
                                </FormLabel>
                                <FormDescription>
                                    Voucher có thể sử dụng được ngay
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

                <Button type="submit" disabled={loading}>
                    {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {initialData ? "Lưu thay đổi" : "Tạo Voucher"}
                </Button>
            </form>
        </Form>
    )
}
