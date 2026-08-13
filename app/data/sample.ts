/**
 * Sample data cho mọi mockup.
 *
 * Cố ý ĐỦ NHIỀU (24 video, 30 điểm chart) — mockup 3 row che hết vấn đề layout,
 * mà merchant enterprise có 500+ video.
 *
 * Cố ý có video CHƯA TAG PRODUCT: đó là lỗi im lặng tệ nhất của app này —
 * video live, có view, nhưng shopper không mua được gì.
 */

/**
 * 6 template widget — verify 06 Aug 2026 từ modal "Choose a template" của app thật.
 *
 * ⚠️ `name` ở đây là **tên đã đổi**, không phải tên app đang chạy. Quyết định của Stella
 * 06 Aug 2026 (screenshot chỉ để hiểu function, tên vẽ lại được). Ánh xạ:
 *
 *   PDP Stories        → Product page stories   §5 cấm gọi Product page là "PDP"
 *   Video Carousel     → Video carousel         sentence case + bỏ "like Reelfy" khỏi mô tả
 *   Stacked Carousel   → Stacked carousel       sentence case
 *   Homepage Spotlight → Home page spotlight    Shopify viết "Home page", không phải "Homepage"
 *   Bubble Feed        → Floating bubble        nó là MỘT video nổi, không phải feed
 *   For You Feed       → Full-screen feed       "For You" là từ của TikTok
 *
 * Mô tả app thật cho Video Carousel là *"…with arrows, dots, and drag — like Reelfy"* —
 * tên đối thủ nằm trong UI merchant đọc. Đã bỏ.
 *
 * `placement` là thuộc tính của TEMPLATE, không phải field merchant sửa: app biết widget
 * **định** hiện ở đâu, nhưng KHÔNG biết block đã thực sự nằm trong theme chưa (merchant
 * thêm block trong theme editor). Xem `MAKEUGC-UI-PATTERNS.md` §3e.
 */
export interface WidgetTemplate {
  id: string;
  name: string;
  blurb: string;
  /**
   * Surface dự kiến, dạng **MẢNG** để render thành pill riêng lẻ.
   *
   * Vì sao không phải một chuỗi: `'Product page, Home page or Collection page'` nằm dưới
   * một đoạn mô tả 3 dòng thì đọc ra như đoạn văn thứ hai — cả thẻ thành một khối chữ
   * liền. Ba pill rời thì mắt bắt được ngay "cái này đặt được ở 3 chỗ" (Stella, 06 Aug 2026).
   *
   * Tên mỗi phần tử PHẢI đúng tên surface chuẩn Shopify (§5).
   */
  surfaces: string[];
  /** Bổ nghĩa cho placement, ví dụ `below description` — pill phụ, tone khác */
  placementNote?: string;
  /**
   * Bản NGẮN của `placement`, cho chỗ chật (tile "Most used formats" trên Home).
   *
   * Vì sao tách field thay vì cắt chuỗi: `placement` của `carousel` là ba surface, để
   * nguyên thì caption wrap 2 dòng và ô thứ hai cao hơn hai ô kia — đúng lỗi lệch
   * baseline mà comment trong `app._index.tsx` đã ghi lại từ lần trước.
   */
  primarySurface: string;
  /**
   * Cơ chế đưa widget lên storefront — **BA loại khác nhau**, verify 06 Aug 2026.
   *
   * Bản trước giả định mọi template đều là theme block. Screenshot widget `Test`
   * (template Bubble Feed) ghi placement là **`App embed (site-wide)`** — app embed bật
   * bằng TOGGLE trong theme editor, không có chỗ nào để "thêm block vào template". Viết
   * chung một hướng dẫn cho cả hai là bảo merchant đi tìm một thứ không tồn tại.
   *
   * ⏳ `app-proxy` cho `feed` là SUY LUẬN từ mô tả app (*"dedicated proxy page"*), chưa
   * verify — cần Duong. Sai thì hướng dẫn Setup của template đó sai.
   */
  setupKind: 'theme-block' | 'app-embed' | 'app-proxy';
  /**
   * Field nào của tab Design **áp dụng** cho format này.
   *
   * Vì sao cần: 6 template khác nhau về CẤU TRÚC, nhưng bản trước cho cả 6 dùng chung
   * một bộ ~30 field. Kết quả: `Floating bubble` (một video nổi ở góc) vẫn hiện
   * `Columns on mobile/tablet/desktop`, `Navigation arrows`, `Pagination dots` — những
   * thứ không tồn tại với nó (Stella bắt được 06 Aug 2026).
   *
   * ⚠️ KHÔNG thêm field mới, chỉ giới hạn field đã có. Bảng dưới là SUY LUẬN từ chính
   * mô tả template của app (đã verify), chưa có screenshot tab Design của template khác
   * PDP Stories → cần Duong đối chiếu.
   */
  design: {
    /** Behavior */
    autoAdvance: boolean;
    loop: boolean;
    productOverlay: boolean;
    arrows: boolean;
    dots: boolean;
    /** Layout */
    columns: boolean;
    gap: boolean;
    cardRadius: boolean;
    /** Colours */
    cta: boolean;
    titleStyle: boolean;
    overlay: boolean;
    /** Lightbox — feed toàn màn hình CHÍNH LÀ viewer, không mở popup nữa */
    lightbox: boolean;
  };

}

export const widgetTemplates: WidgetTemplate[] = [
  {
    id: 'product-stories',
    name: 'Product page stories',
    blurb:
      'A horizontal shoppable row under the product description. Only shows videos tagged with the product being viewed.',
    surfaces: ['Product page'],
    placementNote: 'below description',
    primarySurface: 'Product page',
    setupKind: 'theme-block',
    design: {autoAdvance: true, loop: true, productOverlay: true, arrows: true, dots: true, columns: true, gap: true, cardRadius: true, cta: true, titleStyle: true, overlay: true, lightbox: true},
  },
  {
    id: 'carousel',
    name: 'Video carousel',
    blurb: 'A horizontal carousel shoppers can move with arrows, dots, or by dragging.',
    surfaces: ['Product page', 'Home page', 'Collection page'],
    primarySurface: 'Product page',
    setupKind: 'theme-block',
    design: {autoAdvance: true, loop: true, productOverlay: true, arrows: true, dots: true, columns: true, gap: true, cardRadius: true, cta: true, titleStyle: true, overlay: true, lightbox: true},
  },
  {
    id: 'stacked',
    name: 'Stacked carousel',
    blurb: 'The centre video plays full size while the videos beside it shrink.',
    surfaces: ['Home page', 'Product page'],
    primarySurface: 'Home page',
    setupKind: 'theme-block',
    design: {autoAdvance: true, loop: true, productOverlay: true, arrows: true, dots: true, columns: false, gap: true, cardRadius: true, cta: true, titleStyle: true, overlay: true, lightbox: true},
  },
  {
    id: 'spotlight',
    name: 'Home page spotlight',
    blurb: 'Story-style rings. Tapping one opens a full-screen shoppable viewer.',
    surfaces: ['Home page'],
    primarySurface: 'Home page',
    setupKind: 'theme-block',
    design: {autoAdvance: false, loop: false, productOverlay: false, arrows: false, dots: false, columns: true, gap: true, cardRadius: false, cta: false, titleStyle: false, overlay: false, lightbox: true},
  },
  {
    id: 'bubble',
    name: 'Floating bubble',
    blurb:
      'A muted video that plays in the corner of any page. Shoppers can dismiss it, or tap to open the shoppable viewer.',
    // ✅ App thật ghi 'App embed (site-wide)' — site-wide là surface, app embed là CƠ CHẾ
    surfaces: ['Site-wide'],
    placementNote: 'app embed',
    primarySurface: 'Site-wide',
    setupKind: 'app-embed',
    design: {autoAdvance: false, loop: true, productOverlay: false, arrows: false, dots: false, columns: false, gap: false, cardRadius: true, cta: false, titleStyle: false, overlay: false, lightbox: true},
  },
  {
    id: 'feed',
    name: 'Full-screen feed',
    blurb: 'A vertical, full-screen feed on a page of its own. Link to it from your navigation.',
    surfaces: ['Its own page'],
    primarySurface: 'Its own page',
    setupKind: 'app-proxy',
    design: {autoAdvance: true, loop: true, productOverlay: true, arrows: false, dots: false, columns: false, gap: false, cardRadius: false, cta: true, titleStyle: true, overlay: true, lightbox: false},
  },
];

/**
 * Placement dạng CÂU — cho chỗ cần văn xuôi (tab Setup: "Placement: …").
 *
 * Một nguồn sự thật duy nhất: cả pill lẫn câu đều dựng từ `surfaces` + `placementNote`,
 * nên không thể lệch nhau như kiểu giữ song song hai field.
 */
export function placementText(template: WidgetTemplate) {
  const list =
    template.surfaces.length > 1
      ? `${template.surfaces.slice(0, -1).join(', ')} or ${template.surfaces[template.surfaces.length - 1]}`
      : template.surfaces[0];
  return template.placementNote ? `${list} (${template.placementNote})` : list;
}

export function templateFor(templateId: string): WidgetTemplate {
  return widgetTemplates.find((t) => t.id === templateId) ?? widgetTemplates[0];
}

/**
 * Widget của merchant — mỗi widget là 1 template + 1 tên riêng + 1 playlist riêng.
 * Video được **gán tay** vào widget (modal "Choose widget" của app thật).
 *
 * ⚠️ KHÔNG có field `surface`: placement suy ra từ template (xem trên). Bản trước có
 * `surface` riêng là khẳng định một điều app không biết được.
 *
 * ⚠️ KHÔNG có `hasUnsyncedChanges` / `lastSyncedAt` nữa. Stella chốt 06 Aug 2026: storefront
 * cập nhật **TỰ ĐỘNG** khi save (app ghi metafield ngay trong request đó) → "đã sync chưa"
 * không còn là một trạng thái merchant phải nghĩ tới. Xem `MAKEUGC-UI-PATTERNS.md` §3e.
 *
 * `setUpInTheme` = merchant đã bấm "Add to theme" bao giờ chưa — đây là thứ app BIẾT.
 * Nó KHÔNG phải "block đang thực sự nằm trong theme": cái đó app không detect được, nên
 * UI không bao giờ được nói "Live". Chặn này đang chờ Duong (poll storefront / Asset API?).
 */
export interface Widget {
  id: string;
  name: string;
  templateId: string;
  videoCount: number;
  setUpInTheme: boolean;
  updatedAt: string;
  /**
   * ID merchant phải DÁN vào theme block (app thật: `cms93kqhs0008qsywv9xfpgf8`).
   *
   * Giữ đúng dạng cuid xấu xí của app thật, đừng làm đẹp thành `widget-1`: cả lý do
   * trang Setup cần nút copy nằm ở chỗ chuỗi này dài và không đọc-chép được bằng mắt.
   */
  widgetId: string;
}

