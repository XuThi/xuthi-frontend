import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";

export default async function VariantOptionsPage() {
  const { data: options } = await api.variantOptionBrowse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thuộc tính sản phẩm</h1>
          <p className="text-muted-foreground">Quản lý các thuộc tính dùng cho biến thể (Size, Color...).</p>
        </div>
        <Button asChild>
          <Link href="/admin/variant-options/new">
            <Plus className="mr-2 h-4 w-4" />
             Thêm thuộc tính
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Kiểu hiển thị</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Chưa có thuộc tính nào.
                </TableCell>
              </TableRow>
            ) : (
              options.map((opt) => (
                <TableRow key={opt.id}>
                  <TableCell className="font-medium">{opt.name}</TableCell>
                  <TableCell className="font-mono text-xs">{opt.id}</TableCell>
                  <TableCell>
                      <Badge variant="outline">{opt.displayType}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                      {opt.values.join(", ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/variant-options/${opt.id}`}>Sửa</Link>
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
