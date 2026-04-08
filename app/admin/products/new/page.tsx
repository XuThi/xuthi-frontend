import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductForm from '../product-form';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Thêm sản phẩm mới</h1>
          <p className="text-muted-foreground">Tạo sản phẩm mới cho cửa hàng của bạn.</p>
        </div>
      </div>
      <ProductForm />
    </div>
  );
}
