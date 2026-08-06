# mockup-app — quy tắc code

App mockup UI cho MakeUGC Shopify admin. Output để **dev copy-paste route vào app thật**, không phải để deploy.

```bash
npm install
npm run typecheck    # PHẢI 0 error — bằng chứng props đúng
npm run dev          # → localhost:3100
```

Skill sinh mockup: [.claude/skills/create-mockup/SKILL.md](../.claude/skills/create-mockup/SKILL.md)

---

## 1. Stack — chốt 03 Aug 2026 (Stella)

| | |
|---|---|
| Framework | **Shopify Remix template** (Shopify CLI hiện scaffold React Router v7 — convention gần y hệt) |
| UI | **Polaris web components** (`<s-page>`, `<s-section>`, `<s-button>`…) |
| **KHÔNG dùng** | ~~`@shopify/polaris` React~~ |
| Nạp component | CDN `polaris.js` trong `index.html` (app thật: `app/root.tsx`) — **KHÔNG npm** |
| Admin chrome | CDN `app-bridge.js` — nav, save bar, toast, resource picker |
| Type | `@shopify/polaris-types@latest` + `tsconfig.json` → `"types": ["@shopify/polaris-types"]` |
| Charts | `@shopify/polaris-viz` (React) — không có chart web component |

**Vì sao `package.json` không có `@shopify/polaris`:** đúng như vậy, không phải thiếu. Component là custom element global do CDN cung cấp.

---

## 2. `npm run typecheck` là gate, không phải tuỳ chọn

Đây là thứ thay thế "hy vọng props đúng". Nó check JSX với **type chính thức của Shopify** và đã bắt được thật:

- `details` của `s-choice` là **slot**, không phải prop
- `s-modal` **không có** prop `open`
- `interestFor` **không** đặt được trên `s-stack`
- `s-image inlineSize` chỉ nhận `fill|auto`, không nhận `"0"`

**Đừng nói mockup xong khi chưa typecheck sạch.**

---

## 3. Web components — khác React Polaris chỗ nào

