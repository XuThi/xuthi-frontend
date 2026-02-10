import CategoryForm from '../category-form';

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thêm danh mục mới</h1>
      </div>
      <CategoryForm />
    </div>
  );
}
