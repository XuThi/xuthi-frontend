import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

export default async function ProductsPage() {
  const { data: products } = await api.productBrowse({ limit: 50 });

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm
          </Link>
        </Button>
      </div>
      
      <div className="mt-8 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Thương hiệu</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Chưa có sản phẩm nào.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                // Determine price range or single price
                let priceDisplay = "N/A";
                if (product.variants && product.variants.length > 0) {
                  const prices = product.variants.map(v => v.price);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  
                  if (minPrice === maxPrice) {
                    priceDisplay = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minPrice);
                  } else {
                    const min = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minPrice);
                    const max = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(maxPrice);
                    priceDisplay = `${min} - ${max}`;
                  }
                }

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categoryName || '—'}</TableCell>
                    <TableCell>{product.brandName || '—'}</TableCell>
                    <TableCell>{priceDisplay}</TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Hiển thị</Badge>
                      ) : (
                        <Badge variant="secondary">Ẩn</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/products/${product.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