| Việc | Cách làm |
|---|---|
| Import component | **KHÔNG import gì.** `<s-page>` là global |
| Prop trong JSX | **camelCase** (`accessibilityLabel`, `labelAccessibilityVisibility`, `onDismiss`) |
| Spacing | **Keyword**: `small-500 … small-100 · small · base · large · large-100 …`. `gap="400"` là **SAI** |
| Background | `transparent \| subdued \| base \| strong`. KHÔNG `bg-surface-secondary` |
| Card | `s-section` (**không có `s-card`**) |
| Sidebar | `<s-stack slot="aside">` của `s-page` |
| Vertical/horizontal stack | `s-stack direction="block\|inline"` (một tag) |
| Icon | String: `icon="chart-line"`. **Không import.** 517 icon, type-safe |
| Tooltip | `interestFor="tip-id"` trên trigger + `<s-tooltip id="tip-id">`. **Không bọc children.** 🔴 **Không hoạt động trên `disabled`** |
| Modal | `command="--show" commandFor="id"` trên nút mở, `command="--hide"` để đóng (khỏi cần ref). **Phải có `accessibilityLabel`**, `heading` không đủ — thiếu là Polaris warn ra console |
| Toggle | `s-switch` — có `label` + `details` sẵn, không tự dựng label-trái/control-phải |
| Help text | `details` (thay `helpText`) |
| Ảnh | `<s-image aspectRatio objectFit loading="lazy">` — không cần inline style |
| Table | `s-table` gói sẵn `loading`, `paginate`, slot `filters` |
| Action của page | `<s-button slot="secondary-actions">` — **text trần, KHÔNG `icon`**. Có `icon` thì Polaris warn *"Icon component rendered with no type"* lúc hydrate; cùng nút đó ngoài slot thì sạch (§7i) |
| Icon + text trên một dòng | 🔴 `s-stack` **không có `wrap`** — text wrap là icon rớt xuống dòng riêng (§7e). ✅ Cách đúng cho list "✓ + text": `s-grid gridTemplateColumns="max-content minmax(0, 1fr)"` + `Fragment` (§7l) |
| Chữ to cỡ display (giá, số KPI) | 🔴 **KHÔNG có.** `s-heading` một cỡ duy nhất, không prop size/variant. Muốn giá trội hơn tên thì hạ tên xuống `s-text type="strong"` (§7l) |
| Nền đậm + chữ trắng (ribbon, banner brand) | 🔴 Không viết được: `s-text color` chỉ `subdued\|base`. Dùng `background="subdued"` + `type="strong"` (§7l) |
| Bo riêng góc trên của `s-box` | 🔴 Không có `borderStartStartRadius`. Đặt `borderRadius` + `overflow="hidden"` trên thẻ cha (§7l) |
| Tô nền một cột của `s-table` | 🔴 `s-table-cell` **không nhận `[layout]`**. Làm nổi cột bằng badge ở `s-table-header` + in đậm giá trị (§7l) |
| Card lồng card | 🔴 `s-section` trong `s-section` **mất surface** — heading để ngoài, lưới card ở cấp trang (§7f) |
| Căn hàng nút giữa các card | ✅ **Có cách** (06 Aug 2026): `s-stack blockSize="100%" justifyContent="space-between"` bên trong `s-box` của card — footer tự ghim đáy, thẻ trong cùng hàng bằng nhau kể cả khi mô tả dài ngắn khác nhau. Verify trên grid 24 thẻ của trang Widgets. **Không còn cần** cách cũ ở §7g (cố định chiều cao phần trên) |
| **Bôi đậm chữ trong câu** | 🔴 `s-text type="strong"` **không đậm** (`font-weight: 450`, bằng đoạn văn). Dùng **`<strong>`** → 700. Bẫy im lặng: typecheck xanh, không warn, chỉ mắt người mới bắt được (§7j) |
| Spinner nhỏ | 🔴 `s-spinner size` chỉ có `base \| large \| large-100` — **không có** `small*` |
| Hàng filter (search + select) | 🔴 `s-stack direction="inline"` **không dùng được**: hai control tự giãn full width → rơi xuống hai dòng, đẩy nội dung xuống dưới. Dùng `s-grid gridTemplateColumns="minmax(0, 2fr) minmax(0, 1fr)"` (§7j) |
| Đọc `s-banner` lúc verify | `heading` nằm trong **shadow DOM** → `body.innerText` không thấy. Dùng `getAttribute('heading')`, nếu không sẽ kết luận nhầm là banner biến mất (§7j) |

---

## 4. Component tự dựng (`app/components/`)

Web components thiếu mấy cái này — **check trước khi viết mới**:

### `primitives.tsx`
| Component | Thay cho | Ghi chú |
|---|---|---|
| `ProgressBar` | `ProgressBar` React | Không có `s-progress-bar`. 2 lớp `s-box` + width %, có `role="progressbar"` + aria |
| `EmptyState` | `EmptyState` + `EmptySearchResult` | Giữ **dual pattern**: no-data ≠ no-search-result. CTA nhận `href` **hoặc** `onAction` — dùng `onAction` khi CTA không phải điều hướng (OAuth "Connect TikTok" ở Settings) |
| `TabBar` | `Tabs` | Không có `s-tabs`. Bù khoảng trống a11y: tab đang chọn có `<s-text accessibilityVisibility="exclusive">, selected</s-text>` vì `variant` chỉ truyền tải bằng màu. **Không** dùng `accessibilityLabel` — nó thay nhãn, không thêm |
| `SelectAllBar` | bulk actions của `IndexTable` | 🔴 `s-table` **không có row selection**. Khoảng trống enterprise nặng nhất |
| `KpiTile` | KPI card | `s-section` + `interestFor` tooltip giải thích cách tính metric |

