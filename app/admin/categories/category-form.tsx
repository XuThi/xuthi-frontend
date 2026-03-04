"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

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

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000"

function getParentId(id: string | null | undefined): string {
    if (!id || id === EMPTY_GUID) return "none"
    return id
}

interface CategoryFormProps {
    initialData?: Category
}

export default function CategoryForm({ initialData }: CategoryFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(
        initialData?.image || null,
    )
    const fileInputRef = useRef<HTMLInputElement>(null)
    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema) as any,
        defaultValues: initialData
            ? {
                  name: initialData.name,
                  urlSlug: initialData.slug,
                  description: initialData.description || "",
                  parentCategoryId: getParentId(initialData.parentCategoryId),
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
                      parentCategoryId: getParentId(
                          initialData.parentCategoryId,
                      ),
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
            let categoryId = initialData?.id

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
                const result = await response.json()
                categoryId = result.id
            }

            // Upload image if selected
            if (imageFile && categoryId) {
                const formData = new FormData()
                formData.append("image", imageFile)
                const imgHeaders: HeadersInit = {}
                if (token) imgHeaders["Authorization"] = `Bearer ${token}`
                const imgRes = await fetch(
                    `${apiUrl}/api/categories/${categoryId}/image`,
                    {
                        method: "POST",
                        headers: imgHeaders,
                        body: formData,
                    },
                )
                if (!imgRes.ok) {
                    toast.warning("Đã lưu danh mục nhưng upload ảnh thất bại")
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

                {/* Image Upload */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Hình ảnh danh mục
                    </label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                setImageFile(file)
                                setImagePreview(URL.createObjectURL(file))
                            }
                        }}
                    />
                    {imagePreview ? (
                        <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                            <Image
                                src={imagePreview}
                                alt="Category preview"
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setImageFile(null)
                                    setImagePreview(null)
                                    if (fileInputRef.current)
                                        fileInputRef.current.value = ""
                                }}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Chọn hình ảnh
                        </button>
                    )}
                </div>

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