export const widgetList: Widget[] = [
  // Tên do merchant đặt — cố ý KHÁC tên template, vì thẻ đã in tên template ở nhãn glyph
  {id: 'w-1', name: 'Main product stories', templateId: 'product-stories', videoCount: 18, setUpInTheme: true, updatedAt: '2 days ago', widgetId: 'cms93kqhs0008qsywv9xfpgf8'},
  {id: 'w-2', name: 'Autumn drop carousel', templateId: 'carousel', videoCount: 12, setUpInTheme: true, updatedAt: '5 days ago', widgetId: 'cmr71bxft0004qsywp2kd8mz3'},
  {id: 'w-3', name: 'Home page rings', templateId: 'spotlight', videoCount: 6, setUpInTheme: true, updatedAt: '1 week ago', widgetId: 'cmq44npc90002qsyw6hj1vt7q'},
  // Cố ý hỏng 3 kiểu khác nhau — ba lỗi im lặng của trang này, mỗi cái một thẻ
  {id: 'w-4', name: 'Best sellers stack', templateId: 'stacked', videoCount: 9, setUpInTheme: true, updatedAt: '2 hours ago', widgetId: 'cmt08zdlk0011qsywx4fb9cn5'},
  {id: 'w-5', name: 'Sale bubble', templateId: 'bubble', videoCount: 0, setUpInTheme: true, updatedAt: '3 days ago', widgetId: 'cmv62rkwm0007qsywq8ld3xp0'},
  {id: 'w-6', name: 'Shop the feed', templateId: 'feed', videoCount: 4, setUpInTheme: false, updatedAt: '1 day ago', widgetId: 'cmw15tgab0003qsywn7cz5ka9'},
];

/**
 * 24 widget cho state `overload` — chỉ ở cỡ này thì search + filter mới có nghĩa.
 * Dưới ngưỡng đó trang KHÔNG hiện filter: control lọc mà không lọc gì là nhiễu.
 */
export const widgetsOverload: Widget[] = Array.from({length: 24}, (_, i) => {
  const template = widgetTemplates[i % widgetTemplates.length];
  return {
    id: `wo-${i + 1}`,
    name: `${template.name} — campaign ${i + 1}`,
    templateId: template.id,
    videoCount: i % 6 === 0 ? 0 : 3 + ((i * 5) % 22),
    setUpInTheme: i % 7 !== 0,
    updatedAt: `${(i % 14) + 1} days ago`,
    widgetId: `cm${i}zq${(i * 7919) % 100000}qsyw${i}kd8mz3`,
  };
});

export interface Video {
  id: string;
  title: string;
  source: 'TikTok' | 'Instagram' | 'Upload' | 'AI Studio';
  /**
   * ⚠️ Mockup vẽ **1 video : NHIỀU product**, nhưng app thật đang là **1:1**
   * (modal "Link to product": *"Link this media to one product (1:1)"*).
   * Stella chốt 06 Aug 2026 vẽ 1:n vì ràng buộc 1:1 chỉ là tạm thời — đây là chỗ
   * mockup CỐ Ý đi trước app, dev copy route phải biết backend chưa đỡ được.
   */
  products: string[];
  /** Widget load — MẪU SỐ của `Action rate`. App thật không hiện nó thành tile */
  views: number;
  orders: number;
  revenue: number;
  /**
   * Bốn sự kiện Analytics thật đang đo (verify 06 Aug 2026 từ trang Analytics của
   * app). Derive từ `views` chứ không random: mọi con số trên trang Analytics phải
   * cộng lại đúng bằng nhau, còn bản mockup cũ có tới BA tổng doanh thu khác nhau.
   *
   * Thứ tự là hành trình shopper: click vào video → mở trang product → thêm giỏ →
   * đơn. `buyNow` là đường TẮT song song (nút Buy now ngay trong video), không phải
   * một bước của phễu — app thật xếp nó lẫn vào giữa nên hai khối trên cùng một
   * trang có hai thứ tự khác nhau.
   */
  itemClicks: number;
  productVisits: number;
  addToCart: number;
  buyNow: number;
  /**
   * Tên widget đang chứa video này. **Rỗng = chưa lên storefront.**
   *
   * KHÔNG có field `published` riêng: trong app, publish CHÍNH LÀ gán vào widget
   * (menu `Publish on website ›` mở modal "Choose widget"), và bộ filter của app
   * cũng không hề có Published/Draft — chỉ có `Not placed` / `In widgets`.
   * Tách thành hai field là bịa ra một trạng thái không tồn tại.
   */
  widgets: string[];
  /** `processing`/`failed` dùng cho overlay Generating và tab Processing/Failed */
  status: 'ready' | 'processing' | 'failed';
  duration: string;
  createdAt: string;
}

/** Tên product để gán cho video — lấy từ `catalogProducts` cho khớp nhau */
const PRODUCT_POOL = [
  'Linen wide-leg trousers',
  'Oversized cotton shirt',
  'Everyday leather tote',
  'Silk slip dress',
  'Cropped denim jacket',
];

const RAW: [string, Video['source'], number, number, number, number][] = [
  ['Summer haul — 5 pieces I actually wear', 'TikTok', 3, 48210, 142, 8940],
  ['Unboxing the linen set', 'Instagram', 2, 31420, 98, 6120],
  ['How I style the wide-leg trousers', 'TikTok', 4, 27840, 74, 4680],
  ['AI creator — testimonial, EN', 'AI Studio', 1, 19230, 61, 3810],
  ['Behind the fabric sourcing', 'Upload', 0, 15680, 44, 2740],
  ['Customer review — the everyday tote', 'Instagram', 1, 12940, 38, 2380],
  ['AI creator — unboxing, VI', 'AI Studio', 2, 10120, 29, 1810],
  ['Three ways to wear the scarf', 'TikTok', 3, 8740, 22, 1370],
  ['Packing for a weekend trip', 'Instagram', 5, 7210, 18, 1120],
  ['The knit everyone asks about', 'Upload', 1, 6480, 14, 870],
  ['AI creator — casual vlog, ES', 'AI Studio', 0, 4920, 9, 560],
  ['Restock: the cotton shirt', 'TikTok', 2, 3810, 6, 370],
  ['Morning routine with the robe', 'Instagram', 2, 3420, 5, 310],
  ['Why we switched to organic cotton', 'Upload', 0, 2980, 4, 250],
  ['Styling the oversized blazer', 'TikTok', 3, 2640, 4, 240],
  ['AI creator — product demo, EN', 'AI Studio', 1, 2210, 3, 180],
  ['Fit check: the petite range', 'Instagram', 4, 1870, 3, 170],
  ['How the wrap dress ties', 'TikTok', 1, 1540, 2, 120],
  ['Care guide: washing linen', 'Upload', 0, 1280, 1, 60],
  ['Behind the scenes — studio day', 'Instagram', 0, 980, 1, 50],
  ['AI creator — testimonial, FR', 'AI Studio', 1, 740, 1, 40],
  ['New colourway reveal', 'TikTok', 2, 520, 0, 0],
  ['Draft: autumn preview', 'Upload', 0, 0, 0, 0],
  ['Draft: collab teaser', 'Instagram', 0, 0, 0, 0],
];

/**
 * Tỉ lệ chuyển giữa các bước của phễu — chọn sao cho phễu rớt dần đều và cỡ số
 * khớp với thứ tự độ lớn app thật đang đo. Đặt ở MỘT chỗ để mọi con số trên
 * Analytics derive từ đây, không ai được hardcode thêm một tổng thứ hai.
 */
const CLICK_RATE = 0.086; // widget load → click vào video  (= Action rate)
const VISIT_RATE = 0.62; //  click → mở trang product
const CART_RATE = 0.36; //   product visit → add to cart
const BUY_NOW_RATE = 0.18; // add to cart → bấm Buy now (đường tắt, không phải bước phễu)

export const videos: Video[] = RAW.map(
  ([title, source, productCount, views, orders, revenue], i) => {
    const itemClicks = Math.round(views * CLICK_RATE);
    const productVisits = Math.round(itemClicks * VISIT_RATE);
    const addToCart = Math.round(productVisits * CART_RATE);

    return {
    id: `v-${i + 1}`,
    title,
    source,
    // Tên product THẬT thay vì một con số — thẻ và bảng hiện được "Linen wide-leg
    // trousers" chứ không phải "3", và merchant biết ngay video nói về cái gì
    products: Array.from({length: productCount}, (_, n) => PRODUCT_POOL[(i + n) % PRODUCT_POOL.length]),
    views,
    orders,
    revenue,
    itemClicks,
    productVisits,
    addToCart,
    buyNow: Math.round(addToCart * BUY_NOW_RATE),
    // Cố ý có video KHÔNG nằm trong widget nào → shopper không thấy nó ở đâu cả,
    // mà app hiện tại chỉ để "Not placed" làm một chip trung tính, không nhắc gì
    //
    // `i < 21` để video cuối cùng của nhóm đó (New colourway reveal: 520 view, 0 đơn)
    // VẪN live: đó là mẫu duy nhất cho trường hợp "có click mà không ra đơn nào" —
    // video đang chạy nhưng không chuyển đổi. Không có mẫu này thì cột "Needs
    // attention" của Analytics hứa ba lý do mà chỉ hiện được một.
    // Rải đều qua CẢ 6 widget. Bản trước chỉ gán vào w-1/w-2 nên 4 thẻ còn lại trên trang
    // Widgets không có thumbnail nào để dựng hình dạng.
    widgets:
      title.startsWith('Draft:') || (i % 7 === 0 && i < 21)
        ? []
        : i % 5 === 0
          ? [widgetList[0].name, widgetList[(i % 5) + 1].name]
          : [widgetList[i % widgetList.length].name],
    status: 'ready',
    duration: `0:${String(18 + (i % 40)).padStart(2, '0')}`,
    createdAt: `${(i % 28) + 1} Jul 2026`,
    };
  },
);

/**
 * Video có mặt trên storefront — CHỈ những video này sinh ra sự kiện và đơn.
 *
 * Home tính KPI trên đúng tập này (`app._index.tsx:309-318`), nên Analytics phải
 * dùng chung định nghĩa: hai trang nói hai con số cho cùng một metric là merchant
 * mất niềm tin vào cả hai.
 */
export const liveVideos = videos.filter((video) => video.widgets.length > 0);

/**
 * Việc cần làm trên một video — dùng cho cột "Needs attention" của Analytics và
 * cảnh báo của Library.
 *
 * Xếp theo mức thiệt hại, KHÔNG phải theo thứ tự trạng thái: video không nằm
 * trong widget nào thì không ai xem được nó, tệ hơn hẳn việc chưa tag product.
 * Trả về `null` = không có việc gì phải làm.
 */
export function needsAttention(video: Video): string | null {
  if (video.status !== 'ready') return null;
  if (video.widgets.length === 0) return 'Not in any widget';
  if (video.products.length === 0) return 'No products tagged';
  // Có người bấm vào mà không ra đơn nào — thường là tag sai product hoặc hết hàng
  if (video.itemClicks > 0 && video.orders === 0) return 'Clicks but no orders';
  return null;
}

/** Tổng của một tập video — nguồn DUY NHẤT cho mọi con số trên Analytics */
export function totalsOf(list: Video[]) {
  return list.reduce(
    (sum, video) => ({
      views: sum.views + video.views,
      itemClicks: sum.itemClicks + video.itemClicks,
      productVisits: sum.productVisits + video.productVisits,
      addToCart: sum.addToCart + video.addToCart,
      buyNow: sum.buyNow + video.buyNow,
      orders: sum.orders + video.orders,
      revenue: sum.revenue + video.revenue,
    }),
    {views: 0, itemClicks: 0, productVisits: 0, addToCart: 0, buyNow: 0, orders: 0, revenue: 0},
  );
}

/**
 * Playlist của một widget — suy ra từ `video.widgets`, MỘT nguồn sự thật duy nhất
 * (không nhân đôi thành `Widget.videoIds` rồi để hai bên lệch nhau).
 */
export function playlistFor(widgetName: string) {
  return videos.filter((video) => video.widgets.includes(widgetName));
}

/**
 * `videoCount` phải LÀ độ dài playlist thật, không phải số gõ tay.
 *
 * Bắt được 06 Aug 2026: thẻ trên trang Widgets ghi "18 videos" trong khi trang detail của
 * đúng widget đó liệt kê 12 — hai con số cho cùng một thứ ở hai trang. Gán lại ở đây để
 * không bao giờ lệch lại được.
 *
 * `widgetsOverload` giữ số tổng hợp: đó là widget giả cho state overload, không có playlist
 * thật trong `videos`.
 */
