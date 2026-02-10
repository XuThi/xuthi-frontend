'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const userId = searchParams.get('userId');
      const token = searchParams.get('token');

      if (!userId || !token) {
        setStatus('error');
        setMessage('Link xác nhận không hợp lệ. Vui lòng kiểm tra lại email của bạn.');
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/verify-email?userId=${userId}&token=${encodeURIComponent(token)}`,
          { method: 'GET' }
        );

        const data = await response.json();

        if (response.ok) {
          if (data.alreadyVerified) {
            setStatus('already-verified');
            setMessage('Email của bạn đã được xác nhận trước đó.');
          } else {
            setStatus('success');
            setMessage('Email của bạn đã được xác nhận thành công!');
            
            // Update the token if a new one was returned
            if (data.token) {
              localStorage.setItem('xuthi_auth_token', data.token);
              refreshUser();
            }
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Xác nhận email thất bại. Link có thể đã hết hạn.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    };

    verifyEmail();
  }, [searchParams, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Đang xác nhận email...
              </h2>
              <p className="text-gray-600">
                Vui lòng đợi trong giây lát
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Xác nhận thành công!
              </h2>
              <p className="text-gray-600 mb-8">
                {message}
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Bắt đầu mua sắm
              </Link>
            </>
          )}

          {status === 'already-verified' && (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Email đã được xác nhận
              </h2>
              <p className="text-gray-600 mb-8">
                {message}
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tiếp tục mua sắm
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Xác nhận thất bại
              </h2>
              <p className="text-gray-600 mb-8">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/login"
                  className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Đăng nhập
                </Link>
                <button
                  onClick={() => router.push('/auth/resend-verification')}
                  className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Gửi lại email xác nhận
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
