'use client';

import Link from 'next/link'; // Import Link
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Settings,
  LogOut,
  List // Import List icon for Categories
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
// ... rest of imports

const links = [
  { name: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
  { name: 'Sản phẩm', href: '/admin/products', icon: Package },
  { name: 'Danh mục', href: '/admin/categories', icon: List }, // Add Categories link
  { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Khách hàng', href: '/admin/customers', icon: Users },
  { name: 'Mã giảm giá', href: '/admin/vouchers', icon: Ticket },
  { name: 'Cấu hình', href: '/admin/settings', icon: Settings },
];

export default function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
      
      <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
      
      <form>
        <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
          <LogOut className="w-6" />
          <div className="hidden md:block">Đăng xuất</div>
        </button>
      </form>
    </>
  );
}
