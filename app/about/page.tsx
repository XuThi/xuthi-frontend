import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giới thiệu | XuThi Store",
  description: "Tìm hiểu về thương hiệu giày dép XuThi - Nâng niu bàn chân của phái nữ",
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Giới thiệu</h1>

      <blockquote className="border-l-4 border-primary pl-4 italic text-lg text-muted-foreground mb-8">
        &ldquo;Nâng niu bàn chân của phái nữ&rdquo; — Đây là slogan cũng là mục tiêu mà
        thương hiệu XuThi nhắm tới, đó chính là tạo ra những sản phẩm có thể hạn chế tối đa
        sự khó chịu mỗi khi mang giày cao gót của chị em phụ nữ.
      </blockquote>

      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-10">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/xuthi-6f838.appspot.com/o/box1.jpg?alt=media&token=1ea1632a-bd28-4752-961e-81ebc20d1aa7"
          alt="XuThi Store"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>

      <section className="space-y-6 text-base leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">Bạn biết gì về chúng tôi?</h2>
          <p>
            XuThi là thương hiệu mới ra mắt với quyết tâm và ý chí, hi vọng sẽ trở thành một
            thương hiệu thời trang giày dép được phụ nữ Việt Nam yêu thích và chọn lựa bằng
            chính chất lượng sản phẩm chúng tôi mang lại cho khách hàng. Chúng tôi quyết định
            thành lập thương hiệu mang tên XuThi với mong muốn đóng góp cho nền sản xuất của
            Việt Nam, nâng tầm hàng thương hiệu Việt. Hi vọng trong tương lai XuThi sẽ phát
            triển mạnh mẽ và được khách hàng chào đón, và thương hiệu chúng tôi cũng sẽ không
            ngừng nâng cấp chuyên nghiệp. Dịch vụ của XuThi cam kết sẽ mang đến sự hài lòng
            và quyền lợi của khách hàng luôn được đáp ứng, thoả mãn…
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Sản phẩm chúng tôi có gì nổi bật?</h2>
          <p>
            Với mục tiêu không ngừng phát triển và hoàn thiện, sản phẩm của XuThi luôn mang đến
            cho phụ nữ sự tự tin, toả sáng trong những bữa tiệc, giúp các cô gái trở nên sang
            chảnh và có khí chất với phong cách thời trang riêng biệt, ấn tượng. Bên cạnh việc
            chú trọng đến sự êm ái, giá cả phải chăng, sản phẩm XuThi luôn được chỉnh chu
            trong từng chi tiết, mẫu mã đa dạng, phù hợp mọi hoàn cảnh và mang hơi thở thời
            trang trong nước, thế giới...
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Thế mạnh của chúng tôi?</h2>
          <p>
            Chúng tôi có xưởng sản xuất được đặt tại quận 12, Thành phố Hồ Chí Minh, Việt Nam.
            Những sản phẩm giày dép của chúng tôi được tạo ra từ bàn tay, khối óc và sự tỉ mỉ
            trong từng công đoạn sản xuất từ thiết kế mẫu, chọn lựa nguyên vật liệu cao cấp,
            kỹ thuật tạo form dáng hiện đại và sản xuất theo đúng trình tự tiêu chuẩn vô cùng
            chặt chẽ, chuyên nghiệp để tạo ra những sản phẩm giày dép &ldquo;Made in Viet
            Nam&rdquo; chất lượng cao, mang đến vẻ đẹp mềm mại, uyển chuyển, thổi hồn của
            người thợ vào từng sản phẩm.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Cam kết của chúng tôi?</h2>
          <p>
            Cam kết của chúng tôi là tạo ra những sản phẩm chất lượng, êm ái, kiểu dáng đẹp,
            thời trang và giá cả hợp lý…để mọi phụ nữ Việt Nam đều hài lòng khi sử dụng sản
            phẩm của XuThi.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Sứ mệnh của chúng tôi?</h2>
          <p>
            XuThi sẽ không ngừng đổi mới và phát triển, trở thành người bạn đồng hành thân
            thiết góp phần vào sự toả sáng của các cô gái, tăng thêm sự tự tin và kiêu sa cho
            các cô gái của chúng tôi.
          </p>
        </div>
      </section>
    </main>
  );
}
