"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api/client";

// Define schema locally since we don't have it in types yet
const variantOptionSchema = z.object({
    id: z.string().min(2).regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with hyphens"),
    name: z.string().min(2),
    displayType: z.string(),
    values: z.array(z.object({
        value: z.string().min(1)
    })).min(1, "At least one value is required")
});

type VariantOptionFormValues = z.infer<typeof variantOptionSchema>;

interface VariantOptionFormProps {
    initialData?: {
        id: string;
        name: string;
        displayType: string;
        values: string[];
    };
    isEdit?: boolean;
}

function toSlugId(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
}

export default function VariantOptionForm({ initialData, isEdit }: VariantOptionFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<VariantOptionFormValues>({
        resolver: zodResolver(variantOptionSchema),
        defaultValues: initialData
            ? {
                  id: initialData.id,
                  name: initialData.name,
                  displayType: initialData.displayType,
                  values: initialData.values.map(v => ({ value: v })),
              }
            : {
                  id: "",
                  name: "",
                  displayType: "dropdown",
                  values: [{ value: "" }],
              },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "values",
    });

    const onSubmit = async (data: VariantOptionFormValues) => {
        try {
            setLoading(true);
            const payload = {
                ...data,
                values: data.values.map(v => v.value)
            };

            if (isEdit) {
                await api.variantOptionUpdate(data.id, {
                    name: data.name,
                    displayType: data.displayType,
                    values: payload.values
                });
            } else {
                await api.variantOptionCreate(payload);
            }
            router.push("/admin/variant-options");
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-lg">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên thuộc tính</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Kích thước, Màu sắc..." 
                                    {...field} 
                                    onChange={(e) => {
                                        field.onChange(e);
                                        if (!isEdit) {
                                            const id = toSlugId(e.target.value);
                                            form.setValue("id", id);
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mã định danh (ID)</FormLabel>
                            <FormControl>
                                <Input placeholder="size, color..." {...field} disabled={isEdit} />
                            </FormControl>
                            <FormDescription>Dùng làm khóa duy nhất (không thể sửa sau khi tạo)</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="displayType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kiểu hiển thị</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn kiểu hiển thị" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="dropdown">Dropdown (Danh sách thả xuống)</SelectItem>
                                    <SelectItem value="buttons">Buttons (Nút chọn)</SelectItem>
                                    <SelectItem value="color">Color Swatch (Màu sắc)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel>Giá trị tùy chọn</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })}>
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm giá trị
                        </Button>
                    </div>
                    
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                             <FormField
                                control={form.control}
                                name={`values.${index}.value`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input placeholder={`Giá trị ${index + 1}`} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? "Lưu thay đổi" : "Tạo thuộc tính"}
                </Button>
            </form>
        </Form>
    );
}