widgetList.forEach((widget) => {
  widget.videoCount = playlistFor(widget.name).length;
});

/** Tổng thật trên server — dùng cho overload state */
export const TOTAL_VIDEOS = 543;

export function thumb(id: string, size = 120) {
  return `https://picsum.photos/seed/makeugc-${id}/${size}/${size}`;
}

/* ════════════════════════════════════════════════════════════════════════════
   ANALYTICS
   ────────────────────────────────────────────────────────────────────────────
   MỌI series dưới đây SINH RA từ `totalsOf(liveVideos)`, không có số nào gõ tay.

   Vì sao gắt: bản trước hardcode ba tổng doanh thu khác nhau trên cùng một trang
   — KPI $34.180, tổng series chart $74.520, tổng `videos` $36.190 — và phễu thì
   dùng view trọn đời đứng cạnh KPI 30 ngày. Merchant enterprise đối chiếu
   Analytics với báo cáo Shopify; trang tự mâu thuẫn là mất niềm tin vào toàn bộ
   attribution, đúng north-star metric của roadmap.
   ════════════════════════════════════════════════════════════════════════════ */

/** Hình dáng một tháng có xu hướng tăng + nhấp nhô theo tuần. Chỉ là TRỌNG SỐ,
 *  không phải giá trị — giá trị thật do `distribute()` chia ra từ tổng. */
const DAY_SHAPE = [
  59, 66, 50, 73, 81, 69, 86, 95, 82, 101, 112, 99, 116, 124, 110,
  128, 137, 124, 141, 151, 138, 157, 169, 155, 171, 181, 164, 187, 196, 209,
];

export const DAY_LABELS = DAY_SHAPE.map((_, i) => `Jul ${i + 1}`);

/**
 * Chia `total` ra 30 ngày theo `DAY_SHAPE` sao cho **tổng lại đúng bằng `total`**.
 * Phần dư sau khi làm tròn xuống được rải vào các ngày cuối, không vứt đi —
 * vứt đi là chart và KPI lệch nhau vài đơn vị, và enterprise sẽ hỏi đúng chỗ đó.
 */
function distribute(total: number): number[] {
  const weightSum = DAY_SHAPE.reduce((a, b) => a + b, 0);
  const out = DAY_SHAPE.map((w) => Math.floor((total * w) / weightSum));
  let rest = total - out.reduce((a, b) => a + b, 0);
  for (let i = out.length - 1; rest > 0; i -= 1, rest -= 1) out[i] += 1;
  return out;
}

const LIVE_TOTALS = totalsOf(liveVideos);

/** Kỳ trước — dùng cho delta "+18.2%" của KPI. Một baseline, dùng lại mọi chỗ. */
export const PERIOD_GROWTH = 0.182;
const PREVIOUS_REVENUE = Math.round(LIVE_TOTALS.revenue / (1 + PERIOD_GROWTH));

const toSeries = (name: string, values: number[]) => ({
  name,
  data: values.map((value, i) => ({key: DAY_LABELS[i], value})),
});

/** Line chart doanh thu — series kỳ này + kỳ trước, để delta có baseline nhìn thấy */
export const revenueChartData = [
  toSeries('This period', distribute(LIVE_TOTALS.revenue)),
  toSeries('Previous period', distribute(PREVIOUS_REVENUE)),
];

/** Line chart "Daily events" — 4 series y như app thật, xếp theo hành trình shopper */
export const dailyEventsChartData = [
  toSeries('Item clicks', distribute(LIVE_TOTALS.itemClicks)),
  toSeries('Product visits', distribute(LIVE_TOTALS.productVisits)),
  toSeries('Add to cart', distribute(LIVE_TOTALS.addToCart)),
  toSeries('Buy now', distribute(LIVE_TOTALS.buyNow)),
];

/**
 * Phễu — thay cho "Event mix" của app.
 *
 * "Event mix" là bar chart hiện ĐÚNG bốn con số đã có ở KPI row phía trên: một
 * thông tin nói hai lần. Phễu thêm được thứ duy nhất tile không nói được là rớt
 * ở bước nào. `Buy now` KHÔNG có mặt ở đây — nó là đường tắt song song, nhét vào
 * giữa phễu thì tổng không còn cộng được.
 */
export const funnelChartData = [
  {
    name: 'Shopper journey',
    data: [
      {key: 'Item clicks', value: LIVE_TOTALS.itemClicks},
      {key: 'Product visits', value: LIVE_TOTALS.productVisits},
      {key: 'Add to cart', value: LIVE_TOTALS.addToCart},
      {key: 'Orders', value: LIVE_TOTALS.orders},
    ],
  },
];

export type EventType = 'Item click' | 'Product visit' | 'Add to cart' | 'Buy now' | 'Order';

/**
 * Recent activity — app thật hiện `Item click #15946140254577`, tức là một chuỗi
 * số merchant không làm gì được, và hai dòng cùng ID đọc ra như lỗi lặp. Ở đây
 * mỗi dòng nói TÊN VIDEO + product liên quan; id chỉ còn là link.
 */
export const recentEvents: {id: string; videoId: string; type: EventType; ago: string}[] = [
  ['v-1', 'Order', '4m ago'],
  ['v-3', 'Add to cart', '11m ago'],
  ['v-1', 'Item click', '12m ago'],
  ['v-2', 'Product visit', '25m ago'],
  ['v-6', 'Item click', '31m ago'],
  ['v-2', 'Buy now', '48m ago'],
  ['v-4', 'Add to cart', '1h ago'],
  ['v-9', 'Item click', '1h ago'],
  ['v-3', 'Product visit', '2h ago'],
  ['v-1', 'Order', '2h ago'],
  ['v-13', 'Item click', '3h ago'],
  ['v-5', 'Product visit', '3h ago'],
  ['v-2', 'Add to cart', '4h ago'],
  ['v-8', 'Item click', '5h ago'],
  ['v-4', 'Product visit', '6h ago'],
  ['v-10', 'Item click', '8h ago'],
  ['v-6', 'Add to cart', '9h ago'],
  ['v-1', 'Product visit', '11h ago'],
  ['v-16', 'Item click', '14h ago'],
  ['v-3', 'Order', '1d ago'],
].map(([videoId, type, ago], i) => ({
  id: `e-${i + 1}`,
  videoId: videoId as string,
  type: type as EventType,
  ago: ago as string,
}));

/**
 * Setup guide của HOME — 4 bước, con đường merchant **Free Forever** đi được.
 *
 * Vì sao 4 bước này chứ không phải "Generate a product video" như app hiện tại:
 * plan mặc định là Free Forever với 0 credit, còn AI Studio là "Growth plan up"
 * (roadmap Phase 0) → đặt AI làm bước 1 là dẫn merchant vào tường ngay lần
 * install đầu tiên, và activation metric (install → first video live dưới 10 phút)
 * chết ở đó. Free path là: import/upload → tag product → widget → theme.
 *
 * Bước `tag` là bước app thật đang THIẾU hoàn toàn trong setup guide. Video không
 * tag product thì shopper không mua được gì — đó là bước biến video thành đơn.
 *
 * KHÔNG kể bước "Install": đã xong lúc merchant nhìn thấy guide, đếm vào progress
 * là tự cộng điểm cho mình.
 *
 * Tổng `minutes` = 9 → khớp mục tiêu roadmap "under 10 minutes", và con số đó phải
 * hiện trên UI. Bước nào phình ra thì nói ra, đừng giấu.
 */
export const setupSteps = [
  {
    id: 'add',
    label: 'Add your first video',
    done: false,
    minutes: 2,
    /** Vì sao bước này đứng đầu: dễ nhất, không cần credit, kéo momentum */
    why: 'Import from TikTok or Instagram, or upload a file. Nothing goes live yet.',
    ctaLabel: 'Open Library',
    href: '/app/library',
  },
  {
    id: 'tag',
    label: 'Tag a product in the video',
    done: false,
    minutes: 3,
    why: 'A video with no tagged product has nothing to buy. This is the step that turns a view into an order.',
    ctaLabel: 'Tag products',
    href: '/app/library',
  },
  {
    id: 'widget',
    label: 'Create a widget and choose where it appears',
    done: false,
    minutes: 2,
    why: 'Pick a format — carousel, stories bar, or floating player — and the pages it shows on.',
    ctaLabel: 'Manage widgets',
    href: '/app/widgets',
  },
  {
    id: 'theme',
    label: 'Add the widget to your theme',
    done: false,
    minutes: 2,
    why: 'The widget is a theme app block. Add it once and every video you publish shows up there.',
    ctaLabel: 'Open theme editor',
    // In real app: deep link Shopify theme editor
    // `/admin/themes/current/editor?context=apps&addAppBlockId=${EXTENSION_UUID}/${BLOCK_HANDLE}`
    // → cần Duong điền EXTENSION_UUID + handle app block thật.
    href: '/app/widgets',
  },
];

/**
 * Surface của storefront mà widget có thể xuất hiện.
 *
 * Tên PHẢI đúng tên surface chính thức của Shopify (`MAKEUGC-UI-PATTERNS.md` §5).
 * Gọi Product page là "PDP" làm merchant tìm sai chỗ trong theme editor.
 *
 * Thay cho tile "Live on store 0" của app hiện tại: một con số 0 không nói được
 * merchant thiếu gì, còn bảng này nói thẳng surface nào chưa có widget.
 */
export const storeSurfaces: {surface: string; live: boolean; videoCount: number}[] = [
  {surface: 'Product page', live: true, videoCount: 18},
  {surface: 'Home page', live: true, videoCount: 6},
  {surface: 'Collection page', live: false, videoCount: 0},
  {surface: 'Cart page', live: false, videoCount: 0},
];

/**
 * Preview widget trên storefront — dùng cho first-run ("Most used formats").
 *
 * Vì sao cần: app hiện tại ở lần install đầu là 100% chữ + 4 con số 0, với một ô
 * vuông trắng làm illustration (nhìn như ảnh load lỗi). Đây là app về VIDEO —
 * merchant phải thấy được thứ mình sắp bán trông thế nào.
 *
 * ✅ 06 Aug 2026: tên 6 template đã verify (xem `widgetTemplates`). Bản trước ghi
 * "Carousel / Stories bar / Floating player" — BA cái tên không tồn tại trong app, tức
 * Home đang dạy merchant một vốn từ rồi trang Widgets nói bằng vốn từ khác. Giờ lấy
 * thẳng từ `widgetTemplates` nên không lệch được nữa.
 *
 * Vẫn là 3/6 (Home chỉ giới thiệu, có CTA "See all 6 formats" sang Widgets).
 *
 * In real app: thay placeholder bằng ảnh/video demo thật do design cung cấp.
 */
export const widgetPreviews = ['product-stories', 'carousel', 'bubble'].map((id) => {
  const template = templateFor(id);
  // `primarySurface` chứ không phải `placement`: xem lý do ở định nghĩa field
  return {id: template.id, label: template.name, caption: template.primarySurface};
});

/**
 * ⚠️ STALE — chỉ còn `app.onboarding.tsx` dùng.
 *
 * IA app thật không có trang Onboarding riêng: setup guide sống trên Home
 * (`setupSteps` ở trên). Giữ lại để route cũ còn typecheck, xoá cùng lúc xoá route đó.
 */