### Feature components
| Component | Làm gì |
|---|---|
| `CreditMeter` | Credit hard-stop: meter + cost preview + low warning + blocked + plan-gated. `compact` = chỉ meter + số (dùng trên **chính** trang AI Studio: ở đó trang tự hiện banner ở action zone và có primary action riêng, để cả hai là hai banner nói cùng một câu) |
| `JobProgress` | Async job 4 state: queued / processing / done (kể cả partial) / failed. Card CHI TIẾT, dùng ở Home. Job KHÔNG phải AI generation thì **phải** truyền `pastVerb` (Settings → Connections dùng `"imported"`) — để mặc định `"generated"` là UI nói dối, merchant đọc "143 videos generated" và tưởng vừa tiêu 143 credit |
| `GlobalJobProgress` | Banner GỌN cho job đang chạy, sống ở **mọi trang**. Trong app thật đặt ở layout route `app/routes/app.tsx`, không phải từng route. Không hiện cùng lúc với `JobProgress` |
| `StateSwitcher` | Review tool — **xoá khi copy vào app thật**. Nhận `doc` trên từng state (rule hiển thị, panel thu gọn mặc định) + `globalNote` cho ràng buộc áp mọi state |
| `AdminChrome` | Khung admin GIẢ của Shopify: top bar + sidebar **240px** ghim. **Xoá khi copy vào app thật.** Nav của app nằm trong sidebar đó vì App Bridge render `<ui-nav-menu>` ngoài iframe |

**Quy tắc:** pattern lặp 3 lần → tách vào `primitives.tsx`. Thêm component mới → **cập nhật bảng trên**.

---

## 5. CSS — chỉ 4 ngoại lệ

Ngoài 4 cái này, thấy `style={{` là sai:
1. Chart container height (polaris-viz cần): `<div style={{height: 280}}>`
2. Width % của `ProgressBar` tự dựng (token không biểu diễn được chiều rộng động)
3. **`components/AdminChrome.tsx`** — khung admin giả của harness. Top bar Shopify là nền gần đen + chữ trắng, mà `s-box background` chỉ có `transparent|subdued|base|strong` và `s-text color` chỉ có `subdued|base`; sticky + `calc(100vh - 56px)` cũng không biểu diễn được (`minBlockSize` chỉ nhận `px | % | 0`). Ngoại lệ này **chỉ** áp cho file đó — nó không phải phần app.
4. **Khối storefront preview** (`app.widgets.$id.tsx` → aside "Preview"). Nó vẽ widget bằng **đúng mã hex và số pixel merchant vừa nhập** — không có token Polaris nào biểu diễn được "màu người dùng chọn", và `s-grid gap` chỉ nhận keyword chứ không nhận px. Đây là chỗ DUY NHẤT trong admin được phép trông giống storefront, vì nó đại diện cho storefront; khung quanh nó vẫn là Polaris.

4. **`app/routes/app.billing.tsx` → `PLAN_CARD_CSS`** — plan card của trang Billing. Stella chốt 06 Aug 2026 làm giống bản tham chiếu pricing của app Shopify thật. Bốn thứ Polaris không có đường làm: **cỡ chữ lớn** cho tên plan + giá (`HeadingProps` không có size/variant, và CSS ngoài không xuyên được shadow DOM của `s-heading`), **nhấn màu** cho giá (`s-text color` chỉ `subdued|base`), **ribbon góc** (cần `position:absolute`), **viền nhấn** cho thẻ popular (`borderColor` chỉ có xám).
   ✅ **KHÔNG phá §6 brand boundary**: toàn bộ hex là `#303030` (ink Polaris, cùng giá trị `ProgressBar` dùng) + `#616161` + `#fff` — không có màu brand nào. Bản đầu dùng brand blue `#1668FF`, Stella đổi hết sang đen 06 Aug 2026. Xoá khối CSS + 4 class là quay lại Polaris thuần.

Không hardcode màu — dùng token. Không inline `<svg>` — dùng `s-icon`.

⚠️ **Ngoại lệ 4 không kéo theo quyền dùng ảnh.** Preview vẽ ô xám trơn, KHÔNG đưa thumbnail thật vào (xem §9): bản đầu của trang widget detail để ảnh picsum và ra một dãy ảnh phong cảnh — mắt người review dán vào nội dung ảnh thay vì vào layout, đúng cái §9 cấm. Bỏ ảnh không mất gì: mọi field (cột · gap · radius · overlay · title · CTA · dot) vẫn đọc được trên nền trơn.

---

## 6. Brand boundary (BẮT BUỘC)

**KHÔNG nhuộm brand MakeUGC vào admin.** Không aurora navy, không cyan, không coral.

