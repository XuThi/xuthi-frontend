import { notFound } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await api.customerGet({ id });

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.fullName}</h1>
          <p className="text-muted-foreground">
             Tham gia ngày {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <Badge className="text-base px-4 py-1">
            {customer.tier}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className=" space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="text-sm font-medium">Email</div>
                        <div className="text-muted-foreground">{customer.email}</div>
                    </div>
                    <div>
                        <div className="text-sm font-medium">Số điện thoại</div>
                        <div className="text-muted-foreground">{customer.phone || 'Chưa cập nhật'}</div>
                    </div>
                    <div>
                        <div className="text-sm font-medium">Ngày sinh</div>
                        <div className="text-muted-foreground">
                            {customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium">Giới tính</div>
                        <div className="text-muted-foreground">{customer.gender || 'Chưa cập nhật'}</div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Chỉ số mua sắm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span>Tổng chi tiêu</span>
                        <span className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Số đơn hàng</span>
                        <span className="font-bold">{customer.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Điểm tích lũy</span>
                        <span className="font-bold">{customer.loyaltyPoints}</span>
                    </div>
                    <div className="flex justify-between">
                         <span>Giảm giá hạng thành viên</span>
                         <span className="font-bold">{customer.tierDiscountPercentage}%</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Địa chỉ ({customer.addresses.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {customer.addresses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Chưa có địa chỉ nào.</p>
                    ) : (
                        customer.addresses.map((addr) => (
                            <div key={addr.id} className="border-b last:border-0 pb-2 last:pb-0">
                                <div className="font-medium flex items-center gap-2">
                                    {addr.label}
                                    {addr.isDefault && <Badge variant="secondary" className="text-[10px]">Mặc định</Badge>}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {addr.recipientName} - {addr.phone}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {addr.address}, {addr.ward}, {addr.district}, {addr.city}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
