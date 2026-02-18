"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Pencil, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Voucher, VoucherType } from "@/lib/api/types"

const API_URL = "/api/bff"

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchVouchers = async () => {
            setLoading(true)
            setError(null)
            try {
                const token = localStorage.getItem("xuthi_auth_token")
                const response = await fetch(`${API_URL}/api/vouchers`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    setVouchers(data.vouchers || [])
                } else if (response.status === 401 || response.status === 403) {
                    setError("Bạn không có quyền truy cập danh sách voucher.")
                } else {
                    setError("Không thể tải danh sách voucher.")
                }
            } catch (err) {
                console.error("Failed to fetch vouchers:", err)
                setError("Đã xảy ra lỗi khi tải dữ liệu.")
            } finally {
                setLoading(false)
            }
        }

        fetchVouchers()
    }, [])

    const getVoucherType = (type: Voucher["type"]) => {
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

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3">Đang tải...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className="text-2xl font-bold">Quản lý Voucher</h1>
                <Button asChild>
                    <Link href="/admin/vouchers/new">
                        <Plus className="mr-2 h-4 w-4" /> Thêm Voucher
                    </Link>
                </Button>
            </div>

            <div className="mt-8 rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã Voucher</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Giá trị giảm</TableHead>
                            <TableHead>Đơn tối thiểu</TableHead>
                            <TableHead>Lượt dùng</TableHead>
                            <TableHead>Hạn sử dụng</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">
                                Hành động
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vouchers.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="text-center h-24"
                                >
                                    Chưa có mã giảm giá nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            vouchers.map((v) => {
                                const normalizedType = getVoucherType(v.type)
                                return (
                                    <TableRow key={v.id}>
                                        <TableCell className="font-bold">
                                            {v.code}
                                        </TableCell>
                                        <TableCell>
                                            {normalizedType ===
                                            VoucherType.Percentage
                                                ? "Phần trăm"
                                                : normalizedType ===
                                                    VoucherType.FixedAmount
                                                  ? "Số tiền"
                                                  : "Free Ship"}
                                        </TableCell>
                                        <TableCell>
                                            {normalizedType ===
                                            VoucherType.Percentage
                                                ? `${v.discountValue}%`
                                                : new Intl.NumberFormat(
                                                      "vi-VN",
                                                      {
                                                          style: "currency",
                                                          currency: "VND",
                                                      },
                                                  ).format(v.discountValue)}
                                        </TableCell>
                                        <TableCell>
                                            {v.minimumOrderAmount
                                                ? new Intl.NumberFormat(
                                                      "vi-VN",
                                                      {
                                                          style: "currency",
                                                          currency: "VND",
                                                      },
                                                  ).format(v.minimumOrderAmount)
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {v.currentUsageCount} /{" "}
                                            {v.maxUsageCount || "∞"}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                v.endDate,
                                            ).toLocaleDateString("vi-VN")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    v.isActive
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {v.isActive
                                                    ? "Hoạt động"
                                                    : "Tạm ngưng"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/vouchers/${v.id}`}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