export const onboardingSteps = [
  {
    id: 'import',
    label: 'Import your first video',
    done: true,
    minutes: 2,
    /** Vì sao bước này đứng đầu: dễ nhất, kéo momentum */
    why: 'Connect TikTok or Instagram and we pull your videos in. Nothing goes live yet.',
  },
  {
    id: 'tag',
    label: 'Tag a product in the video',
    done: false,
    minutes: 3,
    why: 'A video without a tagged product has nothing to buy. This is the step that turns a video into a sale.',
  },
  {
    id: 'publish',
    label: 'Add the player to your store',
    done: false,
    minutes: 4,
    why: 'The player is a theme app block. You add it once in your theme editor, then every video you publish shows up there.',
  },
];

/**
 * SETTINGS → CONNECTIONS — account social merchant nối để tự kéo video về.
 *
 * Stella chốt 06 Aug 2026: app thật có tab `Connections` trong Settings, cho merchant
 * nối IG/TikTok để **auto sync**. Đây là mảnh trả lời open question 4c (Library có
 * import TikTok/IG chưa hay chỉ upload).
 *
 * ⚠️ HAI THỨ KHÁC NHAU, cố ý tách thành 2 field:
 *   - `autoSync` + `scope`  → liên tục, post MỚI từ giờ trở đi
 *   - `earlierPosts`        → backfill MỘT LẦN, post CŨ đã có trên account
 * Gộp chung là lý do merchant bấm Connect rồi bị 143 video ngập Library mà không
 * hiểu vì sao. Con số 143 lấy trùng `importSource.videosFound` cho nhất quán.
 *
 * ⏳ GIẢ ĐỊNH cần Duong xác nhận:
 *   - Video sync về nằm ở Library **chưa vào widget nào** (theo §3d: publish = gán
 *     tay vào widget). Nếu backend tự publish thì mockup này sai và nguy hiểm —
 *     video chưa tag product lên storefront là lỗi im lặng tệ nhất của app.
 *   - Tần suất check 6 giờ.
 *   - Token IG/TikTok hết hạn sau bao lâu (dùng ~60 ngày làm cơ sở cho state
 *     `reconnect-needed`, nhưng UI KHÔNG hardcode chu kỳ — chỉ nói "12 days ago").
 */
export interface SocialConnection {
  id: string;
  handle: string;
  network: 'TikTok' | 'Instagram';
  /**
   * Logo của MẠNG (không phải avatar của account) — file local trong `public/logos/`.
   *
   * Stella chốt 06 Aug 2026: logo thay luôn pill `<s-badge>TikTok</s-badge>`, vì logo
   * đã nói mạng nào rồi. ⚠️ Hệ quả a11y: tên mạng **không còn** ở dạng text nào trên
   * trang → `alt` của ảnh PHẢI là tên mạng, chứ không được để `alt=""`. Bỏ pill là
   * chuyển thông tin đó vào alt, không phải xoá nó đi.
   */
  logo: string;
  /**
   * `expired` là state ĐÁNG GIÁ NHẤT của trang: token hết hạn thì auto-sync
   * **dừng im lặng** — merchant không mất gì thấy được, chỉ đơn giản là hết video
   * mới. Cùng lớp lỗi với "video live nhưng chưa tag product".
   */
  status: 'healthy' | 'expired' | 'paused' | 'syncing';
  lastSyncedLabel: string;
  /** Video đã kéo về — số này phải xuất hiện trong confirm Disconnect */
  videosImported: number;
  autoSync: boolean;
  scope: 'all' | 'hashtag' | 'manual';
  hashtag: string;
  /** Post cũ chưa kéo về — backfill một lần, KHÔNG phải auto-sync */
  earlierPosts: number;
}

export const socialConnections: SocialConnection[] = [
  {
    id: 'sc-1',
    handle: '@northlinestudio',
    network: 'TikTok',
    logo: '/logos/tiktok.svg',
    status: 'healthy',
    lastSyncedLabel: '4 minutes ago',
    videosImported: 47,
    autoSync: true,
    scope: 'all',
    hashtag: '',
    earlierPosts: 143,
  },
  {
    id: 'sc-2',
    handle: '@northline.official',
    network: 'Instagram',
    logo: '/logos/instagram.svg',
    status: 'healthy',
    lastSyncedLabel: '2 hours ago',
    videosImported: 12,
    // Cố ý khác account trên: scope hashtag để lộ layout khi có text field lồng
    // trong choice list, và để thấy hai account cấu hình khác nhau trông thế nào
    autoSync: true,
    scope: 'hashtag',
    hashtag: 'northlineugc',
    earlierPosts: 61,
  },
];

/**
 * SETTINGS → INTEGRATIONS — app thứ ba tiêu thụ data của MakeUGC.
 *
 * ⚠️ CHỈ CÓ MỘT ROW CÓ TÊN THẬT. Stella nói tab này còn "các app khác" nhưng chưa
 * cấp danh sách → **không bịa tên**. Merchant đọc tên app trong Settings rồi đi tìm
 * đúng tên đó; đặt sai tên là gửi họ đi sai chỗ (đúng bài học `widgetPreviews`).
 * Row pattern dựng để scale N cái: thêm integration = thêm phần tử, không sửa layout.
 *
 * Triple Whale là **launch dependency** (roadmap dòng 17: "MVP has no native
 * analytics") và đã được claim trong listing đã submit (`app-listing-v1-submission.md`
 * dòng 29) → đây là integration duy nhất BẮT BUỘC có trước khi review.
 */
export interface Integration {
  id: string;
  name: string;
  /** Nhóm hiển thị — list sẽ dài, nhóm theo việc merchant đang muốn làm */
  category: string;
  /**
   * Logo — file SVG **local** trong `public/logos/`, KHÔNG lấy từ CDN của họ:
   * mockup mất mạng là vỡ, và hotlink asset bên thứ ba thì không kiểm soát được.
   *
   * ⏳ `triple-whale` · `okendo` · `yotpo` là bản **XẤP XỈ tôi tự vẽ** cho đúng màu và
   * hình dáng thương hiệu. Trước khi dùng ra ngoài (screenshot listing, deck) phải xin
   * asset chính thức từ media kit của họ — đây là chuyện trademark, không phải thẩm mỹ.
   */
  logo: string;
  summary: string;
  /** Nói rõ data GÌ rời khỏi store — enterprise sẽ hỏi TRƯỚC khi bấm Connect */
  dataSent: string;
  /**
   * `null` = mọi plan. KHÔNG tự đặt: `PLANS.starter.adds` có **đúng một** dòng là
   * *"Triple Whale attribution integration"* → Free Forever **không** connect được TW.
   * Đó là lý do state `plan-gated` là state THẬT của trang này, không phải trang trí.
   */
  minPlan: null | 'starter' | 'growth' | 'scale';
  /**
   * `live` = connect được ngay · `planned` = có trong roadmap, CHƯA build.
   * `planned` cố ý KHÔNG có ngày: "coming soon" kèm ngày đoán là lời hứa sai, còn
   * "coming soon" không kèm gì thì sinh ticket "khi nào?". Nói đúng trạng thái.
   */
  availability: 'live' | 'planned';
  /** Chỉ có nghĩa với `live` — backfill khi reconnect, biến "mất data" thành "lấy lại được" */
  backfillDays?: number;
  /** Vì sao chưa build — viết bằng lợi ích merchant hiểu, không bằng số phase */
  plannedNote?: string;
}

/**
 * ⚠️ **MỌI TÊN Ở ĐÂY ĐỀU CÓ NGUỒN — không tự đặt.** Merchant đọc tên app trong
 * Settings rồi đi tìm đúng tên đó, nên bịa tên là gửi họ đi sai chỗ:
 *   - Triple Whale → roadmap dòng 17 (launch dependency) + `PLANS.starter.adds`
 *   - Okendo / Yotpo → roadmap dòng 51 *"Reviews-app integration live (Okendo or
 *     Yotpo — scoped display + social-proof badge)"*, Phase 2
 * Thêm row nào ngoài 3 cái này thì phải có nguồn tương đương — đừng độn cho list đỡ trống.
 */
export const integrations: Integration[] = [
  {
    id: 'triple-whale',
    name: 'Triple Whale',
    category: 'Analytics and attribution',
    logo: '/logos/triple-whale.svg',
    summary:
      'Sends video view and click events to Triple Whale so video appears alongside your other channels in multi-touch attribution.',
    dataSent: 'video view and click events',
    minPlan: 'starter',
    availability: 'live',
    backfillDays: 30,
  },
  {
    id: 'okendo',
    name: 'Okendo',
    category: 'Reviews',
    logo: '/logos/okendo.svg',
    summary:
      'Shows the star rating of a tagged product on its video card, so shoppers see reviews and video together.',
    dataSent: 'the products tagged in your videos',
    minPlan: null,
    availability: 'planned',
    plannedNote: 'Not available yet. Star ratings on video cards are planned for a later release.',
  },
  {
    id: 'yotpo',
    name: 'Yotpo',
    category: 'Reviews',
    logo: '/logos/yotpo.svg',
    summary:
      'Shows the star rating of a tagged product on its video card, so shoppers see reviews and video together.',
    dataSent: 'the products tagged in your videos',
    minPlan: null,
    availability: 'planned',
    plannedNote: 'Not available yet. Star ratings on video cards are planned for a later release.',
  },
];

/** Nhóm theo category, giữ thứ tự khai báo — list dài ra thì không phải sửa route */
export const integrationCategories = integrations.reduce<Record<string, Integration[]>>(
  (acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  },
  {},
);

/** Account đã connect ở bước 1 — con số cố ý LỚN để lộ vấn đề chọn video nào import */
export const importSource = {
  handle: '@northlinestudio',
  network: 'TikTok',
  videosFound: 143,
  batchSize: 5,
};

/** Theme của merchant — bước 3 phụ thuộc hoàn toàn vào việc theme có hỗ trợ app block không */
export const storeTheme = {
  supported: {name: 'Refresh', version: 'Online Store 2.0'},
  unsupported: {name: 'Debut', version: 'Online Store 1.0'},
};

export const taggedProducts = [
  {
    id: 'p-1',
    title: 'Linen wide-leg trousers',
    variant: 'Sand / M',
    price: '$89.00',
    timestamp: '0:04',
    available: true,
    orders: 61,
  },
  {
    id: 'p-2',
    title: 'Oversized cotton shirt',
    variant: 'White / S',
    price: '$64.00',
    timestamp: '0:12',
    available: true,
    orders: 48,
  },
  {
    id: 'p-3',
    title: 'Everyday leather tote',
    variant: 'Tan',
    price: '$148.00',
    timestamp: '0:21',
    available: true,
    orders: 33,
  },
];

/**
 * Catalog của merchant — nguồn vào của AI Studio.
 *
 * AI Studio thật hoạt động theo mô hình **catalog image → video**: chọn product,
 * chọn ảnh nào của product đó, mỗi ảnh = 1 credit = 1 video. KHÔNG có script,
 * KHÔNG có creator, KHÔNG có language (xem `MAKEUGC-UI-PATTERNS.md`).
 *
 * Cố ý có:
 *  - **product 0 ảnh** → dead-end im lặng nếu UI không xử lý: merchant chọn xong
 *    rồi không generate được mà không hiểu vì sao
 *  - product **6 ảnh** → "Select all images" một cú ra 6 credit, nhân với nhiều
 *    product là con số lớn bất ngờ
 *  - đủ 22 product để lộ vấn đề layout khi merchant chọn nhiều
 */
export interface CatalogProduct {
  id: string;
  title: string;
  imageCount: number;
}

