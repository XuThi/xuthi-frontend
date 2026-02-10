import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import VariantOptionForm from "../variant-option-form";

export default async function EditVariantOptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Since we don't have GetById, we use browsing and finding
  const { data: options } = await api.variantOptionBrowse();
  const option = options.find(o => o.id === id);

  if (!option) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/variant-options">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Sửa thuộc tính: {option.name}</h1>
      </div>
      
      <VariantOptionForm initialData={option} isEdit />
    </div>
  );
}
