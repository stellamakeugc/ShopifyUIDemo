import {useState} from 'react';

/**
 * Disclaimer về nội dung AI — banner lần đầu, **chặn generate** tới khi merchant tick.
 * Stella yêu cầu 08 Aug 2026.
 *
 * Nói ba điều: (1) đây là video AI, (2) nó KHÔNG thay được review của khách thật về độ
 * trung thực và trải nghiệm dùng sản phẩm, (3) merchant chịu trách nhiệm cho claim của
 * mình, MakeUGC không chịu trách nhiệm cho việc cố ý lạm dụng để lừa người tiêu dùng.
 *
 * Gate là **một lần cho mỗi shop**, nên phải gắn ở CẢ HAI surface sinh video (Creator
 * video compose + Product video) — tuỳ merchant chạm cái nào trước. KHÔNG gắn ở gallery:
 * trang đó chỉ duyệt, không tiêu credit.
 *
 * ⏸️ ĐÃ BỎ (Stella 08 Aug 2026): biến thể `compact` — một dòng nhắc sống mãi ở aside — và
 * nút phụ "Read the AI content policy". Đừng tự thêm lại; nếu cần thì lấy từ git history.
 *
 * ═══ ⚠️ ĐIỀU PHẢI NÓI RÕ VỚI STELLA / LEGAL ═══
 * Disclaimer này chuyển được nghĩa vụ **deployer** sang merchant — dán nhãn deepfake theo
 * EU AI Act Art 50(4), và "conspicuously disclose" theo NY GBL §396-b. Nó **KHÔNG** chuyển
 * được hai thứ:
 *
 *  1. **Nghĩa vụ provider** của MakeUGC theo **Art 50(2)**: output phải được đánh dấu
 *     machine-readable và phát hiện được là AI-generated. Merchant tick gì cũng không xoá
 *     được — đó là việc của bên tạo ra hệ thống.
 *  2. **FTC 16 CFR Part 465**: phạt cả bên **tạo, bán, VÀ PHÁT TÁN** review / testimonial
 *     giả danh người không tồn tại. App này là bên phát tán video lên storefront.
 *
 * → Câu "MakeUGC is not responsible…" là **copy nháp, chưa qua legal**; nó có thể tạo cảm
 * giác an toàn sai. Chi tiết: `deliverables/research-ai-library-avatars.md` §2.4.
 *
 * Thứ THẬT SỰ giảm rủi ro và chưa build: provenance marking trên output (C2PA/watermark)
 * + badge "AI-generated" mặc định bật trên storefront widget.
 */
export default function AiDisclaimer({onAcknowledge}: {onAcknowledge?: () => void}) {
  const [ticked, setTicked] = useState(false);

  return (
    <s-banner tone="info" heading="Before you generate: these are AI videos, not customer reviews">
      <s-stack direction="block" gap="small">
        <s-unordered-list>
          <s-list-item>
            The creator on screen is generated. They are not a real customer and have never used
            your product.
          </s-list-item>
          <s-list-item>
            These videos are <strong>not a substitute for genuine customer reviews</strong>. They
            can&apos;t speak to how your product actually performs, and presenting them as real
            testimonials is deceptive.
          </s-list-item>
          <s-list-item>
            You are responsible for every claim in the dialog you write, and for any AI disclosure
            your market requires. MakeUGC is not responsible for false claims or for deliberately
            misleading shoppers with generated videos.
          </s-list-item>
        </s-unordered-list>

        {/* Tick rồi mới mở khoá — nút "Continue" trần thì merchant bấm qua theo phản xạ và
            ghi nhận thu được không đáng tin. Đây cũng là chỗ tạo ghi nhận: ai tick, lúc nào. */}
        <s-checkbox
          label="I understand, and I'll only make claims about my product that I can back up."
          checked={ticked}
          onChange={() => setTicked((current) => !current)}
        />
      </s-stack>
      <s-button
        slot="primary-action"
        variant="primary"
        disabled={!ticked}
        onClick={onAcknowledge}
      >
        Continue
      </s-button>
    </s-banner>
  );
}
