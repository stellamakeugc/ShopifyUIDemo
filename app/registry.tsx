import type {ComponentType} from 'react';

import HomeDashboard from './routes/app._index';
import Onboarding from './routes/app.onboarding';
import VideosList from './routes/app.library._index';
import VideoDetail from './routes/app.library.$id';
import WidgetsIndex from './routes/app.widgets._index';
import WidgetDetail from './routes/app.widgets.$id';
import TemplateGallery from './routes/app.ai-studio._index';
import TemplateCompose from './routes/app.ai-studio.$id';
import AiStudioProduct from './routes/app.ai-studio.product';
import AiStudioAvatars from './routes/app.ai-studio.avatars';
import Analytics from './routes/app.analytics';
import Billing from './routes/app.billing';
import Settings from './routes/app.settings';

/**
 * Registry của mọi mockup — thêm mockup mới chỉ sửa file này.
 *
 * Tên file route đặt theo convention Remix / React Router flat-routes
 * (`app.library._index.tsx`, `app.library.$id.tsx`) để dev copy sang app thật là
 * đúng chỗ luôn, không phải đổi tên.
 */
export interface Mockup {
  path: string;
  /**
   * Path phụ mà route này cũng phải match (ví dụ `/app/library/:id`) nhưng KHÔNG
   * hiện thành link trên index page — link `:id` bấm vào là chết.
   * Có để link động từ trang khác (Home → từng video) không rơi vào catch-all.
   */
  alsoMatch?: string[];
  label: string;
  section: string;
  status: 'ready' | 'draft' | 'blocked';
  Component: ComponentType;
  routeFile: string;
  description: string;
  /**
   * Link PRD trên Notion — hiện thành link ngay trên thẻ ở index page.
   *
   * Vì sao để trên thẻ chứ không gom thành một trang danh sách riêng: dev mở review
   * tool để XEM trang, và câu hỏi ngay sau đó luôn là "trang này có những tính năng
   * gì". Hai thứ đó phải nằm cạnh nhau.
   *
   * Chưa viết PRD thì bỏ trống — thẻ tự không hiện link, không phải nút chết.
   */
  prdUrl?: string;
  open?: string[];
}

