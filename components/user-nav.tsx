"use client";

import { LogOut, User, Package, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

export function UserNav() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial hydration, render a consistent placeholder
  if (!mounted) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <User className="h-5 w-5" />
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
        <div className="h-5 w-5 animate-pulse bg-gray-200 rounded-full" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" asChild>
        <Link href="/auth/login">
          <User className="h-5 w-5" />
        </Link>
      </Button>
    );
  }

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl || ""} alt={displayName} />
            <AvatarFallback>{displayName[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
             <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Tài khoản</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/orders">
                <Package className="mr-2 h-4 w-4" />
                <span>Đơn hàng</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
             <Link href="/admin">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Quản trị</span>
             </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