const CATALOG_RAW: [string, number][] = [
  ['The 3p Fulfilled Snowboard', 1],
  ['The Collection Snowboard: Liquid', 4],
  ['Linen wide-leg trousers', 6],
  ['Oversized cotton shirt', 3],
  ['Everyday leather tote', 5],
  ['The Multi-managed Snowboard', 2],
  ['Merino wool scarf', 0],
  ['Cropped denim jacket', 4],
  ['Ribbed knit tank', 2],
  ['Structured blazer', 3],
  ['Silk slip dress', 5],
  ['Canvas weekender bag', 1],
  ['Chunky sole loafers', 4],
  ['Cashmere crew neck', 0],
  ['Pleated midi skirt', 3],
  ['Organic cotton robe', 2],
  ['Wide-brim straw hat', 1],
  ['Recycled puffer vest', 4],
  ['Tailored wool coat', 6],
  ['Leather card holder', 2],
  ['Cotton poplin shirt dress', 3],
  ['Suede ankle boots', 5],
];

export const catalogProducts: CatalogProduct[] = CATALOG_RAW.map(([title, imageCount], i) => ({
  id: `p-${i + 1}`,
  title,
  imageCount,
}));

/** Ảnh của một product — seed theo id nên ảnh không nhảy giữa các render */
export function productImage(productId: string, index: number, size = 200) {
  return `https://picsum.photos/seed/makeugc-${productId}-${index}/${size}/${size}`;
}

/**
 * Preset prompt — bấm là ĐIỀN vào textarea rồi sửa tiếp được.
 *
 * Cố ý không phải "mode" ẩn: merchant phải thấy đúng chuỗi được gửi đi. Preset kiểu
 * này còn dạy merchant viết prompt tốt hơn bằng ví dụ, thay vì để họ đoán.
 *
 * ⏳ Text mẫu là ĐỀ XUẤT — cần Duong đối chiếu với prompt provider thật đang dùng.
 */
export const promptPresets = [
  {
    id: 'demo',
    label: 'Product demo',
    text: 'Show the product from several angles in natural daylight. Slow, steady camera movement. Focus on texture and fit.',
  },
  {
    id: 'unboxing',
    label: 'Unboxing',
    text: 'Hands opening the packaging on a plain table, taking the product out and holding it up to the camera.',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    text: 'The product in everyday use at home, warm afternoon light, relaxed and unstaged.',
  },
  {
    id: 'detail',
    label: 'Close-up detail',
    text: 'Very close on the material, stitching and hardware. Shallow depth of field, slow pan.',
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   GIÁ MỘT VIDEO — hằng số nối Billing với AI Studio
   ────────────────────────────────────────────────────────────────────────────
   Khai báo Ở ĐÂY, TRÊN `PLANS`, chứ không ở khối AI Studio phía dưới: `PLAN_FEATURES`
   chạy `PLANS.map()` ngay lúc load module để tính số video mỗi plan, mà `const` phía
   dưới thì còn trong TDZ → đọc là ReferenceError. Bẫy này typecheck KHÔNG bắt.
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Giá MỘT video: **150 credits** (Stella chốt 08 Aug 2026).
 * Khớp nút "Recreate (150 credits)" trên screenshot platform.
 *
 * Dùng CHUNG cho: nhãn ở gallery · nút Generate ở compose · và số video/tháng in trên
 * trang Billing. Ba chỗ tính riêng là ba số lệch nhau — cách nhanh nhất để merchant
 * mất tin vào bảng giá.
 *
 * ⚠️ Tab **Product video** lại tính **1 credit = 1 video** (`app.ai-studio.product.tsx`).
 * Hai giá cho hai loại video là chuyện có thật, nhưng nghĩa là số video in trên trang
 * Billing chỉ đúng cho **Creator video**. Cần Duong chốt cách nói một câu cho merchant.
 */
export const VIDEO_CREDITS = 150;

/**
 * Số video/tháng suy từ credit của plan. Làm tròn XUỐNG: hứa 13 rồi chỉ làm được 13,33
 * thì không ai phàn nàn, hứa 14 mà hết credit ở video thứ 14 là support ticket.
 */
export const videosFromCredits = (credits: number) => Math.floor(credits / VIDEO_CREDITS);

/**
 * ═══ NGUỒN SỰ THẬT: Notion → Execution Plan → **Tactic 2 · Pricing proposal** ═══
 * https://app.notion.com/p/3ad902b339da8112a03fdfef4b00aa8a
 *
 * Đối chiếu và viết lại 06 Aug 2026 theo chỉ đạo của Stella ("cứ giống trong Pricing
 * proposal của Notion là được"). Mọi con số/tên tính năng dưới đây copy từ bảng
 * *"Pricing - as it appears on the app listing"* và *"Feature comparison by plan"*.
 *
 * Bản mockup trước LỆCH KHỎI NOTION ở 6 chỗ, đều theo hướng bán thiếu:
 *
 * ⚠️ **PRICING ĐÃ ĐỔI 13 Aug 2026 (Stella), KHÔNG còn khớp Notion:**
 * Starter 0 → **300** · Growth 500 → **2.000** · Scale 2.500 → **4.500**. Và bỏ hẳn
 * "Custom AI creator — your own brand actor" vì tính năng đó không tồn tại.
 * Hệ quả kéo theo đã xử lý: AI Studio bắt đầu từ **Starter**, `isGrowthUp()` thay cho
 * proxy `credits > 0`, thẻ + bảng in thêm số video ở 150 credit/video.
 * Notion cần cập nhật lại theo đây, không phải ngược lại.
 *
 * | Chỗ lệch | Mockup cũ | Notion |
 * |---|---|---|
 * | Credit của Growth | 50 | **~500** (lệch 10×) |
 * | Triple Whale | từ Starter | **từ Growth** |
 * | Widget của Starter | 3 | **Unlimited** |
 * | Credit rollover | "don't roll over" | **CÓ rollover** trên Growth/Scale |
 * | Bỏ branding · sync review · custom AI creator · migration | không có | **có, và là differentiator chính** |
 *
 * ⚠️ **HAI chỗ Notion nói khác, và quyết định của Stella THẮNG doc** — Notion tự ghi
 * mình mới ở mức *"Ready for review (numbers are placeholders)"*, chưa BOD duyệt:
 *  1. **Trial** — Notion ghi *"14-day free trial on paid plans"*. Stella chốt lại
 *     06 Aug 2026: **KHÔNG có trial**, Free Forever thay trial. → bảng so sánh KHÔNG
 *     có dòng trial, và không vẽ state trial nào.
 *  2. **Image generation** — Notion ghi *"Create AI videos & images"*. Stella chốt
 *     05 Aug bỏ hẳn image (không vào được vòng video → widget → revenue nhưng tiêu
 *     chung pool credit). → chỉ ghi "AI videos".
 *
 * ⚠️ Notion tự ghi *"Status: Ready for review (numbers are placeholders)"* + cần BOD
 * duyệt. Nên đây là "khớp với đề xuất mới nhất", KHÔNG phải "pricing đã chốt".
 *
 * `adds` = cột *Includes* của Notion — phần plan này thêm SO VỚI plan bên trái.
 */
export interface Plan {
  id: string;
  name: string;
  price: number;
  /** Credit AI/tháng. `0` = plan không có AI Studio (khác "hết credit") */
  credits: number;
  /** Credit có cộng dồn sang kỳ sau không (Notion: chỉ Growth/Scale) */
  creditRollover: boolean;
  /** Cột "For" của Notion — một dòng: plan này cho ai */
  blurb: string;
  /** Cột "Includes" của Notion */
  adds: string[];
  popular: boolean;
  /** Số widget tối đa. `null` = không giới hạn */
  widgetLimit: number | null;
  /** Số video shoppable tối đa. `null` = không giới hạn */
  videoLimit: number | null;
  /** Bỏ được nhãn "Powered by MakeUGC" trên widget không */
  removeBranding: boolean;
}

/**
 * Giá trị đặc biệt của bảng so sánh: tính năng **CHƯA BUILD**, nhưng khi ship sẽ thuộc
 * plan này (Stella 13 Aug 2026 — Triple Whale + sync review đều chưa có).
 *
 * Vì sao KHÔNG để ✓: ✓ là lời hứa merchant trả tiền hôm nay để đổi lấy. Và vì sao không
 * xoá hẳn như "Custom AI creator": hai cái này CÓ trên lộ trình, xoá đi thì Growth mất
 * differentiator thật của nó. `—` cũng sai — nó đọc thành "plan này sẽ không bao giờ có".
 *
 * `FeatureValue` bắt đúng chuỗi này và render badge `info` thay vì text thường.
 *
 * ⚠️ Khai báo TRÊN `PLANS` vì `PLANS.adds` dùng `COMING_SOON_SUFFIX` ngay lúc load
 * module — để dưới là TDZ ReferenceError, và typecheck KHÔNG bắt lỗi đó.
 */
export const COMING_SOON = 'Coming soon';

/**
 * Hậu tố đánh dấu bullet coming-soon trên THẺ plan. Một nguồn duy nhất cho cả chỗ viết
 * (`PLANS.adds`) lẫn chỗ đọc (`app.billing.tsx` đổi icon ✓ → ⏱), để không có thẻ nào
 * hiện dấu ✓ xanh cạnh một tính năng chưa build.
 */
export const COMING_SOON_SUFFIX = ' — coming soon';

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Forever',
    price: 0,
    credits: 0,
    creditRollover: false,
    blurb: 'Shoppable video on your store, free.',
    adds: [
      '1 video widget, up to 5 shoppable videos',
      'Import from TikTok and Instagram',
      'Unlimited video views',
      'Video sales tracking',
      'Help centre support',
    ],
    popular: false,
    widgetLimit: 1,
    videoLimit: 5,
    removeBranding: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    credits: 300,
    creditRollover: false,
    blurb: 'Your content, every format.',
    adds: [
      'Unlimited shoppable videos and widgets',
      'Remove "Powered by MakeUGC" branding',
      // AI Studio bắt đầu từ ĐÂY kể từ pricing 13 Aug 2026 (Starter 0 → 300 credits).
      // Trước đó bullet này nằm ở Growth; để nguyên là nói dối về cái gì mới ở Growth.
      'Create AI videos',
    ],
    popular: false,
    widgetLimit: null,
    videoLimit: null,
    removeBranding: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 99,
    credits: 2000,
    creditRollover: true,
    blurb: 'Create AI videos, prove the revenue.',
    adds: [
      // Đã BỎ 'Create AI videos: 1000+ AI creators, 50+ languages' (Stella 13 Aug 2026):
      // (1) Starter giờ đã có AI videos nên đây không còn là cái mới của Growth, và
      // (2) claim "1000+ creators · 50+ languages" bỏ khỏi cả bảng so sánh.
      // Cái mới thật của Growth là số credit (2.000 vs 300) + rollover + 3 dòng dưới.
      // Hai dòng đầu CHƯA BUILD — nhãn phải nói ra ngay trên thẻ, không chỉ trong bảng
      // so sánh (thẻ là chỗ merchant bấm Upgrade, bảng thì phải mở ra mới thấy).
      `Revenue attribution with Triple Whale${COMING_SOON_SUFFIX}`,
      `Sync video reviews from your reviews app${COMING_SOON_SUFFIX}`,
      'Free migration and guided setup',
    ],
    popular: true,
    widgetLimit: null,
    videoLimit: null,
    removeBranding: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 299,
    credits: 4500,
    creditRollover: true,
    blurb: 'High-volume brands.',
    // Đã BỎ 'Custom AI creator — your own brand actor' (Stella 13 Aug 2026):
    // **tính năng đó không tồn tại.** Quảng cáo nó trên trang merchant bấm nút trả tiền
    // là hứa thứ không giao được — nặng hơn hẳn một dòng copy sai.
    adds: ['Priority support + dedicated success manager'],
    popular: false,
    widgetLimit: null,
    videoLimit: null,
    removeBranding: true,
  },
];

