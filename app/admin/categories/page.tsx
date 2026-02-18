import Link from "next/link"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api/client"
import DeleteCategoryButton from "./delete-category-button"

export default async function CategoriesPage() {
    const { data: categories } = await api.categoryBrowse({ limit: 100 })

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
                <Button asChild>
                    <Link href="/admin/categories/new">
                        <Plus className="mr-2 h-4 w-4" /> Thêm danh mục
                    </Link>
                </Button>
            </div>

            <div className="mt-8 rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Thứ tự</TableHead>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead className="text-right">
                                Hành động
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center h-24"
                                >
                                    Chưa có danh mục nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        {category.name}
                                    </TableCell>
                                    <TableCell>{category.slug}</TableCell>
                                    <TableCell>{category.sortOrder}</TableCell>
                                    <TableCell>
                                        {category.productCount || 0}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/categories/${category.id}`}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <DeleteCategoryButton
                                                id={category.id}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
