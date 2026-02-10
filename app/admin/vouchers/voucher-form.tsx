'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Voucher, VoucherType } from '@/lib/api/types';

const voucherSchema = z.object({
  code: z.string().min(3, 'Mã giảm giá phải có ít nhất 3 ký tự').toUpperCase(),
  description: z.string().optional(),
  type: z.coerce.number(), // VoucherType enum
  discountValue: z.coerce.number().min(0),
  minimumOrderAmount: z.coerce.number().min(0).optional(),
  maxUsageCount: z.coerce.number().min(0).optional(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean().default(true),
});

type VoucherFormValues = z.infer<typeof voucherSchema>;

interface VoucherFormProps {
  initialData?: Voucher;
}

export default function VoucherForm({ initialData }: VoucherFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema) as any,
    defaultValues: initialData
      ? {
          code: initialData.code,
          description: initialData.description || '',
          type: typeof initialData.type === 'string' ? VoucherType[initialData.type as keyof typeof VoucherType] : initialData.type,
          discountValue: initialData.discountValue,
          minimumOrderAmount: initialData.minimumOrderAmount || 0,
          maxUsageCount: initialData.maxUsageCount || 0,
          startDate: new Date(initialData.startDate),
          endDate: new Date(initialData.endDate),
          isActive: initialData.isActive,
        }
      : {
          code: '',
          description: '',
          type: VoucherType.FixedAmount,
          discountValue: 0,
          minimumOrderAmount: 0,
          maxUsageCount: 100,
          startDate: new Date(),
          endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // +30 days
          isActive: true,
        },
  });

  const onSubmit = async (data: VoucherFormValues) => {
    try {
      setLoading(true);
      
      const payload = {
        ...data,
        type: Number(data.type), // Ensure enum value
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        // Simple default values for now
        isValid: true,
        canCombineWithOtherVouchers: false,
        canCombineWithSalePrice: false,
        firstPurchaseOnly: false,
        currentUsageCount: 0
      };

      if (initialData) {
         // Update not fully supported by stub usually, but assuming we have endpoint
         // await api.voucherUpdate(initialData.id, payload);
          alert("Updates logic here");
      } else {
        const response = await fetch('/api/vouchers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to create voucher');
      }

      router.push('/admin/vouchers');
      router.refresh();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Mã giảm giá</FormLabel>
                <FormControl>
                    <Input placeholder="Vd: SUMMER2024" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Loại giảm giá</FormLabel>
                 <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value.toString()}
                    value={field.value.toString()}
                >
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value={VoucherType.Percentage.toString()}>Phần trăm (%)</SelectItem>
                    <SelectItem value={VoucherType.FixedAmount.toString()}>Số tiền cố định (VNĐ)</SelectItem>
                    <SelectItem value={VoucherType.FreeShipping.toString()}>Miễn phí vận chuyển</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Mô tả</FormLabel>
                <FormControl>
                <Textarea placeholder="Mô tả chi tiết..." {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        
         <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Giá trị giảm</FormLabel>
                    <FormControl>
                    <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>VNĐ hoặc % tùy loại</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="minimumOrderAmount"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Đơn hàng tối thiểu</FormLabel>
                    <FormControl>
                    <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
         </div>

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Ngày bắt đầu</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
                        ) : (
                            <span>Chọn ngày</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Ngày kết thúc</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
                        ) : (
                            <span>Chọn ngày</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                <FormLabel className="text-base">Kích hoạt</FormLabel>
                <FormDescription>
                    Voucher có thể sử dụng được ngay
                </FormDescription>
                </div>
                <FormControl>
                <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                />
                </FormControl>
            </FormItem>
            )}
        />

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Lưu thay đổi' : 'Tạo Voucher'}
        </Button>
      </form>
    </Form>
  );
}