Admin phải trông **native Shopify** — merchant enterprise dùng Shopify admin cả ngày, app nhuộm màu riêng đọc ra ngay là "third-party, chưa chắc tin". Đây cũng là điều kiện Built for Shopify (Phase 3).

Brand chỉ cho storefront widget + marketing.

---

## 7. Thêm mockup mới

1. Copy route gần nhất trong `app/routes/` → `app/routes/app.[feature].tsx`
   - Tên theo flat-routes convention (`app.videos._index.tsx`, `app.videos.$id.tsx`) để dev copy sang app thật là đúng chỗ
2. Thêm entry vào `app/registry.tsx` — route + index page tự sinh, không sửa `Shell.tsx`
   - Trang khác link động vào (ví dụ Home → `/app/library/{id}`) → thêm `alsoMatch: ['/app/library/:id']`.
     Route match được nhưng không hiện thành link trên index page (link `:id` bấm vào là chết).
3. `npm run typecheck` sạch
4. Mở browser, click qua từng state trong StateSwitcher

```ts
{
  path: '/app/videos',
  label: 'Videos list',
  section: 'Videos',
  status: 'draft',           // draft | ready | blocked
  Component: VideosList,
  routeFile: 'app/routes/app.videos._index.tsx',
  description: '...',
  open: ['câu hỏi chưa chốt'],   // hiện lên index page cho team thấy
}
```

---

## 8. Nav — hiểu đúng

Nav bên trái của app embedded do **App Bridge render NGOÀI iframe** (`<ui-nav-menu>` trong app thật). Web components **không có** `s-frame`/`s-navigation` — đúng như vậy.

Harness bọc mockup trong `components/AdminChrome.tsx` — top bar + **sidebar 240px** giả của Shopify, nav app nằm trong sidebar đó đúng như App Bridge làm.

**Vì sao phải có khung giả:** review ở full-width cho cảm giác SAI về diện tích. Layout 2 cột (main + aside) trông thoải mái ở 1440px nhưng app thật chỉ có **1440 − 240 = 1200px**, và đó là chỗ layout bắt đầu chật. Đã bắt được lỗi grid 3+1 mồ côi ở Home nhờ đo đúng chiều rộng cột main (~638px khi có aside).

Top bar có nhãn `mock admin chrome — harness` để không ai nhầm khung này là UI đề xuất. Route chỉ có trong harness (All mockups, Plans & billing, Settings, Onboarding stale) nằm dưới nhãn riêng **"Chỉ có trong harness"** trong sidebar — `HARNESS_ONLY_NAV` trong `registry.tsx`, tách khỏi `NAV_ITEMS` (nav thật 5 mục).

---

## 9. Sample data

- **Đầy 1 trang, tối thiểu 20 row.** Mockup 3 row che hết vấn đề layout — merchant enterprise có 500+ video.
- Số liệu **thực tế**: tên video như người thật đặt, revenue phân bố hợp lý.
- Cố ý có **video chưa tag product** — lỗi im lặng tệ nhất của app này.
- Data ở `app/data/sample.ts`, không nhồi vào route.
- Setup guide dùng `setupSteps` (4 bước, free path). `onboardingSteps` là bản **stale** 3 bước, chỉ còn `app.onboarding.tsx` dùng.
- **KHÔNG dùng ảnh stock random làm preview UI.** Thumbnail video trong list thì được (đọc ra là content), nhưng "đây là widget của bạn trông thế nào" mà đưa ảnh phong cảnh là làm team review nội dung thay vì layout. Dùng `s-box background="subdued"` có nhãn.

---

## 10. Ngôn ngữ

- **Text trong UI: TIẾNG ANH** (merchant global).
- **Comment code: tiếng Việt** — đọc bởi Stella + dev team VN. Giải thích **vì sao**, không phải cái gì.

---

## 11. App Bridge

Mockup không có admin host nên App Bridge API không chạy. Ghi comment đúng chỗ:

```tsx
// In real app: shopify.toast.show('Video published')
// In real app: shopify.saveBar.show('video-save-bar')
// In real app: shopify.resourcePicker({type: 'product', multiple: true})
```

**Navigation phải client-side** — Built for Shopify reject full-page reload.

