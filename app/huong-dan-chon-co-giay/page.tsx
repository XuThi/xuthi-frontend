import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hướng dẫn chọn size giày | XuThi Store",
  description: "Hướng dẫn cách đo và chọn size giày phù hợp với bàn chân của bạn tại XuThi Store",
};

export default function ShoeSizeGuidePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Hướng dẫn chọn size giày</h1>

      <blockquote className="border-l-4 border-primary pl-4 italic text-lg text-muted-foreground mb-8">
        Để biết cỡ chân của bạn phù hợp với Size giày bao nhiêu của XuThi, bạn hãy thực hiện
        cách đo như sau.
      </blockquote>

      <hr className="my-8" />

      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Bước 1</h2>
          <p className="mb-4">
            Đặt bàn chân lên tờ giấy trắng, rồi dùng bút vẽ bo hết bàn chân (để chính xác thì
            bạn phải đặt bút thẳng đứng và vuông góc với tờ giấy).
          </p>
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/xuthi-6f838.appspot.com/o/cach-do-size-giay-2.webp?alt=media&token=e6e0fe80-d52b-4035-bb00-a08b1723ee30"
              alt="Cách đo size giày - Bước 1"
              fill
              className="object-contain bg-white"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Bước 2</h2>
          <p className="mb-4">
            Sau khi đo xong bạn so sánh với hình dưới đây để biết size giày bạn nhé!
          </p>
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/xuthi-6f838.appspot.com/o/z5439768381427_93de4527b45ecdd35288040eea2e3d5f.jpg?alt=media&token=7ca86ac0-fe9b-455f-a155-bc71b3510f9f"
              alt="Bảng size giày XuThi"
              fill
              className="object-contain bg-white"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        </div>
      </section>

      <div className="mt-10 p-6 bg-muted/50 rounded-2xl">
        <h3 className="font-semibold mb-2">💡 Mẹo nhỏ</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Nên đo chân vào buổi chiều hoặc tối khi chân hơi phồng lên — đây là kích thước thực tế nhất.</li>
          <li>Đo cả hai chân và chọn kích thước của chân lớn hơn.</li>
          <li>Nếu bạn ở giữa hai size, hãy chọn size lớn hơn.</li>
        </ul>
      </div>
    </main>
  );
}
