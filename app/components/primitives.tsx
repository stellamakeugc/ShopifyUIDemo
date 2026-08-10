/**
 * Primitives phải TỰ DỰNG vì Polaris web components không có tương đương.
 *
 * Đây là danh sách khoảng trống thật, đã đối chiếu với Custom Elements Manifest
 * (`.claude/skills/create-mockup/POLARIS-WEB-COMPONENTS.md` — 59 component):
 *
 *   React Polaris          →  web components
 *   ─────────────────────────────────────────────────────────────
 *   ProgressBar            →  KHÔNG CÓ  → ProgressBar (dưới đây)
 *   EmptyState             →  KHÔNG CÓ  → EmptyState (dưới đây)
 *   SkeletonBodyText       →  KHÔNG CÓ  → dùng s-spinner, hoặc `loading` của s-table
 *   Collapsible            →  KHÔNG CÓ  → <details>/conditional render
 *   Tabs                   →  KHÔNG CÓ  → s-button list
 *   MediaCard              →  KHÔNG CÓ  → s-grid + s-image
 *   Pagination             →  built vào s-table (`paginate`)
 *   IndexFilters           →  built vào s-table (slot `filters`)
 *   IndexTable selection   →  KHÔNG CÓ  → SelectAllBar + s-checkbox (dưới đây)
 *
 * Mấy cái tự dựng này dùng `s-box`/`s-stack` + token Polaris, KHÔNG hardcode màu,
 * để nếu Shopify ship component thật thì thay vào là xong.
 */
import {useEffect, useState} from 'react';
import type {ReactNode} from 'react';

/**
 * Progress bar — KHÔNG có `s-progress-bar`.
 *
 * ⚠️ PHÁT HIỆN QUAN TRỌNG CHO DUONG — đã verify trong browser:
 * Polaris web components **KHÔNG expose CSS custom property công khai** nào cho màu
 * (style đóng gói trong shadow DOM qua adoptedStyleSheets; chỉ có 1 var nội bộ
 * `--s-icon-color-*`). Kiểm bằng cách quét toàn bộ styleSheets + adoptedStyleSheets:
 * `--p-color-bg-fill-*` đều rỗng.
 *
 * → Hệ quả kiến trúc: **bất cứ thứ gì tự dựng đều phải hardcode màu**, và màu đó
 * sẽ trôi lệch khỏi token Polaris khi Shopify đổi theme. Đây là cái giá thật của
 * việc web components còn thiếu component, không phải do viết tắt.
 *
 * → Khi Shopify ship `s-progress-bar`, thay component này và xoá hex bên dưới.
 * Hex hiện tại lấy xấp xỉ từ Polaris: ink #303030, critical #c0331f, caution #b98900.
 */
export function ProgressBar({
  progress,
  tone = 'primary',
  label,
  hideLabel = false,
}: {
  progress: number;
  tone?: 'primary' | 'critical' | 'warning';
  label?: string;
  /**
   * Ẩn label khỏi mắt nhưng GIỮ làm `aria-label` của progressbar.
   *
   * Dùng khi chỗ gọi đã hiện con số đó rồi (ví dụ `JobProgress` có dòng
   * "4 of 12 done · ~4 min left" ngay trên bar) — hiện lại là lặp thông tin.
   * Không xoá `label` đi được: progressbar mất tên thì screen reader chỉ đọc "45%".
   */
  hideLabel?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, progress));
  const background = tone === 'critical' ? '#c0331f' : tone === 'warning' ? '#b98900' : '#303030';

  return (
    <s-stack direction="block" gap="small-500">
      {label && !hideLabel && <s-text color="subdued">{label}</s-text>}
      {/* Track */}
      <s-box background="subdued" borderRadius="large" minBlockSize="0" overflow="hidden">
        {/* Fill — width động nên phải dùng style, không có token cho việc này */}
        <div
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label ?? 'Progress'}
          style={{width: `${clamped}%`, height: 8, background, borderRadius: 8}}
        />
      </s-box>
    </s-stack>
  );
}

