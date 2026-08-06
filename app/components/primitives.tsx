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
