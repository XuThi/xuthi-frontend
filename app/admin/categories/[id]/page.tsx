import { notFound } from 'next/navigation';
import CategoryForm from '../category-form';
import { api } from '@/lib/api/client';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await api.categoryGet({ idOrSlug: id });

  if (!category) {
    notFound();
  }

  // Need to cast CategoryWithProducts to Category as Form expects Category
  // But wait, CategoryWithProducts extends Category
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chỉnh sửa danh mục</h1>
      </div>
      <CategoryForm initialData={category} />
    </div>
  );
}
