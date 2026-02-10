'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/app/cart/cart-context';
import { Button } from '@/components/ui/button';
import { CreditCard, Truck, MapPin, ShoppingBag, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// TODO: Wtf is this though ? No hardcoding localhost url supposedly to get it from aspire env and get the fucking json file for provices, districts and wards
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7360';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Vietnam provinces/cities data
const provinces = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu', 'Bắc Giang', 'Bắc Kạn', 'Bắc Ninh', 'Bến Tre',
  'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cần Thơ', 'Cao Bằng',
  'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Nội', 'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên',
  'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An',
  'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình',
  'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh',
  'Thái Bình', 'Thái Nguyên', 'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'TP Hồ Chí Minh',
  'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
];

// Sample districts for major cities (simplified)
const districtsByProvince: Record<string, string[]> = {
  'Hà Nội': ['Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa', 'Cầu Giấy', 'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Tây Hồ', 'Bắc Từ Liêm', 'Nam Từ Liêm', 'Hà Đông'],
  'TP Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Thủ Đức'],
  'Đà Nẵng': ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang'],
  'Cần Thơ': ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt'],
};

// Sample wards (simplified)
const wardsByDistrict: Record<string, string[]> = {
  'Quận 1': ['Bến Nghé', 'Bến Thành', 'Cầu Kho', 'Cầu Ông Lãnh', 'Cô Giang', 'Đa Kao', 'Nguyễn Cư Trinh', 'Nguyễn Thái Bình', 'Phạm Ngũ Lão', 'Tân Định'],
  'Quận 3': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10'],
  'Bình Thạnh': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
  'Hoàn Kiếm': ['Hàng Bạc', 'Hàng Bài', 'Hàng Bồ', 'Hàng Buồm', 'Hàng Đào', 'Hàng Gai', 'Hàng Mã', 'Hàng Trống', 'Lý Thái Tổ', 'Phan Chu Trinh'],
  'Ba Đình': ['Cống Vị', 'Điện Biên', 'Đội Cấn', 'Giảng Võ', 'Kim Mã', 'Liễu Giai', 'Ngọc Hà', 'Ngọc Khánh', 'Phúc Xá', 'Quán Thánh', 'Thành Công', 'Trúc Bạch', 'Vĩnh Phúc'],
};

export default function CheckoutPage() {
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{ orderNumber: string; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    notes: '',
    paymentMethod: 'cod',
  });

  // Get available districts and wards based on selection
  const availableDistricts = formData.city ? (districtsByProvince[formData.city] || []) : [];
  const availableWards = formData.district ? (wardsByDistrict[formData.district] || []) : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Pre-fill name from user
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : prev.fullName,
      }));
    }
  }, [user]);

  // Reset district/ward when city changes
  useEffect(() => {
    if (formData.city) {
      setFormData(prev => ({ ...prev, district: '', ward: '' }));
    }
  }, [formData.city]);

  // Reset ward when district changes
  useEffect(() => {
    if (formData.district) {
      setFormData(prev => ({ ...prev, ward: '' }));
    }
  }, [formData.district]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Order success screen
  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Đặt hàng thành công!
            </h2>
            <p className="text-gray-600 mb-2">
              Mã đơn hàng: <strong className="text-blue-600">{orderComplete.orderNumber}</strong>
            </p>
            <p className="text-gray-600 mb-6">
              Tổng tiền: <strong className="text-green-600">{formatCurrency(orderComplete.total)}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Cảm ơn bạn đã mua sắm tại XuThi Store! Chúng tôi sẽ liên hệ để xác nhận đơn hàng.
            </p>
            <div className="space-y-3">
              <Link
                href="/orders"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Xem đơn hàng
              </Link>
              <Link
                href="/"
                className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-500 mb-6">Thêm sản phẩm vào giỏ hàng để thanh toán</p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare checkout request
      const checkoutData = {
        customerId: user?.id || null,
        customerName: formData.fullName,
        customerEmail: user?.email || '',
        customerPhone: formData.phone,
        shippingAddress: formData.address,
        shippingCity: formData.city,
        shippingDistrict: formData.district,
        shippingWard: formData.ward || 'N/A',
        shippingNote: formData.notes || null,
        paymentMethod: formData.paymentMethod === 'cod' ? 0 : 1, // 0 = COD, 1 = BankTransfer
        items: cart.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        voucherCode: null
      };
      
      const response = await fetch(`${API_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(checkoutData),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Clear the cart
        clearCart();
        
        setOrderComplete({
          orderNumber: result.orderNumber,
          total: result.total
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || errorData.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = 30000; // Fixed shipping cost
  const total = subtotal + shipping;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/cart" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại giỏ hàng
      </Link>
      
      <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            {/* Shipping Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Thông tin giao hàng</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên người nhận *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Province/City Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tỉnh/Thành phố *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                    {provinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* District Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quận/Huyện *
                  </label>
                  {availableDistricts.length > 0 ? (
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {availableDistricts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      placeholder="Nhập Quận/Huyện"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>

                {/* Ward Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phường/Xã
                  </label>
                  {availableWards.length > 0 ? (
                    <select
                      name="ward"
                      value={formData.ward}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {availableWards.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="ward"
                      value={formData.ward}
                      onChange={handleChange}
                      placeholder="Nhập Phường/Xã"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ cụ thể *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Số nhà, tên đường"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Phương thức thanh toán</h2>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <Truck className="w-5 h-5 mr-3 text-gray-500" />
                  <div>
                    <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                    <p className="text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</p>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={formData.paymentMethod === 'bank'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <CreditCard className="w-5 h-5 mr-3 text-gray-500" />
                  <div>
                    <span className="font-medium">Chuyển khoản ngân hàng</span>
                    <p className="text-sm text-gray-500">Chuyển khoản trước khi giao hàng</p>
                  </div>
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : `Đặt hàng - ${formatCurrency(total)}`}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Đơn hàng của bạn</h2>
            
            <div className="space-y-3 mb-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.productName} x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phí vận chuyển</span>
                <span>{formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
