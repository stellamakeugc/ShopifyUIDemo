import type {ReactNode} from 'react';

import type {IconName} from '../registry';

/**
 * HARNESS ONLY — khung admin giả của Shopify (top bar + sidebar bên trái).
 *
 * ═══ VÌ SAO CÓ ═══
 * App embedded chạy trong iframe, và **sidebar của Shopify chiếm 240px cố định** ở
 * bên trái. Review mockup ở full-width màn hình cho cảm giác sai về diện tích: layout
 * 2 cột (main + aside) trông thoải mái ở 1440px nhưng chật hẳn khi mất 240px. Khung
 * này để nhìn đúng phần đất app thật có.
 *
 * ═══ KHÔNG PHẢI UI ĐỀ XUẤT ═══
 * Đây là mô phỏng admin của Shopify, **không phải phần app**. Dev copy route đi thì
 * KHÔNG copy file này. Nav của app trong sidebar là `<ui-nav-menu>` của App Bridge —
 * App Bridge render nó NGOÀI iframe, app không tự vẽ (xem `CLAUDE.md` §8).
 *
 * ═══ NGOẠI LỆ CSS ═══
 * Top bar của Shopify là màu gần đen và chữ trắng. Polaris web components không expose
 * token màu công khai (đã verify — xem `primitives.tsx`), `s-box background` chỉ có
 * transparent/subdued/base/strong và `s-text color` chỉ có subdued/base. Nên top bar
 * dùng HTML thuần + inline style, gom vào ĐÚNG một chỗ dưới đây. Đây là ngoại lệ CSS
 * thứ ba của repo, chỉ áp cho harness chrome.
 */

/** Nav thật của Shopify — chỉ để nhìn, KHÔNG bấm được */
const SHOPIFY_NAV: {label: string; icon: IconName}[] = [
  {label: 'Home', icon: 'home'},
  {label: 'Orders', icon: 'order'},
  {label: 'Products', icon: 'product'},
  {label: 'Customers', icon: 'person'},
  {label: 'Growth', icon: 'megaphone'},
  {label: 'Discounts', icon: 'discount'},
  {label: 'Content', icon: 'content'},
  {label: 'Markets', icon: 'globe'},
  {label: 'Finance', icon: 'money'},
  {label: 'Analytics', icon: 'chart-line'},
];

const SALES_CHANNELS: {label: string; icon: IconName}[] = [
  {label: 'Online Store', icon: 'store'},
  {label: 'Agentic', icon: 'apps'},
];

const TOP_BAR_HEIGHT = 56;
const SIDEBAR_WIDTH = 240;

export interface ChromeNavItem {
  path: string;
  label: string;
  icon: IconName;
}

