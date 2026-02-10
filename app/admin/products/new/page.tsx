import ProductForm from '../product-form';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thêm sản phẩm mới</h1>
        <p className="text-muted-foreground">Tạo sản phẩm mới cho cửa hàng của bạn.</p>
      </div>
      <ProductForm />
    </div>
  );
}
