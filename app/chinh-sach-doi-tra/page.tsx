import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách đổi trả | XuThi Store",
  description: "Chính sách đổi trả sản phẩm giày dép tại XuThi Store",
};

export default function ReturnPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-2 text-center">CHÍNH SÁCH ĐỔI TRẢ</h1>
      <p className="text-center text-muted-foreground mb-8">
        Áp dụng cho toàn bộ sản phẩm giày dép của XuThi.
      </p>

      <div className="bg-muted/30 rounded-2xl p-6 mb-8 text-sm">
        <p>
          <span className="underline">Đối tượng khách hàng:</span> Tất cả khách hàng sử dụng
          dịch vụ tại{" "}
          <a href="https://www.xuthi.com" className="font-semibold text-primary hover:underline">
            www.xuthi.com
          </a>
        </p>
      </div>

      <div className="space-y-8">
        {/* Nguyên giá */}
        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Đổi / trả hàng <span className="text-primary">nguyên giá</span>
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-semibold shrink-0">Đổi hàng:</span>
              <span>Trong vòng <strong>30 ngày</strong> kể từ ngày khách hàng nhận được sản phẩm.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold shrink-0">Trả hàng:</span>
              <span>Trong vòng <strong>30 ngày</strong> kể từ ngày khách hàng nhận được sản phẩm.</span>
            </li>
          </ul>
        </section>

        {/* Khuyến mãi */}
        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Đổi / trả hàng <span className="text-primary">khuyến mãi</span>
            <span className="text-sm font-normal text-muted-foreground ml-2">(áp dụng cho giá sau giảm)</span>
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-semibold shrink-0">Đổi hàng:</span>
              <span>Trong vòng <strong>07 ngày</strong> kể từ ngày khách hàng nhận được sản phẩm.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold shrink-0">Trả hàng:</span>
              <span>Trong vòng <strong>07 ngày</strong> kể từ ngày khách hàng nhận được sản phẩm.</span>
            </li>
          </ul>
        </section>

        {/* Mã khuyến mãi */}
        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Đổi / trả hàng <span className="text-primary">mua bằng mã khuyến mãi</span>
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-semibold shrink-0">Đổi hàng:</span>
              <span>Áp dụng theo quy định đổi trả hàng khuyến mãi.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold shrink-0">Trả hàng:</span>
              <span>Áp dụng theo quy định đổi trả hàng khuyến mãi.</span>
            </li>
          </ul>
        </section>

        {/* Hàng tặng */}
        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Đổi / trả hàng <span className="text-primary">tặng</span>
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-semibold shrink-0">Đổi hàng:</span>
              <span>Trong vòng <strong>07 ngày</strong> kể từ ngày khách hàng nhận được sản phẩm.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold shrink-0">Trả hàng:</span>
              <span><strong>Không áp dụng trả sản phẩm</strong></span>
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
        <p>
          <strong>Ghi chú:</strong> Thời hạn đổi/trả hàng được tính từ ngày khách hàng nhận
          hàng cho đến ngày khách hàng gửi hàng đổi/trả cho đơn vị vận chuyển.
        </p>
      </div>
    </main>
  );
}