/**
 * Bảng so sánh feature × plan — copy nguyên cấu trúc *"Feature comparison by plan"*
 * của Notion, gồm cả ba nhóm (Shoppable video · AI video creation · Support).
 *
 * Vì sao cần bảng RIÊNG bên cạnh 4 thẻ: thẻ trả lời *"plan này có gì"*, bảng trả lời
 * *"khác nhau chỗ nào"*. Thẻ không bao giờ trả lời được câu thứ hai — muốn biết Growth
 * hơn Starter chỗ nào, merchant phải đọc hai cột rồi tự trừ trong đầu.
 *
 * ⚠️ **Giá trị phụ thuộc plan thì DERIVE từ `PLANS`, không gõ tay.** Gõ tay ở hai chỗ
 * là đảm bảo sớm muộn chúng lệch nhau — đã dính hai lần: `Scale = 200` trên Home vs
 * `2.500` trên Billing, rồi ba route AI Studio hardcode `2500` và sai đồng loạt hôm
 * pricing 13 Aug 2026 đổi Scale thành 4.500. Dùng `planCredits(id)`.
 *
 * `values` theo ĐÚNG thứ tự của `PLANS` (free · starter · growth · scale).
 * `true` = có · `false` = không · string = con số/mô tả.
 */
export interface PlanFeatureRow {
  /** Nhóm của Notion — dùng làm hàng tiêu đề trong bảng */
  group: 'Shoppable video' | 'AI video creation' | 'Support';
  label: string;
  /** Chỉ viết khi nhãn chưa đủ rõ — đừng chú thích lại thứ đã hiển nhiên */
  detail?: string;
  values: (boolean | string)[];
}

/**
 * Credit/tháng của một plan. Mọi mockup giả định shop đang ở plan nào thì lấy số qua
 * đây, KHÔNG gõ tay — ba route AI Studio từng hardcode `2500` và tất cả sai cùng lúc
 * hôm Scale đổi thành 4.500 (13 Aug 2026).
 */
export const planCredits = (id: string) => PLANS.find((plan) => plan.id === id)?.credits ?? 0;

const unlimitedOr = (n: number | null) => (n === null ? 'Unlimited' : String(n));

/**
 * "Từ Growth trở lên" — KHÔNG dùng `p.credits > 0` làm proxy nữa (13 Aug 2026).
 *
 * Proxy đó đúng khi Starter có 0 credit, nhưng pricing mới cho Starter 300 → mọi dòng
 * gate bằng `credits > 0` (Triple Whale · sync review · support · migration) tự nhảy
 * thành ✓ cho Starter, tức bảng giá tự hứa thêm 4 tính năng. Đây là lý do proxy tiện
 * lúc viết luôn là bug chờ ngày đổi giá.
 */
const isGrowthUp = (p: Plan) => p.id === 'growth' || p.id === 'scale';


export const PLAN_FEATURES: PlanFeatureRow[] = [
  {
    group: 'Shoppable video',
    label: 'Video widgets',
    values: PLANS.map((p) => unlimitedOr(p.widgetLimit)),
  },
  {
    group: 'Shoppable video',
    label: 'Shoppable videos',
    values: PLANS.map((p) => unlimitedOr(p.videoLimit)),
  },
  {
    group: 'Shoppable video',
    label: 'Video views',
    detail: 'Never billed, on any plan.',
    values: PLANS.map(() => 'Unlimited'),
  },
  {
    group: 'Shoppable video',
    label: 'Remove "Powered by MakeUGC" branding',
    values: PLANS.map((p) => p.removeBranding),
  },
  {
    group: 'Shoppable video',
    label: 'Import videos from TikTok and Instagram',
    values: PLANS.map(() => true),
  },
  {
    group: 'Shoppable video',
    label: 'Product tagging and in-video add to cart',
    values: PLANS.map(() => true),
  },
  {
    group: 'Shoppable video',
    label: 'Video sales tracking (built-in)',
    values: PLANS.map(() => true),
  },
  // HAI DÒNG NÀY CHƯA BUILD (Stella 13 Aug 2026) → `Coming soon` trên plan sẽ có nó,
  // `—` trên plan không có. Không phải ✓: ✓ là thứ merchant trả tiền hôm nay để nhận.
  {
    group: 'Shoppable video',
    label: 'Revenue attribution with Triple Whale',
    values: PLANS.map((p) => (isGrowthUp(p) ? COMING_SOON : false)),
  },
  {
    group: 'Shoppable video',
    label: 'Sync video reviews from your reviews app',
    values: PLANS.map((p) => (isGrowthUp(p) ? COMING_SOON : false)),
  },
  {
    group: 'AI video creation',
    label: 'Monthly credits included',
    // Đã BỎ detail "One product photo turns into one video." (13 Aug 2026): nó nói giá
    // của tab Product video (1 credit/ảnh) trong khi dòng ngay dưới tính số video theo
    // 150 credits. Hai giá cạnh nhau không chú thích là merchant tự trừ ra một con số
    // thứ ba. Bỏ hẳn — số credit và số video đứng cạnh nhau đã tự nói tỉ lệ.
    //
    // KHÔNG viết "~500" cho DÒNG NÀY dù Notion viết vậy: dấu ~ trong Notion là hedging
    // NỘI BỘ ("numbers are placeholders"), còn credit là con số hợp đồng — được 300 hay
    // không? Số video thì mới được phép ~, vì nó phụ thuộc merchant dùng model nào.
    values: PLANS.map((p) => (p.credits === 0 ? false : p.credits.toLocaleString('en-US'))),
  },
  {
    group: 'AI video creation',
    label: 'Create AI videos',
    // Đã bỏ "· 1000+ AI creators · 50+ languages" và thay ✓ bằng SỐ VIDEO (Stella 13 Aug
    // 2026). Dấu ✓ chỉ trả lời "có/không", còn câu merchant đang hỏi là "trả $99 thì
    // làm được mấy video" — số ở đây trả lời trực tiếp câu đó.
    values: PLANS.map((p) =>
      p.credits === 0 ? false : `~${videosFromCredits(p.credits).toLocaleString('en-US')} videos`,
    ),
  },
  {
    group: 'AI video creation',
    label: 'Credit rollover',
    values: PLANS.map((p) => p.creditRollover),
  },
  {
    group: 'AI video creation',
    label: 'No overage charges — ever',
    values: PLANS.map(() => true),
  },
  {
    group: 'Support',
    label: 'Support level',
    values: PLANS.map((p) => (isGrowthUp(p) ? 'Priority + success manager' : 'Chat')),
  },
  {
    group: 'Support',
    label: 'Free migration from your current video app + guided setup',
    values: PLANS.map(isGrowthUp),
  },
  // ⛔ KHÔNG có dòng "14-day free trial".
  // Notion ghi có; Stella chốt lại 06 Aug 2026: **KHÔNG có trial**, Free Forever thay
  // trial. Quyết định của Stella thắng doc — Notion tự ghi mình mới ở mức "Ready for
  // review, numbers are placeholders". Hệ quả: metric roadmap Phase 1
  // "Trial → paid conversion" phải đọc là *free → paid*, và KHÔNG vẽ state trial nào.
];


/* ════════════════════════════════════════════════════════════════════════════
   AI STUDIO → CONTENT LIBRARY  (07 Aug 2026 — viết lại theo SCREENSHOT platform)
   ────────────────────────────────────────────────────────────────────────────
   Bản đầu tôi dựng mù trước khi có ảnh và sai gần hết. Screenshot sửa:

   • Filter KHÔNG phải 3 dropdown (niche · style · format). Platform dùng **MỘT dải
     chip phẳng ~35 tag**, trộn lẫn ngành + format + style trong cùng một trục:
     Accessories nằm cạnh Avatar Swap nằm cạnh Cinematic nằm cạnh Hook nằm cạnh Viral.
     Không có thứ bậc. Giữ nguyên vì đó là taxonomy merchant đã quen trên platform.
   • Card trong lưới **không có chữ nào** — chỉ video dọc. Tên + mô tả nằm trong
     modal "Details" khi bấm vào (platform gọi là "Ad Details"; app Shopify bỏ chữ "Ad" — Stella chốt 07 Aug 2026).
   • Giá: **150 credits** một video (Stella chốt 08 Aug 2026) — xem `VIDEO_CREDITS`.
   • Field tên là **"Dialog"** và **"Product Description"**, cả hai trần 200 ký tự.
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Taxonomy chip — copy đúng thứ tự đọc được trên screenshot, KHÔNG sắp xếp lại.
 * Thứ tự alphabet là của platform; đảo lại thì merchant quen tay sẽ mò không ra.
 */
export const templateTags = [
  'Accessories', 'Apparel', 'Apps', 'Avatar Swap', 'Beauty', 'Beauty & Personal Care',
  'Billboards', 'Book', 'Cinematic', 'Education', 'Energy', 'Fashion', 'Fashion & Apparel',
  'Finance', 'Food & Beverage', 'Health', 'Health & Fitness', 'Hook', 'Insurance',
  'Lifestyle', 'Multi-Industry', 'Outdoor', 'Pets', 'Physical Goods', 'Product Showcase',
  'Retail & Sales', 'Services', 'Skincare', 'Sports', 'Sports & Outdoor',
  'Tech & Electronics', 'Tech Accessories', 'UGC', 'Viral',
] as const;

/**
 * Kiểu bố cục khung hình — thứ mắt merchant bắt được trong nửa giây khi lướt lưới.
 * Dùng cho `TemplateShape` vẽ hình dạng thay vì ảnh giả (xem primitives.tsx).
 */
export type TemplateShot =
  | 'selfie'
  | 'talking-desk'
  | 'unboxing'
  | 'product-closeup'
  | 'billboard'
  | 'flatlay';

export interface VideoTemplate {
  id: string;
  /** Chỉ hiện trong modal Details, KHÔNG hiện trên card */
  title: string;
  /** Đoạn mô tả dài trong modal Details — platform viết dạng "Creates a realistic 15-second…" */
  description: string;
  /** Nhiều tag/template, đúng như taxonomy phẳng của platform */
  tags: string[];
  durationSec: number;
  shot: TemplateShot;
  /**
   * Ai đang ở trong khung. Platform không hiện field này ở đâu cả — tôi THÊM vào.
   * Lý do: output giữ nguyên người của template, nên một khuôn mặt chạy trong quảng cáo
   * của N merchant với N kịch bản. `deliverables/research-ai-library-avatars.md` §2.3.
   * Nếu Duong thấy không nên lộ tên thật thì đổi thành nhãn chung, đừng bỏ hẳn.
   */
  creator: string | null;
  isNew?: boolean;
}

/* `VIDEO_CREDITS` khai báo ở khối pricing phía TRÊN (`PLAN_FEATURES` cần nó lúc load
   module để tính số video/tháng). Ở 150/video: Starter 300 ≈ 2 video · Growth 2.000 ≈ 13
   · Scale 4.500 ≈ 30. */