export const MOCKUPS: Mockup[] = [
  {
    path: '/app',
    label: 'Home',
    section: 'Home',
    status: 'ready',
    Component: HomeDashboard,
    routeFile: 'app/routes/app._index.tsx',
    description:
      'Vẽ lại 05 Aug 2026 theo app THẬT. Setup guide 4 bước theo free path (import → tag → widget → theme), collapse/expand từng bước, bước theme có "Refresh status", xong 4/4 thì thành "Setup complete" một lần rồi mới ẩn. Performance nằm dưới setup guide, hiện ở mọi state nhưng KHÔNG bao giờ hiện số 0. Credit nói đúng một lần và có button. 14 state.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da819e9ddeda67f612a558',
    open: [
      '⏳ Job status: đã vẽ bản TOÀN CỤC (`components/GlobalJobProgress.tsx`) — banner gọn sống ở mọi trang, Home vẫn giữ card chi tiết. Cần Duong chốt kiến trúc: job state là global (một store + poll ở layout route `app/routes/app.tsx`) hay per-page? Ảnh hưởng cả cách lưu job và cách thông báo khi xong. Trong harness nó nằm ở `Shell.tsx` + có công tắc giả lập — app thật thì KHÔNG như vậy.',
      '🛑 App thật có 6 widget format, mockup chỉ biết tên 3 (carousel / stories bar / floating player). Cần Duong cấp tên 3 format còn lại — Home đang nói "See all 6 formats" và trang Widgets phải vẽ lại theo đủ 6.',
      '⏳ Khối "Most used formats" (first-run) đang là PLACEHOLDER — cần design cấp screenshot hoặc video widget thật trên storefront cho 3 format (carousel / stories bar / floating player). Stella chốt 05 Aug 2026 là giữ slot chờ asset. Không có asset thì nó là 3 ô xám vĩnh viễn → lúc đó đổi thành list thông tin hoặc cắt.',
      '✅ ĐÃ GỠ 06 Aug 2026: Stella xác nhận Plans CÓ trong nav app thật → mọi CTA upgrade trên Home đã có đích thật. Còn chờ screenshot để lấy nhãn nav + vị trí chính xác.',
      'Library đã có import TikTok/Instagram chưa, hay chỉ upload? Ảnh hưởng copy step 1.',
      'Home có endpoint attributed revenue chưa? Roadmap nói MVP có revenue counter cho mọi plan, nhưng app hiện tại không hiện nó ở đâu.',
      'Deep link theme editor cần EXTENSION_UUID + handle app block thật (step 4 + banner widget-not-in-theme).',
      'Cách detect widget đã có trong theme (để step 4 tự tick và phân biệt state widget-not-in-theme): poll storefront hay Shopify Asset API?',
      'Credit reset date — billing cycle Shopify hay ngày 1 mỗi tháng?',
      '✅ ĐÃ GỠ CHẶN 06 Aug 2026: Triple Whale connect nằm ở Settings → Integrations (Settings CÓ trong nav). Home có thể lấy lại state `tw-disconnected` với CTA trỏ /app/settings — CHƯA làm, vòng sau.',
      'Quyết định tự lấy: Home KHÔNG có chart (polaris-viz là React, page speed là guardrail metric + điều kiện BFS). Chart để ở Analytics — Duong phản đối nếu sai.',
    ],
  },
  {
    path: '/app/onboarding',
    label: 'Onboarding — setup guide (STALE)',
    section: 'Stale — IA cũ',
    status: 'blocked',
    Component: Onboarding,
    routeFile: 'app/routes/app.onboarding.tsx',
    description:
      '⚠️ STALE — IA app thật KHÔNG có trang Onboarding riêng, setup guide sống trên Home. Giữ lại vì phần async import job / theme-unsupported / manual install còn dùng được khi vẽ lại Library.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da8156a175dd37485f2afc',
    open: [
      '⚠️ Route này dùng `onboardingSteps` (3 bước, stale). Home dùng `setupSteps` (4 bước). Xoá route này thì xoá luôn `onboardingSteps` trong sample.ts.',
      'Deep link theme editor cần EXTENSION_UUID + handle của app block thật — Duong điền khi có extension.',
      'Cách detect player đã live trên storefront: poll storefront hay Shopify Asset API? Ảnh hưởng bước 3 tự tick hay merchant tự xác nhận.',
      'Theme vintage (Online Store 1.0) — có làm manual install thật không, hay chỉ hướng dẫn đổi theme?',
      '⚠️ `interestFor` tooltip đặt trên `s-button disabled` — cần verify browser xem disabled có nuốt interest event không.',
    ],
  },
  {
    // App thật gọi trang này là **Library**, không phải Videos. Path đổi theo app;
    // nội dung bên trong vẫn là bản cũ, CHƯA vẽ lại → status blocked.
    path: '/app/library',
    label: 'Library — videos list',
    section: 'Library',
    status: 'ready',
    Component: VideosList,
    routeFile: 'app/routes/app.library._index.tsx',
    description:
      'Vẽ lại 06 Aug 2026 theo app THẬT. Grid-first + toggle sang table. Filter tách thành BA trục (trạng thái · nguồn · vấn đề) thay cho 9 chip single-select trộn 4 trục. Thẻ mang badge trạng thái + placement + cảnh báo chưa tag + doanh thu. Bulk "Add to widget" (placement là gán tay). Nhận job từ AI Studio bằng MỘT banner. 11 state, a11y 100/100.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da81f4884ac70f7ce02355',
    open: [
      '🛑 Mockup vẽ 1 video : NHIỀU product, app đang **1:1** (modal "Link to product" ghi rõ). Stella chốt 06 Aug 2026 vẽ 1:n vì ràng buộc 1:1 là tạm thời — dev copy route phải biết backend chưa đỡ được. Cần biết: 1:n dự kiến khi nào, và UI chọn nhiều product trông thế nào?',
      '🛑 Vốn từ chốt là "Tag products"; app đang ghi "Link to product" và sẽ đổi theo mockup — có chi phí dev.',
      '🛑 Modal "Choose widget" của app nói video đang ở trong widget `Test` mà widget đó KHÔNG có trong danh sách để gỡ ra. Mâu thuẫn dữ liệu hoặc lỗi hiển thị.',
      '🛑 Nút modal app ghi "Add to widget" trong khi danh sách là multi-select có sẵn tick — bỏ tick rồi bấm thì gỡ hay không làm gì? Mockup dùng "Save".',
      '🛑 Menu `...` của app thiếu Preview, Rename và **Unpublish** (publish được nhưng không thấy đường gỡ xuống), trong khi 3/11 mục là tính năng chưa build (`Soon`).',
      'Ba đích đến "Publish on website" / "Save to Shopify Files" / "Save to Product Media" nghe rất giống nhau — cả hai modal sau phải giải thích *cái mình KHÔNG làm*. Khi UI phải nói vậy thì tên đang gây hiểu nhầm.',
      'Xoá video đang nằm trong widget thì widget xử lý thế nào? Mockup viết confirm là "removes them from every widget they\'re in" — cần xác nhận đúng hành vi.',
      '⚠️ `s-table` KHÔNG có row selection / bulk actions. Bulk ops trên 500+ video phải tự dựng bằng s-checkbox + SelectAllBar — cần Duong xác nhận cách làm.',
      'Grid view: không có `s-media-card`, đang tự dựng bằng s-grid + s-image.',
    ],
  },
  {
    path: '/app/library/v-1',
    // Home link tới `/app/library/{id}` cho từng row → cần match cả param
    alsoMatch: ['/app/library/:id'],
    label: 'Video detail — product tagging',
    section: 'Library',
    status: 'draft',
    Component: VideoDetail,
    routeFile: 'app/routes/app.library.$id.tsx',
    description:
      'Tag product theo mốc thời gian trong video, CTA label, placement, performance sidebar.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da81f88d3ed2c912a84d28',
    open: ['Resource picker là App Bridge API — mockup chỉ ghi comment, không chạy được.'],
  },
  {
    // App thật gọi là **Widgets** (nav), không phải Player.
    path: '/app/widgets',
    label: 'Widgets — quản lý widget',
    section: 'Widgets',
    status: 'ready',
    Component: WidgetsIndex,
    routeFile: 'app/routes/app.widgets._index.tsx',
    description:
      'Vẽ lại 06 Aug 2026 theo app THẬT. Thêm grid quản lý tổng mà app đang thiếu hoàn toàn (index app chỉ có empty state). Mỗi thẻ nói ĐÚNG MỘT trạng thái theo thứ tự thiệt hại: ngoài plan › 0 video › chưa set up › chưa sync › Ready, kèm lý do bằng text hiện sẵn và action đúng việc đang thiếu. 6 template đổi tên (bỏ "PDP", bỏ tên đối thủ). Gate theo plan hai trục: template cao cấp + trần số widget. Tạo widget gộp về MỘT modal hai bước. 14 state.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da8128887fd6f1bc45c41a',
    open: [
      '🛑 `Add to theme` có deep-link + preset block/widget ID không, hay merchant vẫn phải dán tay chuỗi cuid 25 ký tự như tab Setup đang bắt làm? Setup tab đang có CẢ HAI — một trong hai thừa hoặc đang nói dối. Đây là chỗ activation (install → first video live dưới 10 phút) chết.',
      '✅ CHỐT 06 Aug 2026 (Stella, không chờ Duong): **storefront cập nhật TỰ ĐỘNG khi save** — app ghi metafield ngay trong request đó. Ghi metafield là mutation Admin API gần như tức thì, sync thủ công là nợ kỹ thuật chứ không phải ràng buộc Shopify. Dev cần: debounce về đúng lúc Save (tránh rate limit) + đẩy sang background job nếu sợ save fail. Đã gỡ khỏi mockup: `hasUnsyncedChanges`, `lastSyncedAt`, badge `Changes not live`, state `unsynced`/`syncing`, bước 3 của Setup. Giữ lại nút `Refresh storefront data` như CÔNG CỤ SỬA LỖI ở cuối Setup, không đánh số, không phải bước bắt buộc.',
      '🛑 App detect được block đã nằm trong theme chưa (poll storefront / Asset API)? Chưa detect được thì badge cao nhất chỉ dám là "Ready", không được nói "Live" — đây là lý do trang có một dòng đính chính dưới grid.',
      '🛑 Gate theo plan chưa có số thật: `PLANS[].widgetLimit` (1/3/10/∞) và `widgetTemplates[].minPlan` là ĐỀ XUẤT của tôi để 3 state gate chạy được. BOD chốt lại, hoặc bác thì xoá 3 state đó. `adds` của Starter/Growth trên trang Billing cũng phải thêm dòng giới hạn nếu chốt.',
      '🛑 Listing đã submit ghi "a carousel, a stories bar, or a floating player" — app có 6 template và KHÔNG tên nào khớp, kể cả trước khi tôi đổi tên. Cùng loại rủi ro với claim "1000+ avatars": sửa listing hay đổi tên theo listing?',
      '🛑 Đổi tên 6 template có chi phí dev (string + doc + listing). PDP Stories → Product page stories (§5 cấm "PDP") · Homepage Spotlight → Home page spotlight · Bubble Feed → Floating bubble · For You Feed → Full-screen feed. Mô tả `Video Carousel` của app có chữ "like Reelfy" — tên đối thủ trong UI merchant đọc, đã bỏ.',
      '✅ RÚT LẠI 06 Aug 2026: `Overlay strength` hiện `0,58` KHÔNG phải lỗi của app. Đo trong mockup: giá trị thật là `0.58` ở cả DOM property lẫn input trong shadow root — dấu phẩy là cách `s-number-field` của Polaris HIỂN THỊ. App thật dùng cùng component nên cùng hành vi. Đừng bắt Duong đi sửa một thứ không hỏng.',
      'Một widget có bị khoá vào đúng một surface theo template không, hay `Video carousel` đặt được ở cả Product / Home / Collection cùng lúc? Ảnh hưởng cách viết dòng placement trên thẻ.',
      'Xoá widget đang có block trong theme thì block xử lý thế nào? Confirm hiện đang giả định "chỗ đó trống cho tới khi merchant gỡ block".',
      'Ngưỡng hiện filter (>8 widget) là tôi tự đặt.',
    ],
  },
  {
    path: '/app/widgets/w-1',
    // Thẻ trên index link tới `/app/widgets/{id}` → phải match cả param
    alsoMatch: ['/app/widgets/:id'],
    label: 'Widget detail — videos · design · setup',
    section: 'Widgets',
    status: 'ready',
    Component: WidgetDetail,
    routeFile: 'app/routes/app.widgets.$id.tsx',
    description:
      'Vẽ lại 06 Aug 2026 theo app THẬT. Đảo tab thành Videos → Design → Setup (thứ tự chính app dạy ở trang Widgets rồi lại xếp ngược). Preview LUÔN vẽ được kể cả khi playlist rỗng — app nói "Add videos to preview" ở cả 4 sub-tab nên 30 field không kiểm chứng được. Bỏ sub-nav dọc → 4 section xếp dọc. Playlist đổi được thứ tự, cảnh báo video chưa tag product, gỡ video có confirm nói rõ không xoá khỏi Library. Setup phân nhánh theo 3 cơ chế storefront. 13 state.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da818da440c52dc6e3d4a1',
    open: [
      '🛑 `Full-screen feed` là app proxy, app embed hay theme block? Screenshot xác nhận `Floating bubble` = **app embed** ("App embed (site-wide)"); `Full-screen feed` mô tả "dedicated proxy page" nghe như cơ chế THỨ BA. Mockup đang đoán `app-proxy` — sai thì hướng dẫn Setup của template đó sai.',
      '🛑 **Field Design phải khác nhau theo format** (Stella chốt 06 Aug 2026) — bấm Edit ở widget nào thì tab Design chỉ hiện field format đó CÓ. Bảng scope ở `sample.ts` → `widgetTemplates[].design` là SUY LUẬN từ mô tả template của app; mới có screenshot tab Design của PDP Stories, cần Duong đối chiếu 5 template còn lại. Đo được: 33 field (stories/carousel) · 30 (stacked) · 16 (spotlight) · 13 (bubble) · 11 (feed). KHÔNG thêm field mới, chỉ giới hạn field đã có.',
      '⚠️ `Full-screen feed` bị bỏ CẢ section Lightbox — feed toàn màn hình chính là viewer nên không có popup nào để cấu hình. Đây là suy luận, cần xác nhận.',
      '🛑 Backend có lưu thứ tự video trong playlist không? App thật KHÔNG có control đổi thứ tự — mockup thêm nút lên/xuống, cần cột `position`.',
      '🛑 App thật viết CHUNG một hướng dẫn theme-block cho mọi template, kể cả template app embed. Merchant dùng Floating bubble sẽ đi tìm chỗ "thêm block" không tồn tại.',
      '⚠️ `Remove` khỏi widget có gỡ tên widget khỏi `video.widgets` không, hay chỉ ẩn? Confirm đang viết là video vẫn ở Library và ở widget khác.',
      '⚠️ Preview là XẤP XỈ — nó không chạy code widget thật. Muốn đúng 100% thì phải nhúng storefront preview thật, có chi phí dev.',
      'Chip `Uploaded` / `Video` / `2d ago` của app: đã bỏ chip `Video` (trùng badge trên thumbnail), giữ nguồn + ngày + thời lượng.',
      'Ba câu cũ chưa có đáp án: deep link `Add to theme` có preset widget ID · sync tự động được không · detect được theme block không.',
    ],
  },
  {
    path: '/app/ai-studio',
    label: 'AI Studio — Creator video (trang đích của nav)',
    section: 'AI Studio',
    status: 'draft',
    Component: TemplateGallery,
    routeFile: 'app/routes/app.ai-studio._index.tsx',
    description:
      'Tab **Creator video** (đổi tên 07 Aug 2026 từ "From a template"). Port từ SCREENSHOT platform "Content Library". Filter là MỘT dải chip phẳng ~35 tag trộn ngành + format + style (Accessories cạnh Avatar Swap cạnh Cinematic cạnh Hook cạnh Viral) — không phải 3 dropdown như bản đoán đầu. Card chỉ có video dọc, không chữ; tên + mô tả nằm trong modal Details. Cố ý KHÔNG có aside (credit thuộc chỗ tiêu tiền, không thuộc chỗ duyệt hàng — và bỏ nó trả lại 966px cho lưới, 5 cột thay vì 3). Giá một video 150 credits. Modal tên là **Details** (không phải "Ad details" như platform — app này sống trong Shopify admin, video đi thẳng lên storefront chứ không phải nền tảng chạy ad), có khối VIDEO tự chạy kèm pause + đồng hồ, và chỉ có tên + mô tả đúng như platform (đã bỏ hàng tag / khối "Creator in this template" / dòng thời lượng — tên creator vẫn nằm dưới mỗi thẻ ở lưới và ở section Creator and voice của compose). 7 state.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da81bfab4ef10837a57f8a',
    open: [
      'Giá một video CHỐT là 150 credits (Stella 08 Aug 2026) → plan Scale 2.500 ra ≈16 video/tháng. Còn thiếu allowance của Starter và Growth — số đó chặn pricing doc trên Notion.',
      '🛑 Thư viện thật có bao nhiêu template? Mockup có 24 mẫu và hiện tổng 240 — cả hai đều là tôi đặt.',
      'Taxonomy có tag "Avatar Swap" như một LOẠI template. Nếu swap thành tính năng chung cho mọi template thì tag đó xử lý thế nào?',
      'Tag row dùng div flex-wrap: `s-stack` không có `wrap` và `s-grid` ép mọi ô bằng nhau ("All" sẽ rộng bằng "Beauty & Personal Care"). Chip bên trong vẫn là `s-clickable-chip` thuần.',
    ],
  },
  {
    path: '/app/ai-studio/t-1',
    // Gallery điều hướng tới `/app/ai-studio/{id}` cho từng template.
    // `:id` là dynamic nên React Router xếp sau các segment tĩnh (`product`, `avatars`)
    // — không đụng nhau.
    alsoMatch: ['/app/ai-studio/:id'],
    label: 'AI Studio — compose từ template',
    section: 'AI Studio',
    status: 'draft',
    Component: TemplateCompose,
    routeFile: 'app/routes/app.ai-studio.$id.tsx',
    description:
      'Tab **Creator video** → compose. GỘP Content Library Recreate + composer Talking Actors của platform làm một luồng. Bốn section: template (thumb trái, chữ phải) · Product (modal có search vì store có thể có hàng nghìn sản phẩm; description có nút AI "Summarise from product details") · Dialog (MỘT card, AI script writer là CHẾ ĐỘ bên trong đúng luồng platform, không phải ô nhập thứ hai; Add speech emotion chèn thẻ [excited] tại vị trí con trỏ) · Creator (**Optional**, mặc định TRỐNG — creator của template không nằm trong kho avatar, không đụng vào thì video giữ nguyên người có sẵn). ĐÃ BỎ section Quality/Mode (mặc định Nova 2.0, 150 credits/video) và ĐÃ BỎ state Free Forever — gói đó không có trong tập plan. Có gate disclaimer ba bước: banner CHẶN generate (nút Generate bị ẨN, không phải disable) → tick + Continue → banner "Thank you" tự tắt sau 3s có `CountdownRing` → Generate hiện ra. 12 state.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da81f8ac42f5ba49bb7833',
    open: [
      '🛑 Copy disclaimer "MakeUGC is not responsible for false claims" là NHÁP, chưa qua legal. Nó chuyển được nghĩa vụ deployer (EU AI Act 50(4), NY 396-b) sang merchant nhưng KHÔNG chuyển được nghĩa vụ provider (Art 50(2) — dấu machine-readable) và KHÔNG chuyển được FTC 16 CFR 465, vì điều khoản đó phạt cả bên PHÁT TÁN — app này chính là bên đẩy video lên storefront. Thứ thật sự giảm rủi ro và CHƯA build: provenance marking trên output + badge "AI-generated" mặc định bật trên storefront widget.',
      '⏸️ Chọn model đã PARK khỏi UI (Stella 07 Aug 2026) — mặc định Nova 2.0, một giá 150 credits. Bảng `aiModels` giữ trong sample.ts nhưng không route nào import; cần Duong cấp danh sách thật trước khi bật lại.',
      'Allowance của Starter và Growth chưa có. Scale 2.500 ở 150/video = ≈16 video/tháng.',
      'Trần Dialog để 200 (theo Recreate) hay 1500 (theo composer Talking Actors)? Đang để 200 vì template 15s cố định — 1500 ký tự không lọt vào 15 giây.',
      'AI Script writer và "Generate voice preview" có tiêu credit riêng không? Đang vẽ là miễn phí.',
      'Modal Add actors cho multi-select đúng platform, nhưng một video chỉ có một mặt → hiện chỉ dùng cái đầu. Multi-select để làm gì: sinh nhiều biến thể cùng lúc (mỗi actor một video), hay hội thoại nhiều người?',
      '⏸️ Đã bỏ tab "My actors" và thẻ "Create +" khỏi modal Add actors — V1 không có custom actor nên để lại là dẫn merchant vào ngõ cụt.',
      '⚠️ Audio settings là MODAL, không phải panel phải như platform: chỗ đó là slot="aside" và CreditMeter đang chiếm — mà credit là thứ cần nhìn TRONG LÚC chỉnh giọng vì "Generate voice" tiêu credit.',
      '⚠️ Ảnh sản phẩm lấy từ Shopify catalog làm chính (platform chỉ có upload). Merchant đã có ảnh trong Shopify, bắt tải xuống rồi tải lên lại là bước thừa — nhưng cần Duong xác nhận backend nhận được ảnh từ catalog.',
      '⏳ 15s ≈ 40 từ ≈ 220 ký tự — cả đồng hồ giây lẫn cảnh báo "trim about N words" dựa vào tỉ lệ này. ETA 2 phút suy từ tỉ lệ 1:10 của Creatify, phải verify p50/p95 thật.',
      'Ảnh product tile vẫn là picsum qua `productImage()` — dùng CHUNG với tab catalog (vẽ từ app thật 05 Aug) nên cố ý KHÔNG sửa lệch một tab. Cùng loại vấn đề với thumbnail template đã đổi sang `MediaPlaceholder`; muốn sạch thì đổi cả hai tab một lượt.',
      'a11y 96/100. Lỗi còn lại DUY NHẤT là class `field-details-disabled` của chính Polaris (chữ mờ trong lựa chọn bị khoá) — không sửa được từ code mình. Lý do khoá đã đẩy ra dòng riêng ở contrast bình thường nên thông tin không bị chôn trong chữ mờ.',
    ],
  },
  {
    path: '/app/ai-studio/product',
    label: 'AI Studio — Product video',
    section: 'AI Studio',
    status: 'ready',
    Component: AiStudioProduct,
    routeFile: 'app/routes/app.ai-studio.product.tsx',
    description:
      'Tab **Product video** (đổi tên + đổi path 08 Aug 2026: `/app/ai-studio/product`). Vẽ lại 05 Aug 2026 theo app THẬT — mô hình catalog image → video, 1 ảnh = 1 credit = 1 video. Hai section: Products & images (bước 1) + Prompt (cấp batch, ghi đè lẻ từng ảnh qua modal). Cost preview + lý do Generate bị disable + banner cannot-afford/batch-lớn nằm ở aside dưới CreditMeter. Confirm có số lượng khi batch ≥25. Có gate disclaimer ba bước giống tab Creator video (một lần cho mỗi shop nên phải chặn ở CẢ HAI tab sinh video). 17 state, a11y 100/100.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da81bb9227dc99a0dd33c7',
    open: [
      '🛑 Listing đã submit claim "1000+ avatars in 50+ languages" (app-listing-v1-submission.md dòng 39) mà AI Studio KHÔNG có avatar/language picker. Chính file listing ghi Shopify reject nếu claim không verify được → phải chốt: sửa listing, hay ship avatar/language trước review. Section "Creator & language" trong mockup là slot cho nó.',
      '🛑 Credit allowance thật của Starter / Growth? Chỉ Scale = 2.500/mo là verify được từ app (mockup cũ ghi 200, lệch 12,5×). Mọi state quota phụ thuộc tỉ lệ allowance / cỡ batch.',
      '⚠️ ĐÃ BỎ "Image ad" khỏi AI Studio (Stella chốt 05 Aug 2026): ảnh quảng cáo không vào được vòng video → widget → tag product → revenue nhưng tiêu credit cùng pool. Hệ quả: Library phải bỏ filter `Images` — trừ khi giữ cho ảnh merchant tự upload (Library có nút Upload). Nếu image ad đang là hook upsell tier Scale thì cần BOD xác nhận.',
      '⚠️ Section Prompt là THIẾT KẾ MỚI — app thật chưa có input nào. Prompt cấp batch + ghi đè lẻ (Stella chốt).',
      'Khối "What gets rejected" (competitor brand / health claim / ngụ ý người thật) là PHỎNG ĐOÁN từ mockup cũ — cần Duong lấy đúng content policy của provider. Viết sai thì merchant tin sai.',
      'Prompt để trống thì backend sinh ra gì? Mockup nói "plain product showcase" — cần xác nhận có default prompt thật hay bắt buộc nhập.',
      'Ngưỡng confirm batch (25 ảnh) và giới hạn prompt (500 ký tự) là tôi tự đặt.',
      'Fail thì credit hoàn NGAY hay cuối chu kỳ? Copy hiện nói "refunded" chung.',
      '⚠️ Không có `s-progress-bar`. Progress của job đang tự dựng bằng s-box — cần Duong xác nhận hoặc chờ Shopify ship component.',
    ],
  },
  {
    path: '/app/ai-studio/avatars',
    label: 'AI Studio — avatars (KHÔNG CÓ ĐƯỜNG VÀO)',
    section: 'AI Studio',
    status: 'blocked',
    Component: AiStudioAvatars,
    routeFile: 'app/routes/app.ai-studio.avatars.tsx',
    description:
      '⛔ HIỆN KHÔNG CÓ ĐƯỜNG VÀO. Stella bỏ tab `Avatars` 07 Aug 2026 — trang chỉ để ngắm, không hành động nào, là ngõ cụt trong admin hướng-tác-vụ. Kho actor giờ sống trong modal `Add actors` của trang compose (đã bù luôn bộ lọc style sang đó). Giữ file để review và phòng khi chốt cần một trang duyệt riêng. Nội dung: kho MakeUGC 24 actor, filter gender + age 5 bậc + skin tone có nhãn chữ + ~30 chip style. 6 state.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da81efb91cc04bd06946d9',
    open: [
      '🛑 Merchant xem kho actor TRƯỚC khi chọn template bằng đường nào? Bỏ tab Avatars thì kho chỉ còn trong modal của trang compose, mà muốn vào đó phải chọn template trước. Câu "các anh có creator nào giống tệp khách của tôi không?" — hỏi TRƯỚC khi quyết định nâng gói — chưa có chỗ trả lời. Reviewer Shopify đi verify claim "1000+ avatars" cũng vậy. Cách vá rẻ nhất: secondary action "Browse creators" trên trang gallery, mở đúng modal đó. CHƯA làm, chờ Stella chốt.',
      '⏸️ ĐÃ BỎ custom actor khỏi V1 (Stella chốt 07 Aug 2026). Hệ quả TỐT: phơi nhiễm Illinois BIPA về gần 0 — không còn `scan of face geometry` nào do merchant upload, mà đó là hạng mục duy nhất trong cả nghiên cứu CÓ quyền khởi kiện tư nhân. Tickbox consent biến mất theo → không còn gì phải chờ legal review trước launch. Field `source`/`status`/`consent` vẫn giữ trong type để bật lại là thêm data, không phải migrate schema.',
      '🛑 Bỏ custom actor KHÔNG xoá được nghĩa vụ takedown: actor trong KHO vẫn có quyền rút likeness bất cứ lúc nào (chuẩn ngành HeyGen), và khi đó video đã publish trên storefront widget của merchant phải bị gỡ. Nó chỉ đổi người rút quyền từ "nhân viên merchant" sang "actor MakeUGC". UI cho ca này CHƯA vẽ — cần Duong xác nhận backend làm được trước khi thiết kế.',
      'Kho thật có bao nhiêu actor? Listing đã submit claim "1000+ avatars"; mockup có 24 và cố ý KHÔNG bịa số tổng.',
      'Gói Free có bị giới hạn subset của kho không, hay duyệt hết? Đề xuất duyệt hết — 3/4 đối thủ cho free chạm avatar, khoá lưới là mất luôn lý do upgrade.',
      '⚠️ Swatch màu da có nhãn chữ + accessibilityLabel thay vì 4 ô màu trần như platform — ô màu trần vi phạm "không truyền tải thông tin chỉ bằng màu".',
    ],
  },
  {
    path: '/app/analytics',
    label: 'Analytics',
    section: 'Analytics',
    status: 'ready',
    Component: Analytics,
    routeFile: 'app/routes/app.analytics.tsx',
    description:
      'Vẽ lại 06 Aug 2026 theo app THẬT. Analytics thật ĐO SỰ KIỆN (item clicks · product visits · add to cart · buy now · action rate · cart conversion), không đo tiền — bản mockup cũ dựng cả trang quanh "attributed revenue" là sai mô hình. Hai tab: By video (bảng sort/filter/paginate — khoảng trống lớn nhất của app, nó chỉ có một bar chart "Top media") và Trends (KPI chia 2 nhóm · phễu · daily events · recent activity). Nhóm Sales cố ý ĐI TRƯỚC app. Mọi số derive từ một nguồn: tổng cột bảng = KPI = bước phễu = tổng series chart = KPI của Home. 12 state.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da81b89b5ed85a5d6017c4',
    open: [
      '🛑 Listing đã nộp claim "Track orders and revenue attributed to each video in your dashboard" (app-listing-v1-submission.md dòng 38) mà trang Analytics thật KHÔNG có orders/revenue/dấu $ nào (screenshot 06 Aug). Reviewer sẽ bấm đúng trang này để kiểm chứng → nhóm Sales phải xong TRƯỚC lượt review, không phải trước launch. Cùng hạng với claim "1000+ avatars" của AI Studio.',
      '🛑 "Action rate" và "Cart conversion" app KHÔNG định nghĩa ở đâu cả — mà đó là 2 tỉ lệ merchant mang đi họp. Mockup ĐỀ XUẤT: action rate = item clicks ÷ widget loads · cart conversion = orders ÷ add to cart. Cần Duong xác nhận trước khi build.',
      '🛑 Widget load (impression) có được track không? App phân biệt "widget load" với "item click" trong chính câu định nghĩa của nó nên có vẻ có, nhưng không hiện thành tile ở đâu. Không có mẫu số thì Action rate không kiểm chứng được.',
      '⚠️ Nav trong screenshot 06 Aug chỉ có 4 mục (Home · Library · Widgets · Analytics) — KHÔNG có AI Studio, trong khi patterns §3 ghi 5 mục (verified 05 Aug). Dev App khác bản chính, hay AI Studio đã gỡ? Chưa sửa NAV_ITEMS cho tới khi có trả lời.',
      '⚠️ Menu "..." góc phải trang Analytics chưa mở được — nếu Export nằm trong đó thì bỏ nút Export CSV ở secondary-actions.',
      'Recent events của app hiện "Item click #15946140254577" hai dòng cùng ID, cùng "2d ago" — 2 click thật lên cùng một video, hay lỗi lặp? Mockup đổi sang hiện tên video.',
      'Attribution window + model cho nhóm Sales (last-touch mấy ngày?). Enterprise sẽ đối chiếu từng đơn với báo cáo Shopify.',
      'Ngưỡng "not enough data" của 2 tỉ lệ là tôi tự đặt (mẫu số < 100). App thật hiện "0.0%" khi mới có 2 click — một tỉ lệ tính trên 2 mẫu là số vô nghĩa mà merchant vẫn mang đi họp.',
      'Analytics lọc theo widget / theo placement được không? App chưa có, mockup cũng chưa vẽ.',
      'Export CSV: bảng đang xem hay toàn bộ 543 dòng? Có giới hạn dòng không?',
      'Custom date range + so sánh kỳ tuỳ chọn: launch hay post-MVP? Mockup giữ đúng 7d/30d/90d như app.',
      '⚠️ Không có chart web component. Đang dùng polaris-viz (React) — Analytics giờ là trang DUY NHẤT còn chart (Home đã chốt không có). Cần Duong quyết.',
    ],
  },
  {
    path: '/app/billing',
    label: 'Billing — plans & pricing',
    section: 'Billing',
    status: 'ready',
    Component: Billing,
    routeFile: 'app/routes/app.billing.tsx',
    description:
      'Vẽ lại 06 Aug 2026. **Nội dung pricing lấy từ Notion → Tactic 2 · Pricing proposal** (Stella chỉ đạo), sửa 5 chỗ mockup cũ bán thiếu — Growth 50 → **500 credit**, Triple Whale từ **Growth** chứ không phải Starter, Starter **unlimited widget**, credit **CÓ rollover** trên Growth/Scale, thêm bỏ-branding · sync review · custom AI creator · migration. Action zone tối đa MỘT banner. Bảng **Plans comparison** 17 dòng × 3 nhóm, **thu gọn mặc định**, cột Most popular nổi bằng badge + in đậm (s-table-cell không nhận prop layout nên không tô nền cột được). FAQ accordion một-mở-một. 9 state.',
    prdUrl: 'https://app.notion.com/p/3b8902b339da81638dafc087ef3f937f',
    open: [
      '✅ ĐÃ DỌN 06 Aug 2026: mâu thuẫn "Free chỉ 1 format" đã chốt — đó là HỆ QUẢ của 1 widget, không phải trục gate thứ hai. Đã xoá `PLANS[].formatCount` và bỏ dòng "Formats: 1 format" khỏi bảng so sánh. Gate còn đúng hai trục: `widgetLimit` (Free 1) và `videoLimit` (Free 5). ⚠️ Bảng giá trên Notion vẫn còn dòng đó — cần Stella sửa cho khớp trước khi lên listing.',
      '🛑 **`widgetLimit` đổi theo Notion**: Free 1 · Starter/Growth/Scale **unlimited** (trước là 1/3/10/∞). Trang Widgets đang dùng field này cho state `widget-limit-reached` — giờ state đó chỉ còn áp cho Free. Cần chủ trang Widgets rà lại.',
      '⏳ Notion tự ghi *"Ready for review (numbers are placeholders)"* + chưa BOD duyệt. Nên đây là "khớp đề xuất mới nhất", KHÔNG phải pricing đã chốt. Con số in ra là chính xác (không có dấu ~) vì trang merchant đọc để quyết trả tiền — chỗ chưa chắc xử lý nội bộ, đừng đẩy sự không chắc sang merchant.',
      '⏳ Credit reset theo billing cycle Shopify hay ngày 1 mỗi tháng? `RESET_DATE` đang hardcode "1 September".',
      'Hai chỗ Notion nói khác và **quyết định của Stella thắng doc**: (1) Notion có "14-day free trial", Stella chốt KHÔNG có trial → bảng không có dòng trial; (2) Notion ghi "AI videos & images", Stella chốt 05 Aug bỏ image → chỉ ghi "AI videos".',
      'Quyết định tự lấy: nút về Free ghi **"Cancel subscription"** chứ không phải "Downgrade" — về $0 là huỷ subscription.',
      'Credit top-up packs / annual billing / shared credit pool là post-MVP → trang cố ý KHÔNG có control, nhưng có trả lời trong FAQ.',
      'Trang KHÔNG dùng `CreditMeter` (component của AI Studio) — ở đây credit được giải thích đầy đủ, thả CreditMeter vào là banner nói lại lần hai.',
    ],
  },
  {
    path: '/app/settings',
    label: 'Settings — integrations, connections, email',
    section: 'Settings',
    status: 'ready',
    Component: Settings,
    routeFile: 'app/routes/app.settings.tsx',
    description:
      'Vẽ lại 06 Aug 2026 theo 3 tab Stella xác nhận: Integrations · Connections · Email notifications. Tab bar NGANG (primitive `TabBar` mới), aside trả về trống. Bỏ `General` (attribution window cho merchant tự vặn north-star metric) và `Staff access` (không có trong app). Integrations là DIRECTORY nhóm theo category, có ô logo + 6 status (planned · plan-gated · not connected · connecting · connected · action needed). Connections tách BACKFILL post cũ khỏi AUTO-SYNC post mới. 15 state; hai state đáng giá nhất: `reconnect-needed` (lỗi im lặng) và `plan-gated` (Free Forever KHÔNG connect được Triple Whale).',
    prdUrl: 'https://app.notion.com/p/3b8902b339da81acb50ff2808c4aa1c1',
    open: [
      '🛑 `setupSteps` bước 1 của Home trỏ SAI TRANG: nó nói "Import from TikTok or Instagram" nhưng `href: /app/library`, còn chỗ nối account là Settings → Connections. Đây là bước ĐẦU của activation metric (install → first video live dưới 10 phút) → cần chốt: step 1 trỏ Connections, hay Library có nút nối account riêng? Modal "Add videos" của Library cũng có nút "Import from TikTok or Instagram" chưa nối đích.',
      '🛑 App gửi email cho CUSTOMER của merchant (Stella xác nhận tab Email quyết cả email gửi customer) mà `deliverables/app-listing-v1-submission.md` KHÔNG khai điều đó — chính file listing ghi Shopify reject claim không verify được. Cần chốt trước review: khai vào listing + privacy, hay bỏ customer email khỏi MVP?',
      '⏳ Danh sách email gửi customer là những email GÌ? Chưa có → mockup CỐ Ý chỉ vẽ phần sender (name + reply-to + unsubscribe), KHÔNG bịa row nào. Section đặt tên đúng thứ nó thật sự cấu hình ("Customer email sender") chứ không gọi là "Emails to your customers" rồi để trống.',
      '🛑 **Free Forever KHÔNG connect được Triple Whale** — `PLANS.starter.adds` có đúng một dòng "Triple Whale attribution integration". Mà Free Forever là plan mặc định khi install, và TW là attribution dependency của launch (roadmap dòng 17). Nghĩa là đường attribution của merchant mới install bắt đầu bằng $29. Cần BOD xác nhận đây là ý định, không phải hệ quả ngoài ý muốn của việc xếp tier.',
      '⏳ **Logo: TikTok + Instagram vẽ đúng glyph; Triple Whale / Okendo / Yotpo là bản XẤP XỈ tôi tự vẽ** (đúng màu và hình dáng thương hiệu, không phải asset chính thức). File SVG local ở `mockup-app/public/logos/` — cố ý KHÔNG hotlink CDN của họ. Trước khi dùng ra ngoài (screenshot listing, deck, App Store asset) phải xin bản chính thức từ media kit của từng bên: đây là trademark, không phải thẩm mỹ.',
      'Logo TikTok/Instagram trên tab Connections đã THAY pill tên mạng (Stella, 06 Aug 2026) → tên mạng giờ chỉ còn trong `alt` của ảnh. Nếu sau này bỏ luôn ảnh thì phải trả nhãn text về, không thì merchant dùng screen reader không biết account nào thuộc mạng nào.',
      '⏳ Directory hiện có 3 row, mọi tên đều CÓ NGUỒN (Triple Whale: roadmap dòng 17 + PLANS · Okendo/Yotpo: roadmap dòng 51, Phase 2). Thêm row nào cũng phải có nguồn tương đương — thêm là thêm phần tử trong `integrations` của sample.ts, không sửa route. Chưa có search/filter: 3 row thì control lọc là nhiễu, ngưỡng nên thêm khoảng 10 row.',
      'Có cần affordance "Request an integration" không? Directory sẽ dài ra, và biết merchant xin app nào là tín hiệu roadmap tốt — nhưng nó là tính năng mới nên tôi KHÔNG tự thêm.',
      '🛑 Enterprise checklist §6 "ai được tiêu credit của công ty?" MẤT CHỖ Ở khi bỏ tab Staff access (app chỉ có 3 tab). Chuyển sang Plans, hay bỏ khỏi MVP? Câu hỏi này chưa có ai trả lời từ 03 Aug.',
      '⏳ Video sync về Library ở trạng thái nào? Mockup GIẢ ĐỊNH: chưa vào widget nào, chờ tag product (theo §3d publish = gán tay). Nếu backend tự publish thì mockup này sai VÀ nguy hiểm — video chưa tag product lên storefront là lỗi im lặng tệ nhất của app.',
      '⏳ Tần suất auto-sync (mockup ghi "every 6 hours") và chu kỳ hết hạn token IG/TikTok — cả hai là con số tôi tự đặt. UI cố ý KHÔNG hardcode chu kỳ hết hạn, chỉ nói "stopped 12 days ago".',
      '⚠️ Bỏ 3 setting của tab `General` cũ (attribution window · track video views · auto-publish imported videos). Nếu backend thật CÓ mấy setting này thì cần biết chúng sống ở đâu — riêng attribution window thì nên bỏ hẳn, không phải chuyển chỗ.',
      '⚠️ Vị trí Settings trong nav là phỏng đoán (đặt cuối theo convention Shopify). Cũng lưu ý mâu thuẫn đang mở: screenshot 06 Aug của Analytics chỉ thấy 4 mục nav.',
      '`TabBar` primitive mới bù một khoảng trống a11y: trạng thái "tab đang chọn" trước đây chỉ truyền tải bằng variant (tức bằng màu) — screen reader không biết đang ở tab nào. Library còn 3 chỗ copy-paste cùng pattern, chưa chuyển sang dùng chung (giữ scope 1 trang).',
    ],
  },
];

