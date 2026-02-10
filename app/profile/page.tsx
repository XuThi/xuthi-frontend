'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Mail, LogOut, AlertCircle, CheckCircle, Send } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7360';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout, resendVerificationEmail } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setResending(true);
    const result = await resendVerificationEmail(user.email);
    
    if (result.success) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } else {
      alert(result.error || 'Có lỗi xảy ra');
    }
    
    setResending(false);
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.email;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tài khoản của tôi</h1>
      
      {/* Email Verification Banner */}
      {!user.emailConfirmed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800">Email chưa được xác nhận</h3>
            <p className="text-yellow-700 text-sm mt-1">
              Vui lòng xác nhận địa chỉ email <strong>{user.email}</strong> để sử dụng đầy đủ tính năng.
            </p>
            <div className="mt-3 flex items-center gap-3">
              {resendSuccess ? (
                <span className="inline-flex items-center text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Đã gửi! Kiểm tra email của bạn.
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {resending ? 'Đang gửi...' : 'Gửi lại email xác nhận'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Verified Banner */}
      {user.emailConfirmed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">Email đã được xác nhận</span>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{displayName}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Họ tên</p>
                  <p className="font-medium">{displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Hành động</h3>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline"
                onClick={() => router.push('/orders')}
              >
                Xem đơn hàng
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