/**
 * Tab bar — KHÔNG có `s-tabs`.
 *
 * Vì sao tách ra thành primitive: pattern `variant={active ? 'primary' : 'tertiary'}`
 * đã copy-paste **4 lần** ở 2 file (`app.library._index.tsx` × 3, `app.settings.tsx`).
 * Quá ngưỡng "lặp 3 lần → tách" của `mockup-app/CLAUDE.md` §4.
 *
 * ⚠️ **Khoảng trống a11y mà mọi bản copy-paste trước đều dính:** trạng thái "tab nào
 * đang chọn" được truyền tải **chỉ bằng variant** (tức chỉ bằng màu nền). Screen
 * reader đọc 3 nút y như nhau, không biết đang ở tab nào — vi phạm
 * `ENTERPRISE-UX-CHECKLIST.md` §9 ("không truyền tải thông tin chỉ bằng màu").
 *
 * Cách bù: `s-text accessibilityVisibility="exclusive"` bên trong nút đang chọn, để
 * screen reader đọc "Connections, selected" mà mắt không thấy gì thêm. KHÔNG dùng
 * `accessibilityLabel` — nó THAY nhãn chứ không thêm vào, nên sẽ mất luôn tên tab.
 */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly {id: T; label: string}[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <s-box background="subdued" borderRadius="base" padding="small-100">
      <s-stack direction="inline" gap="small-200" alignItems="center">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <s-button
              key={tab.id}
              variant={isActive ? 'primary' : 'tertiary'}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              {/* Chỉ screen reader đọc — mắt không thấy, nên không lặp thông tin */}
              {isActive && <s-text accessibilityVisibility="exclusive">, selected</s-text>}
            </s-button>
          );
        })}
      </s-stack>
    </s-box>
  );
}

/**
 * Hình thu nhỏ của widget — dạng widget đó trông thế nào trên storefront.
 *
 * Vì sao cần: 6 template khác nhau ở **HÌNH DẠNG** (hàng ngang · thẻ giữa to · vòng tròn ·
 * bong bóng góc · feed dọc). Ô xám kèm tên template không truyền tải được điều đó — merchant
 * phải đọc tên rồi tự tưởng tượng. Stella phản hồi 06 Aug 2026: "nên có ảnh mockup của
 * widget (tĩnh), có thumb của các video thật".
 *
 * ⚠️ Tinh chỉnh `mockup-app/CLAUDE.md` §9. Rule đó cấm ảnh stock **ngẫu nhiên** trong preview
 * — lý do thật là ảnh không liên quan làm người review nhìn nội dung ảnh thay vì layout.
 * Thumbnail của **chính playlist widget này** thì ngược lại: nó là nội dung merchant nhận ra,
 * và nếu không có nó thì hình dạng không đọc được. Không có video → ô xám trơn giữ nguyên.
 *
 * CSS thuần: đây là ngoại lệ "storefront preview" ở §5 — không token Polaris nào biểu diễn
 * được hình dạng widget.
 */
