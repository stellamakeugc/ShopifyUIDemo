/**
 * Job đang chạy — chỉ báo TOÀN CỤC, sống ở MỌI trang.
 *
 * ═══ VÌ SAO CẦN ═══
 * Generate video mất vài phút và merchant không ngồi chờ trên AI Studio: họ bấm
 * generate rồi sang Library, sang Widgets, hoặc đóng tab. Nếu chỉ Home biết job
 * đang chạy thì ba chuyện xảy ra — reload và tưởng app hỏng · bấm generate lần nữa
 * và **tiêu credit hai lần** · mở support ticket (support tickets/100 installs là
 * guardrail metric của roadmap).
 *
 * ═══ KHÁC GÌ `JobProgress` ═══
 * `JobProgress` là card CHI TIẾT trên Home (dashboard là chỗ hợp lý để xem đầy đủ).
 * Component này là bản GỌN cho các trang khác: đủ để biết còn chạy và bao lâu nữa,
 * cộng một đường về xem chi tiết. Hai cái không hiện cùng lúc — trên Home chỉ dùng
 * `JobProgress`.
 *
 * ═══ TRONG APP THẬT ĐẶT Ở ĐÂU ═══
 * KHÔNG phải ở từng route. Đặt trong **layout route** `app/routes/app.tsx` (route bọc
 * toàn bộ trang admin) để render một lần cho mọi trang con, và job state đọc từ
 * loader + poll để survive reload.
 * ⚠️ Harness của mockup không có layout route lồng nhau nên nó được render trong
 * `Shell.tsx` — đó là chi tiết của harness, không phải kiến trúc đề xuất.
 *
 * ⏳ CẦN DUONG CHỐT: job state là global (một store + poll ở layout) hay per-page?
 * Ảnh hưởng cả cách lưu job và cách hiện thông báo khi xong.
 */
export default function GlobalJobProgress({
  done,
  total,
  etaLabel,
  href = '/app',
}: {
  done: number;
  total: number;
  etaLabel?: string;
  href?: string;
}) {
  return (
    <s-banner tone="info" heading={`Generating ${total} AI videos — ${done} of ${total} done`}>
      <s-paragraph>
        {/* Nói rõ merchant KHÔNG cần chờ ở đây — đó là mục đích của chỉ báo global */}
        {etaLabel ? `${etaLabel}. ` : ''}Keep working — we&apos;ll let you know when they&apos;re
        ready.
      </s-paragraph>
      {/* In real app: shopify.toast.show('5 videos ready') khi job chuyển sang done */}
      <s-button slot="secondary-actions" href={href}>
        View progress
      </s-button>
    </s-banner>
  );
}
