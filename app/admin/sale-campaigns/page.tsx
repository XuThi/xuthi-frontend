"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
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
import { api } from "@/lib/api/client"
import type { SaleCampaign } from "@/lib/api/types"

export default function SaleCampaignsPage() {
    const [campaigns, setCampaigns] = useState<SaleCampaign[]>([])
    const [loading, setLoading] = useState(true)

    const loadCampaigns = async () => {
        setLoading(true)
        const result = await api.saleCampaignBrowse({ pageSize: 100 })
        setCampaigns(result.data)
        setLoading(false)
    }

    useEffect(() => {
        loadCampaigns()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn chắc chắn muốn xóa sale campaign này?")) return
        const success = await api.saleCampaignDelete(id)
        if (!success) {
            alert("Không thể xóa sale campaign.")
            return
        }
        await loadCampaigns()
    }

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3">Đang tải...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Sale Campaigns</h1>
                    <p className="text-muted-foreground">
                        Quản lý chương trình giảm giá theo chiến dịch.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/sale-campaigns/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm Campaign
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên</TableHead>
                            <TableHead>Thời gian</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead className="text-right">
                                Hành động
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center h-24"
                                >
                                    Chưa có campaign nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            campaigns.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell className="font-medium">
                                        {campaign.name}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            campaign.startDate,
                                        ).toLocaleDateString("vi-VN")}{" "}
                                        -{" "}
                                        {new Date(
                                            campaign.endDate,
                                        ).toLocaleDateString("vi-VN")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                campaign.isRunning
                                                    ? "default"
                                                    : campaign.isUpcoming
                                                      ? "secondary"
                                                      : "outline"
                                            }
                                        >
                                            {campaign.isRunning
                                                ? "Đang diễn ra"
                                                : campaign.isUpcoming
                                                  ? "Sắp diễn ra"
                                                  : "Đã kết thúc"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{campaign.itemCount}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/sale-campaigns/${campaign.id}`}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() =>
                                                    handleDelete(campaign.id)
                                                }
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
