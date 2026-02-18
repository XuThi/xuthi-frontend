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

export default async function OrdersPage() {
  const { data: orders } = await api.orderBrowse();

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
      </div>
      
      <div className="mt-8 rounded-md border">
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
                  <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span>{order.customerName || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                        order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        order.status === 'Processing' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                        order.status === 'Shipped' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-300' :
                        order.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-300' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-300' :
                        'bg-gray-100 text-gray-700 border-gray-300'
                    }>
                        {order.status}
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
