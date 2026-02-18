import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import SaleCampaignForm from "../sale-campaign-form"

export default function NewSaleCampaignPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/sale-campaigns">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Thêm Sale Campaign</h1>
            </div>

            <SaleCampaignForm />
        </div>
    )
}