⚠️ **Thứ render NGOÀI `s-page` không ăn ràng buộc bề ngang của page.** `s-page` giới hạn nội dung ở **966px** rồi căn giữa; banner job toàn cục nằm ngoài nên ở cửa sổ 1440 nó rộng 1145px — thừa ~90px mỗi bên, đọc ra như một khối lạc khỏi trang. `Shell.tsx` áp lại ràng buộc đó bằng `maxWidth: 974 + paddingInline: 4 + boxSizing: border-box`, đo khớp 0px ở cả 1120 lẫn 1440. **Chỉ là vá của harness** — trong app thật banner thuộc layout route `app/routes/app.tsx`, nằm TRONG page nên tự khớp.

🔴 **`s-link` và `s-button href` KHÔNG client-side.** Chúng render `<a href>` **native trong shadow DOM**, browser tự điều hướng và nạp lại CẢ trang. Trong harness, mỗi cú bấm reset sạch state đang review (state nào đang chọn · tab · vị trí cuộn) — nhìn y như app lỗi. Bắt được 06 Aug 2026 khi Stella báo *"click vào đâu cũng nhảy"*; `evaluate_script` báo `Execution context was destroyed` là dấu hiệu chắc chắn.

→ `Shell.tsx` có một handler bắt click trên link nội bộ và gọi `navigate()`. **Chỉ là miếng vá của harness** — app thật dùng `<Link>` của React Router hoặc `shopify.intents.navigate()`. Handler cố ý bỏ qua: `#…`, link ngoài, `target="_blank"`, và click có phím bổ trợ.

**2 message trong console khi load full page là BÌNH THƯỜNG, đừng đi sửa:**

```
[warn]  The script tag loading App Bridge should be the first script tag in the document
[error] App Bridge Next: missing required configuration fields: shop
```

`index.html` cố ý nạp `app-bridge.js` để giống `<head>` của app thật, nhưng mockup không có admin
host nên App Bridge không init được. Không ảnh hưởng Polaris (`polaris.js` là script riêng).
→ Khi kiểm console của một mockup, **bỏ qua 2 dòng này**; mọi thứ khác là lỗi thật.

---

## 12. Enterprise gate

Trước khi coi mockup xong, đối chiếu [ENTERPRISE-UX-CHECKLIST.md](../.claude/skills/create-mockup/ENTERPRISE-UX-CHECKLIST.md). 3 câu hay sai nhất:

1. Sample data có **đầy 1 trang** không?
2. Mọi `disabled` có lý do bằng **text hiện sẵn** không? (🔴 **KHÔNG dùng tooltip** — verified 05 Aug 2026: `interestFor` không mở trên control `disabled`, browser không dispatch pointer event lên đó. Xem `MAKEUGC-UI-PATTERNS.md` §7a)
3. Tác vụ chạy lâu có **ETA + Cancel**, hay chỉ spinner?

State hay bị quên: **no-sales-yet** (có video chưa có đơn ≠ empty), **quota-blocked** vs **plan-gated** (2 đường thoát khác nhau), **overload** (500+ items), **untagged** (video live chưa tag product).

**Mỗi state phải có `doc` trong `StateSwitcher`** — rule hiển thị để dev đọc thay vì dò điều kiện trong JSX. Chỉ ghi cái **không tự hiện rõ trên trang**; nhìn là thấy thì đừng viết lại.

**Ràng buộc data đang chờ Shopify approve** (scope đọc Orders/Revenue) ghi vào `globalNote`, KHÔNG vẽ mockup riêng: mockup vẽ bản đầy đủ, note nói dev bỏ cái gì. Cụ thể cho Home — Performance bỏ 2 card *Attributed revenue* + *Attributed orders*; Top videos bỏ 2 cột *Orders* + *Revenue*, đổi heading thành *Top videos by views* và sort theo views.

---

## 13. Regenerate API reference

CDN luôn serve bản mới nhất → reference sẽ lệch dần:

```bash
cd /tmp && npm i @shopify/polaris-types@latest
node <repo>/.claude/skills/create-mockup/scripts/gen-pwc-reference.js
```

Rồi chạy lại `npm run typecheck` để xem có gì breaking.
