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

export default async function CustomersPage() {
  const { data: customers } = await api.customerBrowse({});

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý khách hàng</h1>
      </div>
      
      <div className="mt-8 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên khách hàng</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cấp độ</TableHead>
              <TableHead>Đơn hàng</TableHead>
              <TableHead>Chi tiêu</TableHead>
              <TableHead>Ngày tham gia</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Chưa có khách hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <span>{c.fullName}</span>
                        {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>
                    <Badge variant={
                        c.tier === 'Gold' ? 'default' : 
                        c.tier === 'Platinum' ? 'secondary' : 
                        'outline'
                    }>
                        {c.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.totalOrders}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.totalSpent)}
                  </TableCell>
                  <TableCell>{new Date(c.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/customers/${c.id}`}>
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
