import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import VariantOptionForm from "../variant-option-form";

export default function NewVariantOptionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/variant-options">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Thêm thuộc tính mới</h1>
      </div>
      
      <VariantOptionForm />
    </div>
  );
}