export function WidgetShape({templateId, thumbs}: {templateId: string; thumbs: string[]}) {
  const fill = (index: number): React.CSSProperties =>
    thumbs[index]
      ? {backgroundImage: `url(${thumbs[index]})`, backgroundSize: 'cover', backgroundPosition: 'center'}
      // `backgroundColor` chứ không phải shorthand `background` — trộn với longhand
      // `backgroundImage` ở nhánh kia làm React warn khi rerender
      : {backgroundColor: '#d9d9d9'};
  const card = (index: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
    borderRadius: 4,
    aspectRatio: '9 / 16',
    ...fill(index),
    ...extra,
  });

  if (templateId === 'spotlight') {
    // Vòng tròn kiểu story — hình tròn LÀ điểm nhận dạng của template này
    return (
      <Frame>
        <div style={{display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center'}}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                border: '2px solid #616161', ...fill(index),
              }}
            />
          ))}
        </div>
      </Frame>
    );
  }

  if (templateId === 'bubble') {
    // Khung trang + một bong bóng ở GÓC — vị trí góc là điểm nhận dạng
    return (
      <Frame>
        <div style={{position: 'relative', width: '100%', height: 64, background: '#fff', border: '1px solid #e3e3e3', borderRadius: 4}}>
          <div style={{position: 'absolute', top: 8, left: 8, right: 8, height: 4, background: '#ebebeb', borderRadius: 2}} />
          <div style={{position: 'absolute', top: 18, left: 8, width: '55%', height: 4, background: '#ebebeb', borderRadius: 2}} />
          <div style={{position: 'absolute', right: 6, bottom: 6, width: 22, height: 30, borderRadius: 6, ...fill(0)}} />
        </div>
      </Frame>
    );
  }

  if (templateId === 'feed') {
    // Một thẻ dọc chiếm hết — full-screen
    return (
      <Frame>
        <div style={{...card(0), width: 38, margin: '0 auto', aspectRatio: '9 / 16'}} />
      </Frame>
    );
  }

  if (templateId === 'stacked') {
    // Thẻ giữa to, hai bên co lại — đúng thứ mô tả nói
    return (
      <Frame>
        <div style={{display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center'}}>
          <div style={{...card(0), width: 24, opacity: 0.55}} />
          <div style={{...card(1), width: 40}} />
          <div style={{...card(2), width: 24, opacity: 0.55}} />
        </div>
      </Frame>
    );
  }

  // product-stories · carousel — hàng ngang đều nhau.
  // Carousel thêm mũi tên + chấm: nếu không thì hai template này hình y hệt nhau, mà
  // đúng thứ phân biệt chúng là "shoppers can move with arrows, dots, or by dragging".
  const isCarousel = templateId === 'carousel';
  return (
    <Frame>
      <div style={{display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center'}}>
        <div style={{display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center'}}>
          {isCarousel && <Chevron>‹</Chevron>}
          {[0, 1, 2].map((index) => (
            <div key={index} style={{...card(index), width: 30}} />
          ))}
          {isCarousel && <Chevron>›</Chevron>}
        </div>
        {isCarousel && (
          <div style={{display: 'flex', gap: 3}}>
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                style={{width: 4, height: 4, borderRadius: 999, background: '#616161', opacity: dot === 0 ? 1 : 0.3}}
              />
            ))}
          </div>
        )}
      </div>
    </Frame>
  );
}

/** Mũi tên điều hướng của carousel */
function Chevron({children}: {children: ReactNode}) {
  return (
    <span
      style={{
        width: 14, height: 14, borderRadius: 999, background: '#fff',
        border: '1px solid #c9c9c9', color: '#616161', fontSize: 9,
        lineHeight: '12px', textAlign: 'center',
      }}
    >
      {children}
    </span>
  );
}

/** Khung nền chung cho mọi hình dạng — giữ mọi thẻ cao bằng nhau */
function Frame({children}: {children: ReactNode}) {
  return (
    <s-box background="subdued" borderRadius="base" padding="small">
      <div style={{minHeight: 76, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {children}
      </div>
    </s-box>
  );
}

/**
 * Pill cho danh sách surface — thay cho một dòng text nằm dưới đoạn mô tả.
 *
 * Vì sao tách ra: `'Product page, Home page or Collection page'` viết thành câu, đặt ngay
 * dưới một blurb 3 dòng, thì đọc ra như đoạn văn thứ hai — cả thẻ thành một khối chữ liền
 * (Stella phản hồi 06 Aug 2026: "hơi nhiều chữ"). Ba pill rời thì mắt bắt ngay "đặt được ở
 * 3 chỗ" mà không phải đọc.
 *
 * ⚠️ KHÔNG mâu thuẫn với rule "chip trần không tự giải thích" (`MAKEUGC-UI-PATTERNS.md`
 * §3c): rule đó nói về **control lọc** — merchant phải biết mình đang lọc theo trục nào.
 * Đây là **metadata chỉ để đọc** trong một thẻ đã có tiêu đề, đúng trường hợp §3c ghi là
 * chip dùng được. Dùng `s-badge` chứ không `s-chip`: chip ngụ ý bấm/gỡ được.
 */
export function SurfacePills({surfaces, note}: {surfaces: string[]; note?: string}) {
  return (
    <s-stack direction="inline" gap="small-400" alignItems="center">
      {surfaces.map((surface) => (
        <s-badge key={surface}>{surface}</s-badge>
      ))}
      {/* Bổ nghĩa ("below description") KHÔNG thành badge: nó không phải một surface nữa,
          để cùng kiểu là đọc ra thành 2 chỗ đặt */}
      {note && <s-text color="subdued">{note}</s-text>}
    </s-stack>
  );
}

/**
 * Empty state — KHÔNG có `s-empty-state`.
 *
 * Dual pattern giữ nguyên ý nghĩa từ bản React: no-data (dạy người dùng + CTA)
 * KHÁC no-search-result (chỉ gợi ý sửa filter). Đây là rule UX, không phụ thuộc
 * design system nào.
 */
export function EmptyState({
  isEmptyState,
  heading,
  body,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  onSecondaryAction,
  resourceName = 'items',
}: {
  isEmptyState: boolean;
  heading: string;
  body: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  /**
   * Dùng khi CTA KHÔNG phải điều hướng — ví dụ "Connect TikTok" của Settings →
   * Connections là OAuth redirect, không phải link tới route trong app.
   * Có `onAction` thì bỏ `href` (nút vừa link vừa onClick là hai hành vi chồng nhau).
   */
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  onSecondaryAction?: () => void;
  resourceName?: string;
}) {
  if (!isEmptyState) {
    // Có data nhưng filter không ra — KHÔNG dạy lại, không hiện CTA tạo mới
    return (
      <s-box padding="large-200">
        <s-stack direction="block" gap="small-100" alignItems="center">
          <s-icon type="search" tone="neutral" />
          <s-heading>No {resourceName} found</s-heading>
          <s-paragraph color="subdued">Try changing the filters or search term.</s-paragraph>
        </s-stack>
      </s-box>
    );
  }

  return (
    <s-box padding="large-300">
      <s-stack direction="block" gap="base" alignItems="center">
        <s-heading>{heading}</s-heading>
        <s-paragraph color="subdued">{body}</s-paragraph>
        <s-stack direction="inline" gap="small-100">
          {actionLabel && (
            <s-button
              variant="primary"
              href={onAction ? undefined : actionHref}
              onClick={onAction}
            >
              {actionLabel}
            </s-button>
          )}
          {secondaryLabel && (
            <s-button
              variant="secondary"
              href={onSecondaryAction ? undefined : secondaryHref}
              onClick={onSecondaryAction}
            >
              {secondaryLabel}
            </s-button>
          )}
        </s-stack>
      </s-stack>
    </s-box>
  );
}

/**
 * Bulk-selection bar — `s-table` KHÔNG có row selection / bulk actions.
 *
 * ⚠️ Đây là khoảng trống enterprise nghiêm trọng nhất của web components:
 * merchant có 500+ video, bulk ops là bắt buộc, nhưng phải tự dựng hoàn toàn.
 * Cần Duong xác nhận cách làm trước khi build thật.
 *
 * Nguyên tắc giữ từ bản React: phân biệt rõ "20 trên trang này" vs "tất cả 543".
 */
export function SelectAllBar({
  selectedCount,
  pageCount,
  totalCount,
  onSelectAllPages,
  onClear,
  children,
}: {
  selectedCount: number;
  pageCount: number;
  totalCount: number;
  onSelectAllPages: () => void;
  onClear: () => void;
  children?: ReactNode;
}) {
  if (selectedCount === 0) return null;
  const allOnPageSelected = selectedCount >= pageCount;

  return (
    <s-box background="strong" padding="small-100" borderRadius="base">
      <s-stack direction="inline" gap="small-100" alignItems="center" justifyContent="space-between">
        <s-stack direction="inline" gap="small-100" alignItems="center">
          <strong>{selectedCount} selected</strong>
          {/* Nói rõ con số — đừng để merchant đoán "All" nghĩa là bao nhiêu */}
          {allOnPageSelected && selectedCount < totalCount && (
            <s-button variant="tertiary" onClick={onSelectAllPages}>
              Select all {totalCount}
            </s-button>
          )}
          <s-button variant="tertiary" onClick={onClear}>
            Clear
          </s-button>
        </s-stack>
        <s-stack direction="inline" gap="small-100" alignItems="center">
          {children}
        </s-stack>
      </s-stack>
    </s-box>
  );
}

/**
 * KPI tile. Không có `s-card` — dùng `s-section`.
 *
 * `help` giải thích CÁCH TÍNH metric qua tooltip: enterprise sẽ đối chiếu số này
 * với báo cáo của họ nên phải nói rõ "attributed" nghĩa là gì.
 *
 * Tooltip web components dùng cơ chế `interestFor` trỏ tới id của `s-tooltip`,
 * KHÔNG phải bọc children như React Polaris.
 */
export function KpiTile({
  id,
  label,
  value,
  help,
  trend,
  emptyLabel,
  loading = false,
}: {
  id: string;
  label: string;
  value: string;
  help?: string;
  trend?: {value: string; direction: 'up' | 'down'; good: boolean};
  emptyLabel?: string;
  loading?: boolean;
}) {
  return (
    <s-section padding="base">
      <s-stack direction="block" gap="small-100">
        {help ? (
          <>
            {/* Icon info là DẤU HIỆU CÓ TOOLTIP. Không có nó thì label trông y như
                text thường và không ai biết có gì để hover — tooltip vô hình là
                tooltip không tồn tại. `interestFor` đặt trên CẢ label và icon để
                hover chỗ nào cũng mở (không đặt được trên `s-stack`). */}
            <s-stack direction="inline" gap="small-500" alignItems="center">
              <s-text interestFor={`${id}-tip`}>
                <strong>{label}</strong>
              </s-text>
              <s-icon
                type="info"
                size="small"
                color="subdued"
                interestFor={`${id}-tip`}
              />
            </s-stack>
            <s-tooltip id={`${id}-tip`}>{help}</s-tooltip>
          </>
        ) : (
          <strong>{label}</strong>
        )}

        {loading ? (
          <s-spinner size="base" accessibilityLabel={`Loading ${label}`} />
        ) : emptyLabel ? (
          // State "no-data-yet" — KHÁC empty state của cả trang.
          // Có video nhưng chưa có đơn thì nói vậy, đừng hiện "$0" trơ trọi.
          <s-text color="subdued">{emptyLabel}</s-text>
        ) : (
          <s-stack direction="inline" gap="small-200" alignItems="center">
            <s-heading>{value}</s-heading>
            {trend && (
              <s-stack direction="inline" gap="small-500" alignItems="center">
                <s-icon
                  type={trend.direction === 'up' ? 'arrow-up' : 'arrow-down'}
                  tone={trend.good ? 'success' : 'critical'}
                  size="small"
                />
                <s-text tone={trend.good ? 'success' : 'critical'}>{trend.value}</s-text>
              </s-stack>
            )}
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}

/**
 * Range slider — KHÔNG có `s-range-slider`.
 *
 * Đã đối chiếu toàn bộ 59 component trong Custom Elements Manifest: có `s-number-field`,
 * `s-color-picker`, `s-date-picker`, nhưng **không có slider nào**. Mà panel "Audio
 * settings" của platform là bốn slider (Clarity · Tone · Emotion · Speed) — đó là cách
 * duy nhất đọc được "0.75 trên thang 0–1" trong một liếc mắt. `s-number-field` gõ được
 * số nhưng mất hẳn cảm giác vị trí trên thang, và chỉnh giọng là việc dò dần chứ không
 * phải nhập số.
 *
 * ⚠️ NGOẠI LỆ CSS THỨ 5 của repo (`mockup-app/CLAUDE.md` §5). Dùng `<input type="range">`
 * native vì:
 *   - track/thumb của range chỉ style được qua `::-webkit-slider-thumb` / `::-moz-range-thumb`,
 *     không có token Polaris nào chạm tới
 *   - `accentColor` là cách rẻ nhất để nó không xanh mặc định của browser
 * Hex `#303030` = ink Polaris, đúng giá trị `ProgressBar` phía trên đang dùng → KHÔNG phá
 * §6 brand boundary (không có màu brand MakeUGC nào ở đây).
 *
 * Khi Shopify ship `s-range-slider`: thay component này, xoá `accentColor`, xong.
 */
export function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  disabled = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Chuỗi đã format sẵn ("0.75", "1.0x") — chỗ gọi biết đơn vị, component thì không */
  displayValue: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <s-stack direction="block" gap="small-500">
      {/* Giá trị đặt cạnh nhãn chứ không dưới thumb: thumb di chuyển nên số đi theo là
          mắt phải đuổi. Đây cũng đúng cách platform bày (nhãn trái, số phải). */}
      <s-stack direction="inline" gap="small-200" alignItems="center" justifyContent="space-between">
        <s-text color="subdued">
          <label htmlFor={id}>{label}</label>
        </s-text>
        <s-text type="strong">{displayValue}</s-text>
      </s-stack>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        style={{width: '100%', accentColor: '#303030', cursor: disabled ? 'not-allowed' : 'pointer'}}
      />
    </s-stack>
  );
}

/**
 * Ô giữ chỗ cho media chưa có asset thật.
 *
 * VÌ SAO CẦN (bắt được 07 Aug 2026 khi review lưới template trong browser):
 * `mockup-app/CLAUDE.md` §9 cho phép thumbnail video trong LIST vì ở đó nó nằm cạnh
 * tiêu đề nên đọc ra là "khung hình của video này". Nhưng thẻ template trong Content
 * Library **chỉ có mỗi ảnh, không có chữ nào** — nên một ảnh picsum chụp tường gạch
 * đọc thẳng ra là "template về tường gạch". Với thẻ actor còn tệ hơn: ảnh phong cảnh
 * dán nhãn "Julian · HD" là nói dối về thứ đang xem.
 *
 * → Ô xám có nhãn nói thật hơn: nó truyền tải HÌNH DẠNG và MẬT ĐỘ lưới (thứ cần review)
 * mà không giả vờ là nội dung. Thay bằng asset thật khi có.
 *
 * CSS thuần vì `s-box` không có `aspectRatio`, và tỉ lệ 9:16 là thứ phải đúng — lưới
 * ảnh dọc khác hẳn lưới ảnh vuông về số cột và chiều cao cuộn.
 */
export function MediaPlaceholder({
  aspectRatio,
  label,
  sublabel,
}: {
  /** '9/16' cho video dọc, '3/4' cho chân dung actor */
  aspectRatio: string;
  label: string;
  sublabel?: string;
}) {
  return (
    <div
      style={{
        aspectRatio,
        background: '#f1f1f1',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 8,
        textAlign: 'center',
      }}
    >
      <s-text color="subdued">{label}</s-text>
      {sublabel && <s-text color="subdued">{sublabel}</s-text>}
    </div>
  );
}

/**
 * Pill lọc — hàng chip taxonomy của Content Library và các hàng lọc khác.
 *
 * VÌ SAO TỰ DỰNG thay vì dùng `s-clickable-chip` (Stella chốt 07 Aug 2026, kèm ảnh mẫu
 * từ platform). Đo `s-clickable-chip` thật trong browser:
 *   radius 8px · nền rgba(0,0,0,.06) · chữ 12px · padding 2px 8px · KHÔNG viền
 *   chọn = `color="strong"` → nền rgb(227,227,227)
 *
 * Hai vấn đề, một là thẩm mỹ và một là THẬT:
 *  • 🔴 **Trạng thái chọn gần như không đọc được.** rgb(227,227,227) so với rgba(0,0,0,.06)
 *    là chênh lệch cực nhỏ — trên một hàng 35 chip, merchant không thấy mình đang lọc theo
 *    cái gì. Đây là lỗi chức năng, không phải chuyện đẹp xấu.
 *  • Radius 8px + chữ 12px không ra dáng pill, và 12px là nhỏ cho một hàng lọc dài.
 *
 * `s-clickable-chip` chỉ có `color: subdued|base|strong` — không có prop nào cho radius,
 * viền hay cỡ chữ, và style của nó nằm trong shadow DOM nên CSS ngoài không với tới.
 *
 * ⚠️ NGOẠI LỆ CSS — cùng hạng với `PLAN_CARD_CSS` của trang Billing (`CLAUDE.md` §5 mục 4,
 * Stella chốt 06 Aug 2026): khi Polaris không có đường làm được thứ đã chốt thì tự dựng,
 * nhưng **giữ toàn bộ trong dải xám/đen** — `#303030` là ink Polaris (đúng giá trị
 * `ProgressBar` dùng), không có màu brand MakeUGC nào → KHÔNG phá §6.
 *
 * Đánh đổi phải biết: pill này **không tự nhận cập nhật** khi Shopify đổi style chip.
 * Ngày `s-clickable-chip` có prop `variant="outline"` thì xoá component này và khối CSS.
 */
const FILTER_PILL_CSS = `
.mk-pill{
  border-radius:999px;
  border:1px solid #c9c9c9;
  background:#fff;
  color:#303030;
  font-size:13px;
  line-height:1;
  padding:7px 14px;
  cursor:pointer;
  transition:border-color .1s ease, background .1s ease;
}
.mk-pill:hover{ border-color:#8a8a8a; }
.mk-pill:focus-visible{ outline:2px solid #303030; outline-offset:2px; }
.mk-pill[aria-pressed="true"]{
  background:#303030;
  border-color:#303030;
  color:#fff;
}
.mk-pill[aria-pressed="true"]:hover{ background:#1a1a1a; }
`;

/**
 * Hàng pill tự xuống dòng.
 *
 * `s-stack` không có `wrap` và `s-grid` ép mọi ô bằng nhau ("All" sẽ rộng bằng
 * "Beauty & Personal Care") → flex-wrap là cách duy nhất (`CLAUDE.md` §5 mục 7).
 *
 * Trạng thái chọn dùng `aria-pressed` chứ không phải class riêng: nó vừa lái CSS vừa là
 * thứ screen reader đọc được, nên không cần nhét thêm text ẩn như `TabBar` phải làm.
 */
export function FilterPills<T extends string>({
  options,
  active,
  onPick,
  ariaLabel,
}: {
  options: readonly T[];
  /** Giá trị đang chọn; `null` = không chọn cái nào */
  active: T | null;
  onPick: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <>
      <style>{FILTER_PILL_CSS}</style>
      <div
        role="group"
        aria-label={ariaLabel}
        style={{display: 'flex', flexWrap: 'wrap', gap: 8}}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="mk-pill"
            aria-pressed={option === active}
            onClick={() => onPick(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </>
  );
}

/**
 * Player xem trước video — điều khiển ĐÈ LÊN khung hình, đúng như platform.
 *
 * ═══ VÌ SAO ĐỔI TỪ "THANH DƯỚI ẢNH" SANG OVERLAY (Stella chốt 07 Aug 2026, kèm ảnh) ═══
 * Bản đầu tôi để điều khiển nằm dưới ảnh vì `s-text`/`s-icon` chỉ có `color: subdued|base`
 * — không viết được chữ trắng trên nền tối, mà overlay thì bắt buộc phải trắng. Lập luận
 * đó đúng về mặt kỹ thuật nhưng ra sai sản phẩm: thanh rời bên dưới đọc như một widget
 * audio, không đọc như video player. Merchant đã quen player của YouTube/TikTok.
 *
 * ⚠️ NGOẠI LỆ CSS + INLINE SVG. Khác các ngoại lệ trước ở chỗ nó cũng phá luôn rule
 * "không inline `<svg>` — dùng `s-icon`" (§5). Lý do rule đó tồn tại là để không ai vẽ lại
 * icon admin bằng tay khi Polaris đã có; ở đây `s-icon` **không dùng được** vì không đổi
 * được sang màu trắng.
 *
 * Khung biện minh: **player là media chrome, không phải admin chrome** — cùng hạng với
 * ngoại lệ "storefront preview" (§5 mục 4), được phép trông không-Polaris vì nó đại diện
 * cho một thứ không-Polaris. Khung bao quanh nó vẫn là Polaris thuần.
 *
 * Toàn bộ màu là trắng/đen/trong suốt — không có màu brand nào, không phá §6.
 *
 * ═══ KHÁC PLATFORM MỘT CHỖ, CỐ Ý ═══
 * Platform có thêm nút `⋮` (kebab). BỎ: menu đó của platform chứa download/report — trong
 * app Shopify template không có hành động nào như vậy, và modal đã có sẵn Close +
 * "Use this template". Thêm một nút không làm gì là bịa UI.
 *
 * Mặc định `playing = true` vì video TỰ CHẠY khi mở modal. Chỗ gọi phải truyền `key={id}`
 * để đổi video là đồng hồ về 0.
 */
const VIDEO_PLAYER_CSS = `
.mk-vp{ position:relative; border-radius:8px; overflow:hidden; line-height:0; }
.mk-vp-bar{
  position:absolute; inset-inline:0; bottom:0;
  /* padding-bottom 10px: thanh tiến trình KHÔNG sát mép đáy (Stella 07 Aug 2026) —
     sát mép thì nó dính vào viền bo của khung và đọc như bị cắt */
  padding:28px 10px 10px;
  background:linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.38) 55%, rgba(0,0,0,0) 100%);
  line-height:1;
}
.mk-vp-row{ display:flex; align-items:center; gap:10px; padding-bottom:8px; }
.mk-vp-btn{
  display:inline-flex; align-items:center; justify-content:center;
  width:28px; height:28px; padding:0;
  border:0; border-radius:999px; background:transparent;
  color:#fff; cursor:pointer;
}
.mk-vp-btn:hover{ background:rgba(255,255,255,.18); }
.mk-vp-btn:focus-visible{ outline:2px solid #fff; outline-offset:1px; }
.mk-vp-time{ color:#fff; font-size:12px; font-variant-numeric:tabular-nums; }
.mk-vp-spacer{ flex:1; }
/* Bo tròn vì track giờ nằm lọt trong khung chứ không còn chạy hết mép — cạnh vuông
   ở giữa nền ảnh đọc ra như một vệt lỗi */
.mk-vp-track{ height:3px; border-radius:999px; background:rgba(255,255,255,.35); overflow:hidden; }
.mk-vp-fill{ height:100%; border-radius:999px; background:#fff; }
`;

/** Icon của player — inline SVG vì `s-icon` không đổi được sang màu trắng */
function PlayerIcon({name}: {name: 'play' | 'pause' | 'volume' | 'muted' | 'expand'}) {
  const common = {width: 16, height: 16, viewBox: '0 0 24 24', 'aria-hidden': true} as const;
  if (name === 'pause') {
    return (
      <svg {...common} fill="currentColor">
        <rect x="7" y="5" width="3.5" height="14" rx="1" />
        <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
      </svg>
    );
  }
  if (name === 'play') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M8 5.5v13a1 1 0 0 0 1.5.87l10.5-6.5a1 1 0 0 0 0-1.74L9.5 4.63A1 1 0 0 0 8 5.5Z" />
      </svg>
    );
  }
  if (name === 'expand') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      </svg>
    );
  }
  // volume / muted dùng chung thân loa
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M4 9.5h3.5L12 6v12L7.5 14.5H4z" fill="currentColor" />
      {name === 'volume' ? (
        <path d="M15.5 9a4 4 0 0 1 0 6" strokeLinecap="round" />
      ) : (
        <path d="M16 9.5l4 5M20 9.5l-4 5" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function VideoPreview({
  src,
  alt,
  durationSec,
}: {
  src: string;
  alt: string;
  durationSec: number;
}) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) return;
    // 250ms cho nhẹ — 100ms thì re-render 10 lần/giây mà mắt không phân biệt được
    const id = window.setInterval(() => {
      setElapsed((current) => (current + 0.25) % durationSec);
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, durationSec]);

  const clock = (seconds: number) => `0:${String(Math.floor(seconds)).padStart(2, '0')}`;
  const percent = (elapsed / durationSec) * 100;

  return (
    <>
      <style>{VIDEO_PLAYER_CSS}</style>
      <div className="mk-vp">
        <s-image src={src} alt={alt} aspectRatio="9/16" objectFit="cover" />
        <div className="mk-vp-bar">
          <div className="mk-vp-row">
            <button
              type="button"
              className="mk-vp-btn"
              aria-label={playing ? 'Pause preview' : 'Play preview'}
              onClick={() => setPlaying((current) => !current)}
            >
              <PlayerIcon name={playing ? 'pause' : 'play'} />
            </button>
            <span className="mk-vp-time">
              {clock(elapsed)} / {clock(durationSec)}
            </span>
            <span className="mk-vp-spacer" />
            <button
              type="button"
              className="mk-vp-btn"
              aria-label={muted ? 'Unmute preview' : 'Mute preview'}
              onClick={() => setMuted((current) => !current)}
            >
              <PlayerIcon name={muted ? 'muted' : 'volume'} />
            </button>
            {/* Fullscreen vẽ để khớp platform nhưng CHƯA nối — trong mockup không có
                video thật để phóng to. Vẫn có nhãn để screen reader không đọc nút trống. */}
            <button type="button" className="mk-vp-btn" aria-label="Full screen (not wired in mockup)">
              <PlayerIcon name="expand" />
            </button>
          </div>
          {/* Thanh tiến trình sát mép đáy, đúng platform. `role="progressbar"` + nhãn vì
              nó là thông tin, không phải vạch trang trí. */}
          <div
            className="mk-vp-track"
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${clock(elapsed)} of ${clock(durationSec)}`}
          >
            <div className="mk-vp-fill" style={{width: `${percent}%`}} />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Vòng tròn đếm ngược — Stella yêu cầu 08 Aug 2026 cho banner "Thank you" tự tắt.
 *
 * 🔴 Polaris web components KHÔNG có circular progress (đã soát cả 59 component). Vòng
 * tròn phải vẽ bằng SVG: `stroke-dasharray` = chu vi, rồi rút `stroke-dashoffset` dần.
 * Cùng hạng ngoại lệ inline-SVG với `PlayerIcon` — `s-icon` không vẽ được tiến trình.
 *
 * Vì sao đếm bằng state chứ không bằng CSS animation: con số bên cạnh và vòng tròn phải
 * khớp nhau. Chạy animation cho vòng tròn rồi đếm số riêng là hai đồng hồ, và chúng sẽ
 * lệch. Một nguồn thời gian duy nhất thì không lệch được.
 *
 * `onDone` gọi ĐÚNG MỘT LẦN — có cờ chặn, vì interval có thể chạy thêm một nhịp trước khi
 * cleanup kịp và chỗ gọi thường dùng nó để đổi state.
 */
export function CountdownRing({
  seconds,
  onDone,
  size = 20,
}: {
  seconds: number;
  onDone?: () => void;
  size?: number;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const startedAt = performance.now();
    let fired = false;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, seconds - (performance.now() - startedAt) / 1000);
      setLeft(remaining);
      if (remaining <= 0 && !fired) {
        fired = true;
        window.clearInterval(id);
        onDone?.();
      }
    }, 80);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const radius = size / 2 - 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="timer"
      aria-label={`Closing in ${Math.ceil(left)} ${Math.ceil(left) === 1 ? 'second' : 'seconds'}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#c9c9c9"
        strokeWidth="2"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#303030"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - left / seconds)}
        // Bắt đầu từ 12 giờ và chạy theo chiều kim đồng hồ
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