const TEMPLATE_RAW: [string, string, string[], string | null, TemplateShot][] = [
  ['Casual Fashion Vlog – T-Shirt UGC', 'Creates a realistic 15-second selfie-style UGC video of a creator wearing and reviewing a T-shirt in a natural outdoor lifestyle setting. Perfect for basic tees, oversized shirts, graphic tees, streetwear, athletic T-shirts, luxury apparel, and everyday fashion brands.', ['Apparel', 'Fashion', 'UGC', 'Lifestyle'], 'Brad S.', 'selfie'],
  ['Heel Close-Up – Luxury Footwear', 'A slow cinematic pan across the sole and heel of a designer shoe on a hardwood floor. Built for luxury footwear, statement heels, and premium accessories where the detail is the selling point.', ['Accessories', 'Fashion', 'Cinematic', 'Product Showcase'], null, 'product-closeup'],
  ['Desk Talking Head – Professional', 'A 15-second piece to camera from a home office desk. Works for apps, SaaS, financial services, insurance, and anything that needs a credible person explaining a benefit.', ['Apps', 'Finance', 'Insurance', 'Services'], 'Marco D.', 'talking-desk'],
  ['Logo Reveal on Tee', 'Extreme close-up on an embroidered logo on white cotton, shallow depth of field. For brand launches, drops, and merch.', ['Apparel', 'Fashion & Apparel', 'Product Showcase'], null, 'product-closeup'],
  ['Street Cafe Sip – Beverage', 'A creator takes the first sip of a drink outside a cafe and reacts. Built for smoothies, coffee, energy drinks, and supplements in a ready-to-drink format.', ['Food & Beverage', 'Lifestyle', 'UGC'], 'Nayeli R.', 'selfie'],
  ['Sneaker Unboxing on the Sofa', 'Hands lift a shoe out of the box and turn it to camera. The highest-converting format for footwear drops and restocks.', ['Accessories', 'Retail & Sales', 'UGC', 'Viral'], 'Alina K.', 'unboxing'],
  ['Bedside Skincare Routine', 'A creator applies a product in soft morning light and talks through why they use it. For serums, moisturisers, and cleansers.', ['Beauty', 'Skincare', 'Beauty & Personal Care', 'UGC'], 'Priya N.', 'selfie'],
  ['Gym Mirror Check-In', 'A quick piece to camera in a gym mirror holding the product. For supplements, activewear, and fitness equipment.', ['Health & Fitness', 'Sports', 'UGC'], 'Marcus B.', 'selfie'],
  ['Hook: "Stop scrolling"', 'A three-second pattern interrupt built to be cut onto the front of any other video. Not a full ad on its own.', ['Hook', 'Viral', 'Multi-Industry'], 'Jess L.', 'selfie'],
  ['Kitchen Counter Unboxing', 'Packaging opened on a clean kitchen counter with the product held up at the end. Works for most physical goods.', ['Physical Goods', 'Retail & Sales', 'UGC'], 'Ines M.', 'unboxing'],
  ['Billboard Mockup – City', 'Your product image placed on a city billboard with traffic moving past. For brand-awareness creative, not direct response.', ['Billboards', 'Cinematic', 'Multi-Industry'], null, 'billboard'],
  ['Avatar Swap – Talking Head', 'A neutral talking-head base built to have the face replaced with one of your own actors. The template creator is a placeholder, not the final face.', ['Avatar Swap', 'Multi-Industry', 'UGC'], 'Swappable face', 'talking-desk'],
  ['Dog Reacts to Treat', 'A dog takes a treat and the owner narrates. For pet food, toys, and supplements.', ['Pets', 'UGC', 'Viral'], 'Chloe A.', 'product-closeup'],
  ['Book Flip-Through', 'Hands flip through pages on a desk with a voiceover over the top. For publishers, courses, and workbooks.', ['Book', 'Education'], null, 'flatlay'],
  ['Solar Panel Walk-Around', 'A slow walk-around of an installation with a voiceover. For energy, home improvement, and long consideration purchases.', ['Energy', 'Outdoor', 'Services'], null, 'billboard'],
  ['Trail Run – Outdoor Gear', 'Handheld footage on a trail with the product in use. For outdoor apparel, footwear, and gear.', ['Outdoor', 'Sports & Outdoor', 'Health & Fitness'], 'Tara S.', 'selfie'],
  ['Phone Case Drop Test', 'A phone in a case dropped onto concrete and picked back up undamaged. For tech accessories with a durability claim.', ['Tech Accessories', 'Tech & Electronics', 'Product Showcase'], 'Omar H.', 'product-closeup'],
  ['App Screen Walkthrough', 'A hand scrolling through an app on a phone with a voiceover explaining the flow. For apps and SaaS onboarding.', ['Apps', 'Tech & Electronics', 'Education'], null, 'flatlay'],
  ['Testimonial – Six Weeks In', 'A creator talks about using the product for six weeks. Built as a trust builder for the middle of the funnel.', ['UGC', 'Health & Fitness', 'Multi-Industry'], 'Daniel K.', 'talking-desk'],
  ['Get Ready With Me – Mirror', 'A creator gets ready at a mirror and works the product into the routine. For beauty, fragrance, and fashion.', ['Beauty', 'Fashion', 'Lifestyle', 'UGC'], 'Mei T.', 'selfie'],
  ['Flat Lay to Lifestyle', 'A flat lay of the product dissolves into it being used in a real setting. Works when you only have packshots.', ['Product Showcase', 'Physical Goods', 'Cinematic'], null, 'flatlay'],
  ['Insurance Explainer – Sofa', 'A relaxed piece to camera from a living room. For insurance, finance, and anything that needs to feel unthreatening.', ['Insurance', 'Finance', 'Services'], 'Ben C.', 'talking-desk'],
  ['Sale Announcement – Handheld', 'A fast handheld piece to camera announcing a discount. For BFCM, flash sales, and clearance.', ['Retail & Sales', 'Viral', 'Hook'], 'Sofia R.', 'selfie'],
  ['Clinic Talking Head – Health', 'A professional in a clinical setting explaining a benefit. Note: your own claims still need to comply with the ad platform you post to.', ['Health', 'Health & Fitness', 'Services'], 'Nadia F.', 'talking-desk'],
];

export const videoTemplates: VideoTemplate[] = TEMPLATE_RAW.map(
  ([title, description, tags, creator, shot], i) => ({
    id: `t-${i + 1}`,
    title,
    description,
    tags,
    durationSec: 15,
    shot,
    creator,
    isNew: i < 4,
  }),
);

/**
 * ⏳ TỰ ĐẶT — platform trông như có vài trăm template, lưới cuộn không hết trong
 * screenshot. 24 là đủ để lộ vấn đề layout của lưới + filter; con số tổng hiện lên
 * UI thì dùng hằng này để không nói dối là "24 of 24".
 */
export const TOTAL_TEMPLATES = 240;

/**
 * Thumbnail thật của template — sinh bằng `agy generate_image` 07 Aug 2026, 268×480 (9:16),
 * để trong `public/templates/`. Thay cho `TemplateShape` vẽ tay hồi chưa có asset.
 *
 * ⚠️ Ảnh do AI sinh, KHÔNG phải người thật và KHÔNG phải sản phẩm có thật. Prompt cố ý
 * chặn mọi nhãn hiệu: bản đầu ra đúng đế đỏ Louboutin (trade dress đã đăng ký) nên phải
 * siết lại prompt và gen lại. Thay bằng frame video thật khi có.
 */
export function templateThumb(id: string) {
  return `/templates/${id}.jpg`;
}

/** Mô tả bố cục cho `alt` — bố cục là thông tin, không phải trang trí */
export const shotAlt: Record<TemplateShot, string> = {
  selfie: 'selfie-style video, creator holding the product',
  'talking-desk': 'creator talking to camera at a desk',
  unboxing: 'hands opening a box',
  'product-closeup': 'close-up of the product, no one on camera',
  billboard: 'wide outdoor shot with the product on a billboard',
  flatlay: 'flat lay of the product, no one on camera',
};

export function templateById(id: string): VideoTemplate {
  return videoTemplates.find((template) => template.id === id) ?? videoTemplates[0];
}

/* ════════════════════════════════════════════════════════════════════════════
   AI STUDIO → MODEL — chỉ tồn tại BÊN TRONG tính năng đổi creator
   ────────────────────────────────────────────────────────────────────────────
   Bảng cũ (`Draft` / `Nova 2.0` / `Nova 2.0 HD`) đã BỎ 13 Aug 2026. Nó là di sản của
   section Quality/Mode đã park hồi 07 Aug 2026 và không route nào import — giữ một
   bảng chết cạnh một bảng sống là mời dev đọc sai bảng.

   Model KHÔNG phải lựa chọn cấp trang. Giữ nguyên creator của template thì merchant
   không chọn gì cả và trả đúng `VIDEO_CREDITS` (150). Chỉ khi ĐỔI creator mới phải
   chọn model, vì đổi creator là dựng lại người trên khung hình — đó là việc đắt hơn,
   và giá phụ thuộc model (Stella chốt 13 Aug 2026).

   ⏳ HAI TÊN LÀ THẬT (Stella 13 Aug 2026), HAI CON SỐ LÀ TỰ ĐẶT. Cần Duong chốt:
   giá thật của Seedance 2.0 và 2.5, và liệu 2.5 có bị chặn theo plan không. Chọn
   250/400 vì nó tạo ra đủ ba vùng credit cần review:
     • ≥ 400  → chọn được cả hai
     • 250–399 → 2.5 khoá, 2.0 vẫn chạy
     • 150–249 → KHÔNG dùng được tính năng Creator, nhưng vẫn generate được video
                 với creator có sẵn của template (150). Đây là chỗ dễ làm sai nhất:
                 hết credit cho Creator ≠ hết credit cho video.
   ════════════════════════════════════════════════════════════════════════════ */

export interface CreatorModel {
  id: string;
  name: string;
  /** Badge cạnh tên trong modal — một từ, không phải câu */
  badge?: string;
  /**
   * MỘT câu, và giữ đúng một câu (Stella 13 Aug 2026). Bản đầu hai câu cộng thêm dòng
   * "Leaves you 2,010 of 2,260 credits" → ba câu cho một lựa chọn radio, đọc thành đoạn
   * văn. Số credit còn lại đã có ở CreditMeter bên aside, không cần lặp trong từng option.
   */
  blurb: string;
  credits: number;
  /** `false` = con số credits là tự đặt, chưa có Duong xác nhận */
  verified: boolean;
}

export const creatorModels: CreatorModel[] = [
  {
    id: 'seedance-2-0',
    name: 'Seedance 2.0',
    badge: 'Best value',
    blurb: 'Reliable lip-sync and natural delivery.',
    credits: 250,
    verified: false,
  },
  {
    id: 'seedance-2-5',
    name: 'Seedance 2.5',
    badge: 'Best quality',
    blurb: 'Sharper faces and steadier motion.',
    credits: 400,
    verified: false,
  },
];

export function creatorModelById(id: string): CreatorModel {
  return creatorModels.find((model) => model.id === id) ?? creatorModels[0];
}

/**
 * Giá RẺ NHẤT để đổi được creator. Dưới ngưỡng này thì tính năng Creator khoá hẳn —
 * tính từ bảng chứ không hardcode, để đổi giá một chỗ là mọi nơi theo.
 */
export const CREATOR_MODEL_MIN_CREDITS = Math.min(...creatorModels.map((m) => m.credits));

/* ════════════════════════════════════════════════════════════════════════════
   AI STUDIO → ACTORS  (07 Aug 2026 — viết lại theo screenshot "Add Actors")
   ────────────────────────────────────────────────────────────────────────────
   Sửa so với bản đoán: multi-select (thanh nổi `N selected · OK · Clear`), thumbnail
   thật chứ không phải initials, badge `HD` + `New`, thẻ `Create +` nằm ngay ô đầu
   lưới, và filter là 5 trục: ALL/REALISTIC/STYLED/MY ACTORS · GENDER · AGE · COLOR ·
   STYLE. Stella chốt 07 Aug 2026 giữ nguyên parity kể cả GENDER và COLOR.

   HAI NGUỒN, HAI MỨC RỦI RO PHÁP LÝ:
   • `library` — kho MakeUGC, đã ký với actor một lần từ trước → merchant dùng là
     0 ma sát, không popup, không tickbox.
   • `custom`  — mặt người thật merchant upload. Đây là `scan of face geometry` theo
     Illinois BIPA §10: $1.000–$5.000/vi phạm, không cần chứng minh thiệt hại, và là
     luật duy nhất trong nhóm CÓ quyền khởi kiện tư nhân. Vendor cũng có thể bị lôi
     vào (*Kronos*). Chi tiết: `deliverables/research-ai-library-avatars.md` §2.2.

   ⚠️ `consent` là TICKBOX (Stella chốt 07 Aug 2026), consult legal sau. Field vẫn giữ
   dạng object `{method, at, by}` chứ không phải boolean — để ngày đổi sang consent
   thật của chính người được lấy mặt thì chỉ thay UI, KHÔNG phải migrate avatar đã tạo.
   ════════════════════════════════════════════════════════════════════════════ */

