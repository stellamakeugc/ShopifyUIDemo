import {useNavigate} from 'react-router-dom';

import {TabBar} from './primitives';

/**
 * Tab điều hướng giữa 2 luồng tạo video của AI Studio.
 *
 * ═══ VÌ SAO MỘT MỤC NAV VỚI TAB, KHÔNG PHẢI NHIỀU MỤC NAV ═══
 * 1. Toàn bộ state credit / quota / plan-gate / job **sống ở cấp AI Studio**, không ở
 *    cấp luồng — chung một credit pool, chung một hàng đợi, chung một plan gate. Route
 *    riêng nghĩa là nuôi nhiều bản copy của cùng bộ state, và chúng sẽ lệch nhau.
 * 2. Nav đang có câu hỏi CHƯA GỠ: screenshot 06 Aug 2026 chỉ thấy 4 mục và KHÔNG có AI
 *    Studio (xem `registry.tsx` → Analytics `open[]`). Thêm mục vào một IA còn lung lay
 *    là tự chuốc việc.
 *
 * ═══ TÊN TAB (Stella chốt 07 Aug 2026) ═══
 * `Product video` · `Creator video` — thay cho `From catalog` · `From a template`.
 *
 * Tên cũ mô tả **đầu vào** (bắt đầu từ đâu), tên mới mô tả **kết quả** (nhận được gì).
 * Merchant nghĩ theo thứ họ muốn, không theo thứ họ bắt đầu.
 *
 * Trục phân biệt là **ai ở trong khung**: Product video không có người, Creator video
 * có một người cầm sản phẩm và nói lời của merchant. Đây cũng đúng trục ngành dùng —
 * Creatify đặt tên UI lẫn endpoint API là `Product Video` vs `AI Avatar`, Topview gọi
 * luồng thứ hai là `AI Product Avatar`.
 *
 * ⚠️ Cố ý KHÔNG dùng "UGC" làm tên tab, dù đó là tên công ty:
 *  • Không song song — "product video" nói chủ thể, "UGC" nói phong cách quảng cáo.
 *    Creatify để "UGC ads" thành mục THỨ BA chứ không phải đối trọng của Product video.
 *  • "Make UGC" nằm trong app tên MakeUGC đọc ra như tên cả app, không như một tab.
 *  • Gọi nội dung tổng hợp là "user-generated" đúng là thứ FTC 16 CFR 465 nhắm tới;
 *    ngành luôn kèm chữ "AI" khi dùng từ này.
 * Và bỏ động từ "Make": nav app đang là danh từ hết (Home · AI Studio · Library ·
 * Widgets · Analytics), tab trang Widgets cũng vậy (Videos · Design · Setup).
 *
 * ⚠️ ĐÃ BỎ tab `Avatars` (Stella chốt 07 Aug 2026) — trang đó không có hành động nào,
 * một tab chỉ để ngắm là ngõ cụt trong admin hướng-tác-vụ. Kho actor giờ sống trong
 * modal `Add actors` của trang compose. Hệ quả còn mở: merchant muốn xem kho TRƯỚC khi
 * chọn template thì chưa có đường — xem `open[]` của route templates.
 *
 * ⚠️ Dùng `useNavigate` chứ KHÔNG dùng `s-button href`: href render `<a>` native trong
 * shadow DOM → nạp lại cả trang và reset state đang review (`CLAUDE.md` §11). Trong app
 * thật đây là `<Link>` của React Router hoặc `shopify.intents.navigate()`.
 */
/**
 * Thứ tự: **Creator video trước, và nó là trang đích của nav** (Stella chốt 08 Aug 2026).
 * Đây là luồng chính — template + creator nói lời của merchant; Product video (ảnh
 * catalog → video, không có người) là luồng phụ.
 *
 * Vì vậy đường dẫn đã đổi để tab đầu = trang đích:
 *   /app/ai-studio          → Creator video (gallery)   · app.ai-studio._index.tsx
 *   /app/ai-studio/:id      → compose                   · app.ai-studio.$id.tsx
 *   /app/ai-studio/product  → Product video (catalog)   · app.ai-studio.product.tsx
 *
 * Đổi cả TÊN FILE chứ không chỉ đổi path trong registry: tên file flat-routes chính là
 * đường dẫn, và dev copy thẳng file sang app thật.
 */
const TABS = [
  {id: '/app/ai-studio', label: 'Creator video'},
  {id: '/app/ai-studio/product', label: 'Product video'},
] as const;

export default function AiStudioTabs({active}: {active: (typeof TABS)[number]['id']}) {
  const navigate = useNavigate();

  return <TabBar tabs={TABS} active={active} onChange={(path) => navigate(path)} />;
}
