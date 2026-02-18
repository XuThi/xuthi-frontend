"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

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
import { api } from "@/lib/api/client"
import { Brand } from "@/lib/api/types"

const brandSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    urlSlug: z.string().min(2, "Slug must be at least 2 characters"),
    description: z.string().optional(),
})

type BrandFormValues = z.infer<typeof brandSchema>

interface BrandFormProps {
    initialData?: Brand
}

export default function BrandForm({ initialData }: BrandFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const form = useForm<BrandFormValues>({
        resolver: zodResolver(brandSchema),
        defaultValues: initialData
            ? {
                  name: initialData.name,
                  urlSlug: initialData.urlSlug || "",
                  description: initialData.description || "",
              }
            : {
                  name: "",
                  urlSlug: "",
                  description: "",
              },
    })

    const onSubmit = async (data: BrandFormValues) => {
        try {
            setLoading(true)
            if (initialData) {
                await api.brandUpdate(initialData.id, data)
            } else {
                await api.brandCreate(data)
            }
            router.push("/admin/brands")
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 w-full max-w-lg"
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tên thương hiệu</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Nike, Adidas..."
                                    {...field}
                                    onChange={(e) => {
                                        field.onChange(e)
                                        // Auto-generate slug if creating new
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
                                <Input placeholder="nike" {...field} />
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
                                    placeholder="Mô tả ngắn..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={loading}>
                    {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {initialData ? "Lưu thay đổi" : "Tạo thương hiệu"}
                </Button>
            </form>
        </Form>
    )
}
