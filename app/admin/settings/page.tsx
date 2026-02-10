import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
      <h1 className="text-2xl font-bold">Cài đặt hệ thống</h1>
      <p className="text-muted-foreground">Tính năng đang được phát triển.</p>
      <Button variant="outline">Quay lại Dashboard</Button>
    </div>
  );
}
