"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api/client"
import { Category } from "@/lib/api/types"

const categorySchema = z.object({
    name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự"),
    urlSlug: z.string().min(2, "Slug phải có ít nhất 2 ký tự"),
    description: z.string().optional(),
    parentCategoryId: z.string().optional(),
    sortOrder: z.coerce.number().default(0),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
    initialData?: Category
}

export default function CategoryForm({ initialData }: CategoryFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema) as any,
        defaultValues: initialData
            ? {
                  name: initialData.name,
                  urlSlug: initialData.slug,
                  description: initialData.description || "",
                  parentCategoryId: initialData.parentCategoryId || "none",
                  sortOrder: initialData.sortOrder || 0,
              }
            : {
                  name: "",
                  urlSlug: "",
                  description: "",
                  parentCategoryId: "none",
                  sortOrder: 0,
              },
    })

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.categoryBrowse({ limit: 100 })
                // Filter out current category to prevent self-parenting
                const filtered = initialData
                    ? res.data.filter((c) => c.id !== initialData.id)
                    : res.data
                setCategories(filtered)
            } catch (error) {
                console.error("Failed to fetch categories:", error)
            }
        }
        fetchCategories()
    }, [initialData])

    useEffect(() => {
        form.reset(
            initialData
                ? {
                      name: initialData.name,
                      urlSlug: initialData.slug,
                      description: initialData.description || "",
                      parentCategoryId: initialData.parentCategoryId || "none",
                      sortOrder: initialData.sortOrder || 0,
                  }
                : {
                      name: "",
                      urlSlug: "",
                      description: "",
                      parentCategoryId: "none",
                      sortOrder: 0,
                  },
        )
    }, [initialData, form])

    const onSubmit = async (data: CategoryFormValues) => {
        try {
            setLoading(true)

            const payload = {
                name: data.name,
                urlSlug: data.urlSlug,
                description: data.description,
                parentCategoryId:
                    data.parentCategoryId === "none"
                        ? null
                        : data.parentCategoryId || null,
                sortOrder: data.sortOrder,
            }

            // Get auth token for admin operations
            const token =
                typeof window !== "undefined"
                    ? localStorage.getItem("xuthi_auth_token")
                    : null
            const headers: HeadersInit = {
                "Content-Type": "application/json",
            }
            if (token) {
                headers["Authorization"] = `Bearer ${token}`
            }

            const apiUrl = "/api/bff"

            if (initialData) {
                // Edit
                const response = await fetch(
                    `${apiUrl}/api/categories/${initialData.id}`,
                    {
                        method: "PUT",
                        headers,
                        body: JSON.stringify(payload),
                    },
                )
                if (!response.ok) {
                    const err = await response.json().catch(() => ({}))
                    throw new Error(
                        err.message ||
                            `Failed to update category: ${response.status}`,
                    )
                }
            } else {
                // Create
                const response = await fetch(`${apiUrl}/api/categories`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                })
                if (!response.ok) {
                    const err = await response.json().catch(() => ({}))
                    throw new Error(
                        err.message ||
                            `Failed to create category: ${response.status}`,
                    )
                }
            }

            toast.success(
                initialData ? "Đã cập nhật danh mục" : "Đã tạo danh mục",
            )
            router.push("/admin/categories")
            router.refresh()
        } catch (error: any) {
            console.error("Submit error:", error)
            toast.error(error.message || "Có lỗi xảy ra")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 w-full max-w-2xl"
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên danh mục</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ví dụ: Áo sơ mi"
                                    {...field}
                                    onChange={(e) => {
                                        field.onChange(e)
                                        if (!initialData) {
                                            const slug = e.target.value
                                                .normalize("NFD")
                                                .replace(/\p{Diacritic}/gu, "")
                                                .toLowerCase()
                                                .replace(/[^a-z0-9]+/g, "-")
                                                .replace(/(^-|-$)+/g, "")
                                            form.setValue("urlSlug", slug)
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
                    name="urlSlug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL Slug</FormLabel>
                            <FormControl>
                                <Input placeholder="danh-muc" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Mô tả danh mục..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="parentCategoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Danh mục cha</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value || "none"}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn danh mục cha (không bắt buộc)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">
                                        -- Không --
                                    </SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Thứ tự hiển thị</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={loading}>
                    {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {initialData ? "Lưu thay đổi" : "Tạo danh mục"}
                </Button>
            </form>
        </Form>
    )
}