export default function AdminChrome({
  appNav,
  harnessNav,
  currentPath,
  onNavigate,
  simulateJob,
  onToggleSimulateJob,
  children,
}: {
  /** Nav THẬT của app — hiện thành sub-item dưới app trong sidebar Shopify */
  appNav: ChromeNavItem[];
  /** Route chỉ tồn tại trong harness (Plans, Settings, Onboarding stale) */
  harnessNav: ChromeNavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  /**
   * Công tắc giả lập job của harness. Dùng `<input>` thuần chứ KHÔNG dùng `s-switch`:
   * nhãn của `s-switch` nằm trong shadow DOM nên không đổi được sang màu trắng, đặt
   * trên top bar đen là chữ đen trên nền đen.
   */
  simulateJob: boolean;
  onToggleSimulateJob: () => void;
  children: ReactNode;
}) {
  return (
    <s-stack direction="block" gap="none">
      {/* ══ TOP BAR — HTML thuần, xem §NGOẠI LỆ CSS ở đầu file ══ */}
      <div
        style={{
          height: TOP_BAR_HEIGHT,
          background: '#1a1a1a',
          color: '#e3e3e3',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 12px',
          fontSize: 13,
          flexShrink: 0,
          // Admin thật ghim top bar + sidebar; để chúng cuộn theo nội dung là sai cảm
          // giác về diện tích vì app được thêm chỗ mà thực tế không có
          position: 'sticky',
          top: 0,
          zIndex: 2,
        }}
      >
        <span style={{fontWeight: 600, color: '#fff'}}>Shopify</span>
        {/* Nhãn harness giữ ở đây để không ai nhầm khung này là UI đề xuất */}
        <span
          style={{
            border: '1px solid #4a4a4a',
            borderRadius: 6,
            padding: '2px 6px',
            fontSize: 11,
            color: '#b5b5b5',
          }}
        >
          mock admin chrome — harness
        </span>
        <div
          style={{
            flex: 1,
            maxWidth: 480,
            margin: '0 auto',
            background: '#303030',
            border: '1px solid #4a4a4a',
            borderRadius: 8,
            padding: '5px 10px',
            // #8a8a8a trên #303030 chỉ đạt ~3.3:1 — Lighthouse bắt lỗi contrast.
            // Khung giả cũng là code của mình, không được để nó làm bẩn điểm a11y.
            color: '#b5b5b5',
          }}
        >
          Search
        </div>
        <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12}}>
          <label style={{display: 'flex', alignItems: 'center', gap: 6, color: '#b5b5b5'}}>
            <input type="checkbox" checked={simulateJob} onChange={onToggleSimulateJob} />
            Simulate running AI job
          </label>
          <span
            style={{
              background: '#303030',
              borderRadius: 8,
              padding: '4px 10px',
              color: '#e3e3e3',
            }}
          >
            stella-test
          </span>
        </div>
      </div>

      {/* ══ SIDEBAR 240px + CONTENT ══
          Grid CSS thuần, không dùng `s-grid`: cần chiều cao `calc(100vh - 56px)` mà
          `minBlockSize` của web components chỉ nhận `px | % | 0` (type `SizeUnits`),
          không nhận calc. Vẫn nằm trong ngoại lệ harness chrome ở đầu file; màu nền
          của hai cột vẫn lấy từ token Polaris qua `s-box background`. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${SIDEBAR_WIDTH}px minmax(0, 1fr)`,
          minHeight: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
        }}
      >
        {/* Sidebar ghim và tự cuộn, như admin thật */}
        <div
          style={{
            position: 'sticky',
            top: TOP_BAR_HEIGHT,
            alignSelf: 'start',
            height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
            overflowY: 'auto',
          }}
        >
          <s-box background="base" padding="small-300" minBlockSize="100%">
          <s-stack direction="block" gap="small-400">
            {SHOPIFY_NAV.map((item) => (
              <ShopifyRow key={item.label} label={item.label} icon={item.icon} />
            ))}

            <SidebarGroupLabel>Sales channels</SidebarGroupLabel>
            {SALES_CHANNELS.map((item) => (
              <ShopifyRow key={item.label} label={item.label} icon={item.icon} />
            ))}

            <SidebarGroupLabel>Apps</SidebarGroupLabel>
            <ShopifyRow label="MakeUGC" icon="apps" />
            <ShopifyRow label="MakeUGC (Dev App)" icon="app-extension" />

            {/* Nav của app — trong app thật là `<ui-nav-menu>` của App Bridge, render
                NGOÀI iframe. Đây là chỗ duy nhất trong sidebar bấm được. */}
            <s-box paddingInlineStart="base">
              <s-stack direction="block" gap="small-500">
                {appNav.map((item) => (
                  <AppNavRow
                    key={item.path}
                    item={item}
                    current={currentPath === item.path}
                    onNavigate={onNavigate}
                  />
                ))}
              </s-stack>
            </s-box>

            <SidebarGroupLabel>Chỉ có trong harness</SidebarGroupLabel>
            <s-box paddingInlineStart="base">
              <s-stack direction="block" gap="small-500">
                {harnessNav.map((item) => (
                  <AppNavRow
                    key={item.path}
                    item={item}
                    current={currentPath === item.path}
                    onNavigate={onNavigate}
                  />
                ))}
              </s-stack>
            </s-box>

            <s-divider />
            <ShopifyRow label="Settings" icon="settings" />
          </s-stack>
          </s-box>
        </div>

        {/* Content: nền subdued giống vùng nội dung của admin thật */}
        <s-box background="subdued">{children}</s-box>
      </div>
    </s-stack>
  );
}

/** Dòng nav của Shopify — cố ý KHÔNG bấm được, nó chỉ là bối cảnh */
function ShopifyRow({label, icon}: {label: string; icon: IconName}) {
  return (
    <s-box padding="small-400">
      <s-stack direction="inline" gap="small-300" alignItems="center">
        <s-icon type={icon} tone="neutral" size="small" />
        <s-text color="subdued">{label}</s-text>
      </s-stack>
    </s-box>
  );
}

function SidebarGroupLabel({children}: {children: ReactNode}) {
  return (
    <s-box paddingBlockStart="small-200" paddingInlineStart="small-400">
      <s-text color="subdued">{children}</s-text>
    </s-box>
  );
}

function AppNavRow({
  item,
  current,
  onNavigate,
}: {
  item: ChromeNavItem;
  current: boolean;
  onNavigate: (path: string) => void;
}) {
  return (
    <s-clickable
      borderRadius="base"
      padding="small-400"
      background={current ? 'subdued' : 'transparent'}
      accessibilityLabel={`Go to ${item.label}`}
      onClick={() => onNavigate(item.path)}
    >
      <s-stack direction="inline" gap="small-300" alignItems="center">
        <s-icon type={item.icon} tone="neutral" size="small" />
        <s-text type={current ? 'strong' : undefined}>{item.label}</s-text>
      </s-stack>
    </s-clickable>
  );
}
