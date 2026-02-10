import { notFound } from 'next/navigation';
import ProductForm from '../product-form';
import { api } from '@/lib/api/client';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await api.productGet({ idOrSlug: id });

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chỉnh sửa sản phẩm</h1>
        <p className="text-muted-foreground">Cập nhật thông tin sản phẩm.</p>
      </div>
      <ProductForm initialData={product} />
    </div>
  );
}