export const actorKinds = ['Realistic', 'Styled'] as const;
export const actorGenders = ['Male', 'Female'] as const;
/** 5 bậc, đúng screenshot — KHÔNG phải 4 bậc như bản đoán */
export const actorAges = ['18-30', '30-40', '40-50', '50-60', '60+'] as const;
/** 4 swatch màu da của platform. Hex lấy xấp xỉ từ screenshot. */
export const actorSkinTones = [
  {id: 'tone-1', hex: '#f2e0c0', label: 'Light'},
  {id: 'tone-2', hex: '#dda979', label: 'Medium'},
  {id: 'tone-3', hex: '#a8642a', label: 'Tan'},
  {id: 'tone-4', hex: '#5c3216', label: 'Deep'},
] as const;
export const actorStyles = [
  'Other', 'Professional', 'Relaxed', 'Business formal', 'Elegant', 'Casual', 'Simple',
  'Minimalist', 'Conservative', 'Business casual', 'Sporty', 'Cozy', 'Natural',
  'Smart casual', 'Comfy', 'Vibrant', 'Trendy', 'Classic', 'Youthful', 'Feminine',
  'Athleisure', 'Vacation casual', 'Casual chic', 'Chic', 'Modern', 'Fresh', 'Edgy',
  'Clean', 'Alternative', 'Bold casual',
] as const;

export interface Actor {
  id: string;
  name: string;
  source: 'library' | 'custom';
  /**
   * ready    — dùng được
   * training — đang dựng, chạy nền, có ETA
   * failed   — dựng hỏng (ảnh mờ / nhiều mặt trong khung)
   * revoked  — người đó rút quyền → khoá, và video đã publish bị GỠ KHỎI STOREFRONT
   */
  status: 'ready' | 'training' | 'failed' | 'revoked';
  kind: (typeof actorKinds)[number];
  gender: (typeof actorGenders)[number];
  age: (typeof actorAges)[number];
  skinTone: (typeof actorSkinTones)[number]['id'];
  style: string;
  hd: boolean;
  isNew?: boolean;
  /** Giữ dạng object cho ngày đổi sang consent thật — xem ghi chú đầu khối */
  consent?: {method: 'merchant-attested' | 'subject-signed'; at: string; by: string};
  /** Cần cho cảnh báo lúc revoke: bao nhiêu video đang chạy sẽ bị gỡ */
  videoCount: number;
  note?: string;
}

const ACTOR_RAW: [string, Actor['kind'], Actor['gender'], Actor['age'], Actor['skinTone'], string, boolean, number][] = [
  ['Julian', 'Realistic', 'Male', '18-30', 'tone-1', 'Casual', true, 14],
  ['Camille', 'Realistic', 'Female', '18-30', 'tone-1', 'Relaxed', true, 9],
  ['Sienna', 'Realistic', 'Female', '18-30', 'tone-1', 'Smart casual', true, 6],
  ['Ethan', 'Realistic', 'Male', '30-40', 'tone-2', 'Casual', true, 21],
  ['Lina', 'Styled', 'Female', '18-30', 'tone-3', 'Bold casual', true, 3],
  ['Chloe', 'Realistic', 'Female', '30-40', 'tone-1', 'Comfy', true, 11],
  ['Lily 7', 'Realistic', 'Female', '40-50', 'tone-1', 'Sporty', true, 5],
  ['Lily 6', 'Realistic', 'Female', '50-60', 'tone-1', 'Vibrant', true, 0],
  ['Celine', 'Realistic', 'Female', '30-40', 'tone-1', 'Simple', true, 8],
  ['Lucy 2', 'Realistic', 'Female', '30-40', 'tone-1', 'Minimalist', true, 2],
  ['Roman', 'Realistic', 'Male', '18-30', 'tone-1', 'Alternative', true, 7],
  ['Logan', 'Realistic', 'Male', '18-30', 'tone-2', 'Athleisure', true, 4],
  ['Lucas', 'Realistic', 'Male', '50-60', 'tone-4', 'Professional', true, 1],
  ['Amara', 'Realistic', 'Female', '30-40', 'tone-4', 'Chic', true, 0],
  ['Hugo', 'Realistic', 'Male', '60+', 'tone-1', 'Conservative', true, 0],
  ['Yuki', 'Styled', 'Female', '18-30', 'tone-2', 'Trendy', true, 6],
  ['Grace', 'Realistic', 'Female', '40-50', 'tone-3', 'Business casual', true, 0],
  ['Tomas', 'Realistic', 'Male', '30-40', 'tone-2', 'Natural', true, 3],
  ['Aisha', 'Realistic', 'Female', '30-40', 'tone-4', 'Business formal', true, 12],
  ['Elias', 'Styled', 'Male', '50-60', 'tone-1', 'Elegant', false, 0],
  ['Nadia', 'Realistic', 'Female', '40-50', 'tone-2', 'Professional', true, 0],
  ['Marcus', 'Realistic', 'Male', '18-30', 'tone-3', 'Sporty', true, 2],
  ['Priya', 'Realistic', 'Female', '18-30', 'tone-3', 'Fresh', true, 9],
  ['Ben', 'Realistic', 'Male', '60+', 'tone-1', 'Cozy', false, 1],
];

const libraryActors: Actor[] = ACTOR_RAW.map(
  ([name, kind, gender, age, skinTone, style, hd, videoCount], i) => ({
    id: `ac-${i + 1}`,
    name,
    source: 'library' as const,
    status: 'ready' as const,
    kind,
    gender,
    age,
    skinTone,
    style,
    hd,
    isNew: i < 8,
    videoCount,
  }),
);

/**
 * ⏸️ CUSTOM ACTOR ĐÃ PARK (Stella chốt 07 Aug 2026) — V1 chỉ dùng kho MakeUGC.
 *
 * Bỏ luồng "dựng actor từ mặt người thật" khỏi app Shopify. Hệ quả tích cực: phơi nhiễm
 * Illinois BIPA về gần 0, vì không còn `scan of face geometry` nào do merchant upload —
 * đó là hạng mục DUY NHẤT trong nhóm có quyền khởi kiện tư nhân
 * (`deliverables/research-ai-library-avatars.md` §2.2). Tickbox consent biến mất theo,
 * nên không còn gì phải chờ legal review trước launch.
 *
 * Field `source` · `status` · `consent` GIỮ NGUYÊN trong type `Actor` dù giờ mọi actor
 * đều là `library` + `ready`. Lý do: bật lại là thêm data, không phải thiết kế lại schema
 * rồi migrate. Đây cũng là lý do `consent` vẫn là object chứ không phải boolean.
 *
 * ⚠️ Một nghĩa vụ KHÔNG mất đi khi bỏ custom actor: actor trong kho vẫn có quyền rút
 * likeness bất cứ lúc nào (chuẩn ngành HeyGen), và khi đó video đã publish trên storefront
 * widget của merchant phải bị gỡ. `status: 'revoked'` giữ lại trong type cho ca đó —
 * nhưng UI xử lý nó CHƯA vẽ. Xem `open[]` của route avatars.
 */

export const actors: Actor[] = libraryActors;

export function actorById(id: string): Actor | undefined {
  return actors.find((actor) => actor.id === id);
}

/**
 * Chân dung actor — sinh bằng `agy generate_image` 07 Aug 2026, 269×360 (3:4),
 * để trong `public/actors/`.
 *
 * ⚠️ Người trong ảnh KHÔNG có thật. Prompt chặn mọi nhãn hiệu trên trang phục, cùng bộ
 * quy tắc đã dùng cho thumbnail template (bản đầu của template ra đúng đế đỏ Louboutin —
 * trade dress đã đăng ký — nên phải siết lại). Thay bằng ảnh actor thật khi có asset.
 */
export function actorPortrait(id: string) {
  return `/actors/${id}.jpg`;
}

/* ════════════════════════════════════════════════════════════════════════════
   AI STUDIO → AUDIO SETTINGS
   Bốn slider + giá trị mặc định đọc trực tiếp từ screenshot panel "Audio settings".
   ════════════════════════════════════════════════════════════════════════════ */

export const voiceDefaults = {clarity: 0.75, tone: 0.4, emotion: 0, speed: 1} as const;

export const voiceSliders = [
  {key: 'clarity' as const, label: 'Clarity', min: 0, max: 1, step: 0.05, format: (v: number) => v.toFixed(2)},
  {key: 'tone' as const, label: 'Tone', min: 0, max: 1, step: 0.05, format: (v: number) => v.toFixed(2)},
  {key: 'emotion' as const, label: 'Emotion', min: 0, max: 1, step: 0.1, format: (v: number) => v.toFixed(1)},
  {key: 'speed' as const, label: 'Speed', min: 0.5, max: 2, step: 0.1, format: (v: number) => `${v.toFixed(1)}x`},
];

/**
 * ⏳ TỰ ĐẶT: trần ký tự của Dialog.
 * Platform có HAI con số khác nhau — Recreate dùng 200, composer Talking Actors dùng
 * 1500. App Shopify gộp một luồng nên phải chọn một. Lấy 200 theo Recreate vì template
 * dài 15s cố định; 1500 ký tự không thể lọt vào 15 giây.
 */
export const DIALOG_MAX = 200;
export const PRODUCT_DESC_MAX = 200;
/** ⏳ TỰ ĐẶT: 15s thoại tự nhiên ≈ 40 từ ≈ 220 ký tự */
export const CHARS_PER_SECOND = 220 / 15;

/**
 * Góc kể cho AI script writer — copy đúng bộ platform đang có (screenshot 07 Aug 2026):
 * COMPARISON · CURIOSITY · PRODUCT REVIEW · PRODUCT EXPLAINER · PRODUCT RECOMMENDATIONS ·
 * SLIGHTLY FUNNY TESTIMONIAL. Viết hoa chữ đầu cho hợp Shopify admin (platform để ALL CAPS).
 * ⏳ Cần Duong xác nhận đúng bộ provider nhận.
 */
export const scriptAngles = [
  'Comparison',
  'Curiosity',
  'Product review',
  'Product explainer',
  'Product recommendations',
  'Slightly funny testimonial',
] as const;

/**
 * Thẻ cảm xúc chèn THẲNG vào lời thoại dạng `[excited]`, đúng như platform hiển thị
 * (screenshot: `[thoughtful]` và `[excited]` nằm ngay trong script, tô nền tím).
 * ⏳ Danh sách này tôi suy từ hai thẻ nhìn thấy — cần Duong cấp bộ đầy đủ provider nhận.
 */
export const speechEmotions = [
  'excited',
  'thoughtful',
  'curious',
  'warm',
  'confident',
  'surprised',
] as const;

/** ⏸️ KHÔNG còn dùng — thay bằng `scriptAngles` khi Dialog gộp một card (07 Aug 2026) */
export const scriptBriefPresets = [
  {id: 'problem', label: 'Problem → fix', text: 'Start with the problem this solves, then show the product as the fix.'},
  {id: 'social', label: 'Social proof', text: 'Talk like someone who has used it for a few weeks and is telling a friend.'},
  {id: 'offer', label: 'Offer', text: 'Lead with the discount, then one reason the product is worth it anyway.'},
];
