import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from '@/lib/api/client';
import { VoucherType } from '@/lib/api/types';

export default async function VouchersPage() {
  const { data: vouchers } = await api.voucherBrowse();

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
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  Chưa có mã giảm giá nào.
                </TableCell>
              </TableRow>
            ) : (
              vouchers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-bold">{v.code}</TableCell>
                  <TableCell>
                    {v.type === VoucherType.Percentage || v.type === 'Percentage' ? 'Phần trăm' :
                     v.type === VoucherType.FixedAmount || v.type === 'FixedAmount' ? 'Số tiền' : 
                     'Free Ship'}
                  </TableCell>
                  <TableCell>
                     {v.type === VoucherType.Percentage || v.type === 'Percentage' 
                        ? `${v.discountValue}%`
                        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.discountValue)
                     }
                  </TableCell>
                  <TableCell>
                    {v.minimumOrderAmount 
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.minimumOrderAmount) 
                        : '-'}
                  </TableCell>
                  <TableCell>
                    {v.currentUsageCount} / {v.maxUsageCount || '∞'}
                  </TableCell>
                  <TableCell>{new Date(v.endDate).toLocaleDateString('vi-VN')}</TableCell>
                   <TableCell>
                    <Badge variant={v.isActive ? "default" : "secondary"}>
                      {v.isActive ? "Hoạt động" : "Tạm ngưng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/vouchers/${v.id}`}>
                        <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
