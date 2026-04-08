import Link from 'next/link';
import { Eye } from 'lucide-react';
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
import { getOrderStatusMeta } from "@/lib/admin/presentation";

export default async function OrdersPage() {
  const { data: orders } = await api.orderBrowse();

  return (
    <div className="space-y-4">
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground">
            Theo dõi trạng thái xử lý và thanh toán của từng đơn.
          </p>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã đơn hàng</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Chưa có đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  {(() => {
                    const statusMeta = getOrderStatusMeta(order.status)
                    return (
                      <>
                  <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span>{order.customerName || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusMeta.badgeClass}>
                        {statusMeta.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                  </TableCell>
                      </>
                    )
                  })()}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