/**
 * Tên icon hợp lệ — lấy TRỰC TIẾP từ type của `s-icon` nên không thể gõ sai
 * (517 icon, đều là string kebab-case, KHÔNG import component như polaris-icons).
 */
export type IconName = NonNullable<React.JSX.IntrinsicElements['s-icon']['type']>;

/**
 * Nav của harness. Trong app thật đây là `<ui-nav-menu>` của App Bridge.
 *
 * 5 mục đầu là **nav THẬT của app**, verify từ screenshot 05 Aug 2026 (thứ tự y
 * nguyên): Home · AI Studio · Library · Widgets · Analytics.
 *
 * Mục **Plans** thêm 06 Aug 2026 sau khi Stella xác nhận nó có trong nav app thật —
 * nhãn và vị trí còn chờ screenshot. Việc này gỡ chặn P0 cũ: mọi CTA upgrade trong
 * app trước đó trỏ về một route merchant không tự tới được.
 *
 * `HARNESS_ONLY_NAV` là route mockup KHÔNG có trong nav app thật. Giữ để review
 * được, nhưng đừng thiết kế như thể merchant tự vào được.
 */
export const NAV_ITEMS: {path: string; label: string; icon: IconName}[] = [
  {path: '/app', label: 'Home', icon: 'home'},
  {path: '/app/ai-studio', label: 'AI Studio', icon: 'wand'},
  {path: '/app/library', label: 'Library', icon: 'video'},
  {path: '/app/widgets', label: 'Widgets', icon: 'layout-block'},
  {path: '/app/analytics', label: 'Analytics', icon: 'chart-line'},
  // ✅ VERIFY 06 Aug 2026 từ screenshot Widgets: nav thật là 7 mục, đúng thứ tự này.
  // Nhãn thật là **"Billing"**, không phải "Plans" (đoán trước đó). Vị trí: sau
  // Analytics, trước Settings — khớp phỏng đoán cũ nên không phải đổi chỗ.
  {path: '/app/billing', label: 'Billing', icon: 'credit-card'},
  // ✅ VERIFY 06 Aug 2026: Settings là mục cuối. Việc này gỡ chặn cũ — patterns §3
  // từng ghi "nav không có Settings" và Home đã BỎ state `tw-disconnected` vì tin
  // điều đó; giờ có thể dựng lại.
  {path: '/app/settings', label: 'Settings', icon: 'settings'},
];

/**
 * Route CHỈ tồn tại trong harness — không có trong nav app thật.
 *
 * Tách khỏi `NAV_ITEMS` để sidebar giả không nói dối: nhóm này hiện dưới nhãn riêng,
 * ai review cũng thấy ngay đây không phải đường merchant tự vào được.
 */
export const HARNESS_ONLY_NAV: {path: string; label: string; icon: IconName}[] = [
  {path: '/', label: 'All mockups', icon: 'collection'},
  {path: '/app/onboarding', label: 'Onboarding (stale)', icon: 'flag'},
];
