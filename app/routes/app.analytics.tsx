/**
 * MOCKUP — Analytics (vẽ lại 06 Aug 2026 theo screenshot app THẬT)
 *
 * ══ Mô hình thật của trang ═════════════════════════════════════════════════
 * Analytics của app ĐO SỰ KIỆN, không đo tiền:
 *   Item clicks · Product visits · Add to cart · Buy now · Action rate · Cart conversion
 * Không có orders, không có revenue, không có dấu $ nào trên trang.
 *
 * ⚠️ Bản mockup TRƯỚC dựng cả trang quanh "Attributed revenue / Attributed
 * orders" — sai mô hình y như vụ AI Studio text-to-video. Thấy pattern đó ở đâu
 * trong repo thì đó là di sản, không phải sự thật.
 *
 * ══ Chỗ mockup ĐI TRƯỚC app (Stella chốt 06 Aug 2026) ══════════════════════
 * Nhóm **Sales** (Attributed orders + Attributed revenue + 2 cột của bảng +
 * chart doanh thu) là scope THẬT nhưng **app chưa build**. Cố ý vẽ đầy đủ vì
 * listing đã claim nó — dev copy route phải biết backend chưa đỡ được.
 * Ba chỗ đánh dấu: comment này · `doc` của state `scope-pending` · `open[]`.
 *
 * 🛑 Rủi ro launch: `deliverables/app-listing-v1-submission.md:38` đã nộp
 * "Track orders and revenue attributed to each video in your dashboard".
 * Reviewer của Shopify sẽ bấm đúng trang này để kiểm chứng → phần Sales phải
 * xong TRƯỚC lượt review, không phải trước launch.
 *
 * ⚠️ Triple Whale KHÔNG có trên trang này (Stella chốt 06 Aug): app tự xin scope
 * đọc Orders/Revenue của merchant. TW chỉ là một đường phục vụ khách đã dùng TW
 * → thuộc Integrations, không phải nguồn attribution.
 *
 * ⚠️ Không có chart web component (đã đối chiếu 59 tag trong manifest).
 * Đang dùng polaris-viz — thư viện REACT. Cần Duong quyết.
 *
 * Route file thật: app/routes/app.analytics.tsx
 */
import {useState} from 'react';
import {LineChart, FunnelChart} from '@shopify/polaris-viz';

import StateSwitcher from '../components/StateSwitcher';
import type {StateOption} from '../components/StateSwitcher';
import {KpiTile, EmptyState} from '../components/primitives';
import {
  DAY_LABELS,
  PERIOD_GROWTH,
  TOTAL_VIDEOS,
  dailyEventsChartData,
  funnelChartData,
  liveVideos,
  needsAttention,
  recentEvents,
  revenueChartData,
  thumb,
  totalsOf,
  videos,
} from '../data/sample';
import type {Video} from '../data/sample';

const PAGE_SIZE = 20;

/** Tab là VIEW của cùng một tập dữ liệu, KHÔNG phải filter (luật rút từ Library) */
const TABS = ['By video', 'Trends'];

/** Y như app thật — đừng phát minh lại control merchant đã quen */
const RANGES = [
  {value: '7d', label: '7d', days: 7},
  {value: '30d', label: '30d', days: 30},
  {value: '90d', label: '90d', days: 90},
];

const STATES: StateOption[] = [
  {
    value: 'default',
    label: 'Default — có hoạt động và có đơn',
    doc: [
      {
        section: 'Toàn trang',
        rule: 'Mọi con số derive từ `totalsOf(liveVideos)`: tổng một cột của bảng = KPI tile tương ứng = bước funnel = tổng series chart = KPI của Home. Không hardcode thêm bất kỳ tổng nào.',
      },
      {
        section: 'KPI',
        rule: 'Hai nhóm có heading: Sales (2 tile) rồi Shopper actions (6 tile, lưới 3×2 chẵn). 8 tile một mảng là bức tường, và 3 cột thì hàng cuối không mồ côi.',
      },
    ],
  },
  {
    value: 'needs-attention',
    label: 'Needs attention — bộ lọc bật, trang thành danh sách việc',
    doc: [
      {
        section: 'Bảng',
        rule: 'Cột cuối nói VIỆC CẦN LÀM ("Not in any widget"), không phải trạng thái. Xếp theo mức thiệt hại: không nằm trong widget nào thì không ai xem được, tệ hơn chưa tag product.',
      },
      {
        section: 'Filter',
        rule: 'Checkbox có nhãn đầy đủ, không phải chip trần. Nút "Clear filters" chỉ dọn hàng filter — KHÔNG động vào tab.',
      },
    ],
  },
  {
    value: 'no-activity',
    label: 'No activity — 0 sự kiện trong kỳ (state app đang ở)',
    doc: [
      {
        section: 'Chart',
        rule: 'KHÔNG render 4 đường phẳng + bar rỗng như app thật đang làm. Bốn đường zero chồng nhau không đọc ra thông tin nào, chỉ làm trang trông như hỏng.',
      },
      {
        section: 'Empty',
        rule: 'Empty state nói ĐÚNG NGUYÊN NHÂN (có widget nhưng chưa ai tương tác) và mốc thời gian để so, không dạy lại từ đầu.',
      },
    ],
  },
  {
    value: 'no-widget',
    label: 'No widget on storefront — gốc rễ của no-activity',
    doc: [
      {
        section: 'Banner',
        rule: 'Đây là lúc DUY NHẤT "Widget setup" đúng là việc tiếp theo. App thật để nút đó cố định ở mọi state, kể cả khi mọi thứ đang chạy tốt.',
      },
      {
        section: 'Số liệu',
        rule: 'Không có widget thì không thể có sự kiện — đó là SỰ THẬT, không phải thiếu data. Không hiện số 0 nào.',
      },
    ],
  },
  {
    value: 'first-run',
    label: 'First run — chưa có video nào',
    doc: [
      {
        section: 'Empty',
        rule: 'Dạy + CTA sang Library. KHÁC no-activity: ở đó merchant đã có video, ở đây chưa có gì để đo.',
      },
    ],
  },
  {
    value: 'no-sales-yet',
    label: 'No sales yet — có click, có add to cart, chưa có đơn',
    doc: [
      {
        section: 'Sales',
        rule: '"No orders yet" chứ KHÔNG phải "$0" trơ trọi — nhìn $0 mà không có lời giải thích thì merchant tưởng tracking hỏng. Kèm chỗ kiểm tra: product đã tag còn hàng không.',
      },
      {
        section: 'Shopper actions',
        rule: 'Số THẬT, không rỗng — đó chính là ý nghĩa của state này: người xem có tương tác, chỉ chưa ra đơn.',
      },
    ],
  },
  {
    value: 'low-signal',
    label: 'Low signal — quá ít click để tỉ lệ có nghĩa',
    doc: [
      {
        section: 'Action rate · Cart conversion',
        rule: '"Not enough data" thay vì "0.0%". App thật hiện 0.0% khi mới có 2 click — một tỉ lệ tính trên 2 mẫu là số vô nghĩa mà merchant vẫn sẽ mang đi họp.',
      },
    ],
  },
  {
    value: 'overload',
    label: 'Overload — 543 video',
    doc: [
      {
        section: 'Footer',
        rule: 'Luôn hiện "Showing 20 of 543" — merchant phải biết mình đang xem một phần.',
      },
    ],
  },
  {
    value: 'loading',
    label: 'Loading',
    doc: [
      {
        section: 'Footer',
        rule: 'Tổng số KHÔNG render khi chưa biết số. "Showing 20 of 543" hiện trong lúc còn spinner là nói dối.',
      },
      {
        section: 'Chart',
        rule: 'Polaris web components không có skeleton — dùng s-spinner có accessibilityLabel riêng cho từng khối.',
      },
    ],
  },
  {
    value: 'error',
    label: 'Error — không tải được',
    doc: [
      {
        section: 'Toàn trang',
        rule: 'KHÔNG render số cũ hay số 0. Hiện số lúc lỗi là báo sai sự thật.',
      },
    ],
  },
  {
    value: 'no-permission',
    label: 'No permission — staff không được xem analytics',
    doc: [
      {
        section: 'Export',
        rule: 'Disable + lý do là TEXT HIỆN SẴN cạnh control. Tooltip `interestFor` KHÔNG mở trên control disabled (§7a) nên nó không phải chỗ chứa được lý do.',
      },
      {
        section: 'Sales',
        rule: 'Ẩn số tiền nhưng KHÔNG ẩn cả section — staff phải hiểu vì sao mình không thấy, không phải tưởng app thiếu tính năng.',
      },
    ],
  },
  {
    value: 'scope-pending',
    label: 'Scope pending — Shopify chưa duyệt quyền đọc Orders/Revenue',
    doc: [
      {
        section: 'Sales',
        rule: 'Ẩn CẢ nhóm Sales + 2 cột Orders/Revenue của bảng + chart doanh thu. Phễu sự kiện và mọi thứ còn lại chạy nguyên — đó là lý do hai nhóm KPI tách heading riêng.',
      },
      {
        section: 'Funnel',
        rule: 'Bước cuối đổi từ "Orders" sang "Buy now" — không có scope đơn hàng thì đó là tín hiệu mua gần nhất app tự đo được.',
      },
    ],
  },
];

export default function Analytics() {
  const [state, setState] = useState('default');
  const [tab, setTab] = useState(0);
  const [range, setRange] = useState('30d');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('revenue');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [page, setPage] = useState(1);

  const is = (...names: string[]) => names.includes(state);
  const loading = is('loading');
  const error = is('error');
  const firstRun = is('first-run');
  const noWidget = is('no-widget');
  const noActivity = is('no-activity');
  const noSales = is('no-sales-yet');
  const lowSignal = is('low-signal');
  const readOnly = is('no-permission');
  const scopePending = is('scope-pending');

  /** Nhóm Sales chỉ ẩn ở 2 state, và ẩn vì hai lý do khác nhau — nói ra ở cả hai */
  const showSales = !scopePending && !readOnly;
  /** Chưa lên storefront thì không thể có sự kiện: đó là sự thật, không phải thiếu data */
  const hasNumbers = !firstRun && !noWidget && !noActivity && !error;

  /**
   * `low-signal`: đúng cảnh merchant vừa đặt widget xong — một video có vài chục
   * click, còn lại bằng 0. Phải là một tập video RIÊNG chứ không chỉ đổi mấy con
   * số ở KPI: để bảng hiện 3.500 click trong khi KPI nói "not enough data" là
   * trang tự cãi nhau, đúng cái lỗi ba-tổng-doanh-thu vừa sửa.
   */
  const source: Video[] = lowSignal
    ? videos.map((video, i) =>
        i === 1
          ? {...video, views: 380, itemClicks: 24, productVisits: 9, addToCart: 2, buyNow: 0, orders: 0, revenue: 0}
          : {...video, views: 0, itemClicks: 0, productVisits: 0, addToCart: 0, buyNow: 0, orders: 0, revenue: 0},
      )
    : videos;

  /**
   * Bảng liệt kê MỌI video, không chỉ video đã live.
   *
   * Nếu chỉ lấy `liveVideos` thì cảnh báo đáng giá nhất — "Not in any widget" —
   * không bao giờ hiện được, vì đúng những video đó đã bị lọc mất. Trang tự hứa ba
   * lý do trong nhãn checkbox rồi chỉ hiện được một.
   *
   * Video chưa live hiện "—" ở các cột sự kiện chứ KHÔNG phải "0": nó không có
   * thành tích kém, nó chưa từng được ai xem. Vì thế tổng các cột vẫn bằng đúng KPI.
   */
  const totals = totalsOf(source.filter((video) => video.widgets.length > 0));
  const effectiveAttention = is('needs-attention') ? true : attentionOnly;

  const list = source
    .filter((video) => video.title.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((video) => (effectiveAttention ? needsAttention(video) !== null : true))
    .sort((a, b) => {
      // Không đọc được đơn thì không sắp xếp theo cột đang bị ẩn được — rơi về clicks
      const by = showSales ? sort : 'clicks';
      if (by === 'clicks') return b.itemClicks - a.itemClicks;
      if (by === 'orders') return b.orders - a.orders;
      return b.revenue - a.revenue;
    });

  const totalItems = is('overload') ? TOTAL_VIDEOS : list.length;
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // `sort` KHÔNG tính là filter: nút "Clear filters" chỉ được dọn đúng phạm vi của
  // nó. Hiện nút vì merchant đổi cách sắp xếp là cùng loại lỗi với việc bấm
  // "Clear filters" rồi bị nhảy tab.
  const hasRowFilters = query !== '' || effectiveAttention;

  const rangeLabel = RANGES.find((item) => item.value === range)?.days ?? 30;
  /** Tỉ lệ chỉ có nghĩa khi đủ mẫu — dưới ngưỡng thì nói "not enough data" */
  const rate = (numerator: number, denominator: number) =>
    lowSignal || denominator < 100 ? undefined : `${((numerator / denominator) * 100).toFixed(1)}%`;

  const growth = {value: `${(PERIOD_GROWTH * 100).toFixed(1)}%`, direction: 'up' as const, good: true};

  /**
   * Bước cuối của phễu phụ thuộc vào việc có đọc được đơn hay không. Không có đơn
   * (chưa duyệt scope, không đủ quyền, hoặc chưa phát sinh) thì đổi sang Buy now —
   * tín hiệu mua gần nhất app tự đo được — chứ không để phễu cụt một bước không nói gì.
   */
  const funnelData =
    showSales && !noSales
      ? funnelChartData
      : [
          {
            name: 'Shopper journey',
            data: [...funnelChartData[0].data.slice(0, 3), {key: 'Buy now', value: totals.buyNow}],
          },
        ];

  return (
    <s-page heading="Analytics">
      {/* "Widget setup" là primary action cố định của app thật, kể cả khi mọi thứ
          đang chạy tốt. Ở đây nó BIẾN MẤT khi banner no-widget đang hiện nút đó —
          ba chỗ cùng nói "Widget setup" trên một màn hình thì merchant đọc thành ba
          việc khác nhau. */}
      {!noWidget && (
        <s-button slot="secondary-actions" href="/app/widgets">
          Widget setup
        </s-button>
      )}
      {/* KHÔNG đặt `icon` ở đây: nút nằm trong slot action của `s-page` mà có `icon`
          thì Polaris warn "Icon component rendered with no type" lúc hydrate (verify
          06 Aug 2026 — cùng nút đó đặt ngoài slot thì console sạch). Xem
          MAKEUGC-UI-PATTERNS.md §7e. */}
      <s-button
        slot="secondary-actions"
        disabled={readOnly || !hasNumbers}
        // In real app: shopify.toast.show('Export started — we'll email you the file')
        onClick={() => undefined}
      >
        Export CSV
      </s-button>

      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={(value) => {
            setState(value);
            setPage(1);
          }}
          states={STATES}
          globalNote={<GlobalNote />}
        />

        {error ? (
          <s-banner tone="critical" heading="Couldn't load your analytics">
            <s-paragraph>
              Nothing was lost — this is a display problem, not a tracking problem. Your videos kept
              recording activity while this page was down.
            </s-paragraph>
            {/* In real app: revalidator.revalidate() — client-side, không reload cả trang */}
            <s-button slot="secondary-actions" onClick={() => setState('default')}>
              Try again
            </s-button>
          </s-banner>
        ) : noWidget ? (
          <s-banner tone="warning" heading="Your videos aren't on your storefront yet">
            <s-paragraph>
              Nothing can be measured until a widget is live. Add one to your theme and activity
              starts showing up here within a few minutes.
            </s-paragraph>
            <s-button slot="secondary-actions" variant="primary" href="/app/widgets">
              Widget setup
            </s-button>
          </s-banner>
        ) : readOnly ? (
          <s-banner tone="warning" heading="You have limited access">
            {/* §7a: lý do phải là text hiện sẵn — tooltip không mở được trên control disabled */}
            <s-paragraph>
              Order and revenue figures are hidden, and exports are turned off. Only the store owner
              and staff with order access can see them.
            </s-paragraph>
          </s-banner>
        ) : scopePending ? (
          <s-banner tone="info" heading="Order tracking is waiting on approval">
            <s-paragraph>
              Shopify hasn&apos;t approved MakeUGC&apos;s access to your orders yet, so this page
              shows shopper activity only. Orders and revenue per video appear here as soon as
              access is granted — nothing is lost in the meantime.
            </s-paragraph>
          </s-banner>
        ) : null}

        {error ? null : firstRun ? (
          <s-section>
            <EmptyState
              isEmptyState
              heading="No videos to measure yet"
              body="Add a video, tag the products in it, and put it in a widget. Activity shows up here within a few minutes of the first shopper seeing it."
              actionLabel="Open Library"
              actionHref="/app/library"
              resourceName="videos"
            />
          </s-section>
        ) : (
          /* Card này là MỘT control surface: tab + khoảng thời gian + (tab By video:
             filter + bảng + phân trang). Tab Trends KHÔNG nằm trong đây — `s-section`
             lồng `s-section` thì thẻ con MẤT VIỀN, và Trends toàn là thẻ (`KpiTile`
             cũng là một `s-section`). Bài học đã ghi ở `app._index.tsx:519`, tôi vẫn
             dính lại lần này. */
          <s-section padding="none">
            <s-stack direction="block" gap="none">
              {/* ── Tab: VIEW, không phải filter ── */}
              <s-box padding="small-100" background="subdued">
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  {TABS.map((label, index) => (
                    <s-button
                      key={label}
                      variant={tab === index ? 'primary' : 'tertiary'}
                      onClick={() => setTab(index)}
                    >
                      {label}
                      {/* §7h: variant primary/tertiary truyền "đang chọn" CHỈ bằng màu.
                          Text ẩn để screen reader biết mình đang ở tab nào. KHÔNG dùng
                          `accessibilityLabel` — nó THAY nhãn chứ không thêm vào. */}
                      {tab === index && (
                        <s-text accessibilityVisibility="exclusive">, selected</s-text>
                      )}
                    </s-button>
                  ))}
                </s-stack>
              </s-box>

              {/* ── Khoảng thời gian: áp cho CẢ HAI tab ──
                  Segmented 7d/30d/90d y như app. Câu bên phải nói baseline của mọi
                  delta trên trang — app thật để nó trong một đoạn văn ở đầu trang,
                  cách xa chỗ delta xuất hiện. */}
              <s-box padding="small-100">
                <s-stack
                  direction="inline"
                  gap="small-200"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <s-stack direction="inline" gap="small-500" alignItems="center">
                    {RANGES.map((item) => (
                      <s-button
                        key={item.value}
                        variant={range === item.value ? 'primary' : 'tertiary'}
                        onClick={() => setRange(item.value)}
                      >
                        {/* Nhãn "7d" một mình thì screen reader đọc là "bảy dê" — kèm
                            text ẩn nói đủ nghĩa, và §7h nói trạng thái chọn phải có text */}
                        {item.label}
                        <s-text accessibilityVisibility="exclusive">
                          {` Last ${item.days} days${range === item.value ? ', selected' : ''}`}
                        </s-text>
                      </s-button>
                    ))}
                  </s-stack>
                  <s-text color="subdued">
                    Last {rangeLabel} days · compared with the previous {rangeLabel} days
                  </s-text>
                </s-stack>
              </s-box>

              {tab === 0 && (
                <ByVideoTab
                  pageItems={pageItems}
                  totalItems={totalItems}
                  page={page}
                  setPage={setPage}
                  query={query}
                  setQuery={setQuery}
                  sort={sort}
                  setSort={setSort}
                  attentionOnly={effectiveAttention}
                  toggleAttention={() => {
                    setAttentionOnly((on) => !on);
                    setPage(1);
                  }}
                  hasRowFilters={hasRowFilters}
                  clearFilters={() => {
                    // Chỉ dọn search + checkbox. KHÔNG đụng `sort` (không phải filter),
                    // KHÔNG đụng tab, KHÔNG đụng khoảng thời gian.
                    setQuery('');
                    setAttentionOnly(false);
                    setPage(1);
                    if (is('needs-attention')) setState('default');
                  }}
                  loading={loading}
                  hasNumbers={hasNumbers}
                  showSales={showSales}
                  noSales={noSales}
                  noActivity={noActivity}
                />
              )}
            </s-stack>
          </s-section>
        )}

        {/* Trends nằm NGOÀI card control surface — xem comment ở `s-section` trên */}
        {!error && !firstRun && tab === 1 && (
          <TrendsTab
            totals={totals}
            loading={loading}
            hasNumbers={hasNumbers}
            showSales={showSales}
            noSales={noSales}
            noActivity={noActivity}
            lowSignal={lowSignal}
            rate={rate}
            growth={growth}
            rangeDays={rangeLabel}
            funnelData={funnelData}
          />
        )}
      </s-stack>
    </s-page>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 1 — By video
   Khoảng trống lớn nhất của app: nó chỉ có bar chart "Top media" một cột.
   Merchant 543 video không quét được bằng bar chart, và không lọc ra được
   video nào đang hỏng.
   ══════════════════════════════════════════════════════════════════════════ */
function ByVideoTab({
  pageItems,
  totalItems,
  page,
  setPage,
  query,
  setQuery,
  sort,
  setSort,
  attentionOnly,
  toggleAttention,
  hasRowFilters,
  clearFilters,
  loading,
  hasNumbers,
  showSales,
  noSales,
  noActivity,
}: {
  pageItems: Video[];
  totalItems: number;
  page: number;
  setPage: (fn: (p: number) => number) => void;
  query: string;
  setQuery: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  attentionOnly: boolean;
  toggleAttention: () => void;
  hasRowFilters: boolean;
  clearFilters: () => void;
  loading: boolean;
  hasNumbers: boolean;
  showSales: boolean;
  noSales: boolean;
  noActivity: boolean;
}) {
  return (
    <>
      {/* Mỗi control TỰ NÓI mình lọc theo cái gì — không có chip trần nào */}
      <s-box padding="small-100">
        <s-grid gap="base" gridTemplateColumns="minmax(0, 1fr) 200px" alignItems="end">
          <s-search-field
            label="Search videos"
            labelAccessibilityVisibility="exclusive"
            placeholder="Search videos by title"
            value={query}
            onInput={(event) => setQuery(event.currentTarget.value)}
          />
          <s-select
            label="Sort by"
            value={sort}
            onChange={(event) => setSort(event.currentTarget.value)}
          >
            <s-option value="revenue">Highest revenue</s-option>
            <s-option value="orders">Most orders</s-option>
            <s-option value="clicks">Most item clicks</s-option>
          </s-select>
        </s-grid>
      </s-box>

      <s-box padding="small-100">
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-checkbox
            label="Only videos that need attention"
            details="Not in any widget, no products tagged, or getting clicks but no orders"
            checked={attentionOnly}
            onChange={toggleAttention}
          />
          {hasRowFilters && (
            // Chỉ dọn hàng filter này — KHÔNG động vào tab. Bấm "Clear filters" mà
            // nhảy sang tab khác là làm merchant mất chỗ đang đứng.
            <s-button variant="tertiary" onClick={clearFilters}>
              Clear filters
            </s-button>
          )}
        </s-stack>
      </s-box>

      {loading ? (
        <s-box padding="large-200">
          <s-stack direction="block" gap="small-100" alignItems="center">
            <s-spinner size="large" accessibilityLabel="Loading your video performance" />
            <s-text color="subdued">Loading your video performance</s-text>
          </s-stack>
        </s-box>
      ) : !hasNumbers ? (
        <s-box padding="base">
          <EmptyState
            isEmptyState
            heading={noActivity ? 'No activity in this period' : 'Nothing measured yet'}
            body={
              noActivity
                ? 'Your widget is live but no shopper has opened a video in the last 30 days. Check that the widget sits somewhere shoppers actually reach — a carousel below the fold gets very few opens.'
                : 'Put a video in a widget and add that widget to your theme. Activity starts showing up here within a few minutes.'
            }
            // Không lặp CTA: state no-widget đã có nút "Widget setup" trên banner
            actionLabel={noActivity ? 'Check where your widget appears' : undefined}
            actionHref={noActivity ? '/app/widgets' : undefined}
            resourceName="videos"
          />
        </s-box>
      ) : pageItems.length === 0 ? (
        <s-box padding="base">
          {/* Dual pattern: có data nhưng filter không ra ≠ chưa có data. KHÔNG dạy lại
              từ đầu và KHÔNG hiện CTA tạo mới — merchant có 543 video mà thấy "chưa
              có video nào" sẽ tưởng mất data. */}
          <EmptyState
            isEmptyState={false}
            heading="No videos found"
            body="Try changing the search term or the filter."
            resourceName="videos"
          />
          <s-stack direction="block" gap="small-200" alignItems="center">
            {/* Nhãn nói rõ phạm vi: nút này dọn HẾT search + filter, khác nút
                "Clear filters" ở trên chỉ dọn hàng đó */}
            <s-button onClick={clearFilters}>Reset search and filters</s-button>
          </s-stack>
        </s-box>
      ) : (
        <s-table variant="auto">
          <s-table-header-row>
            <s-table-header listSlot="primary">Video</s-table-header>
            <s-table-header format="numeric">Item clicks</s-table-header>
            <s-table-header format="numeric">Product visits</s-table-header>
            <s-table-header format="numeric">Add to cart</s-table-header>
            {showSales && <s-table-header format="numeric">Orders</s-table-header>}
            {showSales && (
              <s-table-header format="currency" listSlot="secondary">
                Revenue
              </s-table-header>
            )}
            <s-table-header listSlot="kicker">Needs attention</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {pageItems.map((video) => {
              const attention = needsAttention(video);
              // Video chưa nằm trong widget nào thì KHÔNG THỂ có sự kiện — hiện "—"
              // chứ không phải "0". "0" đọc ra là "đã chạy và thất bại"; sự thật là
              // nó chưa từng được ai nhìn thấy, và badge bên cạnh nói đúng lý do.
              const live = video.widgets.length > 0;
              const num = (value: number) => (live ? value.toLocaleString() : '—');
              return (
                <s-table-row key={video.id}>
                  <s-table-cell>
                    {/* `s-grid` chứ KHÔNG phải stack: `s-paragraph` là block nên trong
                        stack nó chiếm hết chiều ngang và bị đẩy xuống dưới thumbnail.
                        `minmax(0, 1fr)` mới cho cột co lại để `lineClamp` cắt được. */}
                    <s-grid gap="small-100" gridTemplateColumns="auto minmax(0, 1fr)" alignItems="center">
                      <s-thumbnail src={thumb(video.id, 80)} alt={video.title} size="small" />
                      <s-paragraph lineClamp={1}>
                        <s-link href={`/app/library/${video.id}`}>
                          <s-text type="strong">{video.title}</s-text>
                        </s-link>
                      </s-paragraph>
                    </s-grid>
                  </s-table-cell>
                  <s-table-cell>{num(video.itemClicks)}</s-table-cell>
                  <s-table-cell>{num(video.productVisits)}</s-table-cell>
                  <s-table-cell>{num(video.addToCart)}</s-table-cell>
                  {showSales && (
                    <s-table-cell>{noSales ? '—' : num(video.orders)}</s-table-cell>
                  )}
                  {showSales && (
                    <s-table-cell>
                      {noSales || !live ? '—' : `$${video.revenue.toLocaleString()}`}
                    </s-table-cell>
                  )}
                  <s-table-cell>
                    {attention ? (
                      <s-badge tone="warning">{attention}</s-badge>
                    ) : (
                      <s-text color="subdued">—</s-text>
                    )}
                  </s-table-cell>
                </s-table-row>
              );
            })}
          </s-table-body>
        </s-table>
      )}

      {/* Ẩn khi đang load (chưa biết số mà đã nói là nói bừa) và khi không có kết quả
          ("Showing 0 of 0 videos" là câu vô nghĩa) */}
      {!loading && hasNumbers && pageItems.length > 0 && (
        <s-box padding="small-100" background="subdued">
          <s-stack direction="inline" gap="small-200" alignItems="center" justifyContent="space-between">
            <s-text color="subdued">
              Showing {pageItems.length} of {totalItems} videos
            </s-text>
            <s-stack direction="inline" gap="small-500" alignItems="center">
              <s-button
                variant="tertiary"
                icon="chevron-left"
                accessibilityLabel="Previous page"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              />
              <s-button
                variant="tertiary"
                icon="chevron-right"
                accessibilityLabel="Next page"
                disabled={page * PAGE_SIZE >= totalItems}
                onClick={() => setPage((p) => p + 1)}
              />
            </s-stack>
          </s-stack>
        </s-box>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TAB 2 — Trends
   ══════════════════════════════════════════════════════════════════════════ */
function TrendsTab({
  totals,
  loading,
  hasNumbers,
  showSales,
  noSales,
  noActivity,
  lowSignal,
  rate,
  growth,
  rangeDays,
  funnelData,
}: {
  totals: ReturnType<typeof totalsOf>;
  loading: boolean;
  hasNumbers: boolean;
  showSales: boolean;
  noSales: boolean;
  noActivity: boolean;
  lowSignal: boolean;
  rate: (numerator: number, denominator: number) => string | undefined;
  growth: {value: string; direction: 'up'; good: boolean};
  rangeDays: number;
  funnelData: typeof funnelChartData;
}) {
  if (!hasNumbers) {
    return (
      <s-section>
        <EmptyState
          isEmptyState
          heading={noActivity ? 'No activity in this period' : 'Nothing measured yet'}
          body={
            noActivity
              ? `No shopper opened a video in the last ${rangeDays} days, so there are no trends to draw. Charts return as soon as the first item click comes in.`
              : 'Put a video in a widget and add that widget to your theme, then come back.'
          }
          // Không lặp CTA: state no-widget đã có nút "Widget setup" trên banner
          actionLabel={noActivity ? 'Check where your widget appears' : undefined}
          actionHref={noActivity ? '/app/widgets' : undefined}
          resourceName="videos"
        />
      </s-section>
    );
  }

  const actionRate = rate(totals.itemClicks, totals.views);
  /**
   * Cart conversion = orders ÷ add to cart, nên nó CHỈ tồn tại khi được phép đọc
   * đơn. Để nó hiện "13.9%" trong lúc ẩn cột Orders là rò rỉ: nhân ngược lại với
   * add to cart là ra đúng số đơn vừa giấu đi.
   */
  const cartConversion = showSales && !noSales ? rate(totals.orders, totals.addToCart) : undefined;

  return (
      <s-stack direction="block" gap="base">
        {/* ══ SALES — mockup ĐI TRƯỚC app, xem comment đầu file ══ */}
        {showSales && (
          <s-stack direction="block" gap="small">
            <s-heading>Sales</s-heading>
            <s-grid gap="base" gridTemplateColumns="repeat(2, minmax(0, 1fr))">
              <KpiTile
                id="an-orders"
                label="Attributed orders"
                help="Orders placed by a shopper who opened one of your videos first, within the attribution window."
                value={totals.orders.toLocaleString()}
                trend={noSales ? undefined : {value: '12.4%', direction: 'up', good: true}}
                emptyLabel={noSales ? 'No orders yet' : undefined}
                loading={loading}
              />
              <KpiTile
                id="an-revenue"
                label="Attributed revenue"
                help="Revenue from those orders, in your store's currency. Matches the Attributed revenue figure on Home."
                value={`$${totals.revenue.toLocaleString()}`}
                trend={noSales ? undefined : growth}
                emptyLabel={noSales ? 'No sales yet' : undefined}
                loading={loading}
              />
            </s-grid>

            {/* "no-sales-yet" ≠ empty. Có tương tác, chưa có đơn — merchant cần biết
                mình KHÔNG làm sai gì và chỗ để kiểm tra. */}
            {noSales ? (
              <s-section>
                <s-stack direction="block" gap="small-200" alignItems="start">
                  <s-text type="strong">No attributed orders yet</s-text>
                  <s-paragraph color="subdued">
                    Shoppers are opening your videos and adding to cart, so tracking is working.
                    Check that the products tagged in your top videos are in stock and priced the
                    way you expect.
                  </s-paragraph>
                  <s-button href="/app/library">Review tagged products</s-button>
                </s-stack>
              </s-section>
            ) : (
              <s-section heading="Attributed revenue over time">
                {loading ? (
                  <s-box padding="large-300">
                    <s-stack direction="block" gap="small-100" alignItems="center">
                      <s-spinner size="large" accessibilityLabel="Loading revenue chart" />
                    </s-stack>
                  </s-box>
                ) : (
                  // polaris-viz cần chiều cao tường minh — một trong 3 ngoại lệ CSS
                  <div style={{height: 280}}>
                    <LineChart data={revenueChartData} theme="Light" />
                  </div>
                )}
              </s-section>
            )}
          </s-stack>
        )}

        {/* ══ SHOPPER ACTIONS — phần app THẬT đang đo ══ */}
        <s-stack direction="block" gap="small">
          <s-heading>Shopper actions</s-heading>
          {/* 3×2 chẵn — 6 tile chia 3 cột thì hàng cuối không mồ côi ở mọi độ rộng.
              `auto-fit` đổi số cột theo viewport nên lỗi mồ côi quay lại ở màn khác. */}
          <s-grid gap="base" gridTemplateColumns="repeat(3, minmax(0, 1fr))">
            <KpiTile
              id="an-clicks"
              label="Item clicks"
              help="Times a shopper opened or interacted with a video. Widget loads don't count — only real interactions."
              value={totals.itemClicks.toLocaleString()}
              trend={{value: '9.7%', direction: 'up', good: true}}
              loading={loading}
            />
            <KpiTile
              id="an-visits"
              label="Product visits"
              help="Times a shopper opened a tagged product from inside a video."
              value={totals.productVisits.toLocaleString()}
              trend={{value: '7.1%', direction: 'up', good: true}}
              loading={loading}
            />
            <KpiTile
              id="an-cart"
              label="Add to cart"
              help="Items added to cart from inside a video, or from a product page opened through one."
              value={totals.addToCart.toLocaleString()}
              trend={{value: '5.4%', direction: 'up', good: true}}
              loading={loading}
            />
            <KpiTile
              id="an-buynow"
              label="Buy now"
              help="Shoppers who used the Buy now button inside a video, skipping the cart. A shortcut, not a step in the journey below."
              value={totals.buyNow.toLocaleString()}
              trend={{value: '3.2%', direction: 'up', good: true}}
              loading={loading}
            />
            <KpiTile
              id="an-action-rate"
              label="Action rate"
              // Mẫu số phải nói ra — không có nó thì tỉ lệ này không kiểm chứng được
              help="Item clicks ÷ widget loads. Out of every 100 times a widget loaded, this many shoppers opened a video."
              value={actionRate ?? '—'}
              emptyLabel={actionRate ? undefined : 'Not enough data'}
              loading={loading}
            />
            <KpiTile
              id="an-cart-conversion"
              label="Cart conversion"
              help="Orders ÷ add to cart. How often a cart that started in a video turned into an order."
              value={cartConversion ?? '—'}
              // Ba lý do khác nhau, ba câu khác nhau — gộp chung là dẫn merchant đi sai chỗ
              emptyLabel={
                cartConversion
                  ? undefined
                  : noSales
                    ? 'No orders yet'
                    : lowSignal
                      ? 'Not enough data'
                      : 'Needs order access'
              }
              loading={loading}
            />
          </s-grid>
        </s-stack>

        {/* ══ PHỄU — thay "Event mix" của app ══
            "Event mix" là bar chart hiện đúng 4 con số đã có ở KPI row: nói một
            thông tin hai lần. Phễu thêm được thứ tile không nói được — rớt ở bước nào. */}
        <s-section heading="Shopper journey">
          <s-stack direction="block" gap="small">
            <s-paragraph color="subdued">
              Where shoppers drop off. The biggest gap is usually item click → product visit, which
              is a tagging problem: a video with nothing tagged has nowhere to send anyone.
            </s-paragraph>
            {loading ? (
              <s-box padding="large-300">
                <s-stack direction="block" gap="small-100" alignItems="center">
                  <s-spinner size="large" accessibilityLabel="Loading shopper journey" />
                </s-stack>
              </s-box>
            ) : (
              <div style={{height: 300}}>
                <FunnelChart data={funnelData} theme="Light" />
              </div>
            )}
          </s-stack>
        </s-section>

        {/* ══ DAILY EVENTS ══ */}
        <s-section heading="Daily events">
          {loading ? (
            <s-box padding="large-300">
              <s-stack direction="block" gap="small-100" alignItems="center">
                <s-spinner size="large" accessibilityLabel="Loading daily events" />
              </s-stack>
            </s-box>
          ) : (
            <div style={{height: 280}}>
              <LineChart data={dailyEventsChartData} theme="Light" />
            </div>
          )}
        </s-section>

        {/* ══ RECENT ACTIVITY ══
            App thật hiện `Item click #15946140254577` — một chuỗi số merchant không
            làm gì được, và hai dòng cùng ID đọc ra như lỗi lặp. Ở đây mỗi dòng nói
            tên video, id chỉ còn là link. */}
        <s-section heading="Recent activity">
          <s-stack direction="block" gap="small">
            <s-paragraph color="subdued">
              The last {recentEvents.length} events, newest first. Useful right after you place a
              widget — it tells you tracking is alive before the daily numbers move.
            </s-paragraph>
            <s-table variant="auto" loading={loading}>
              <s-table-header-row>
                <s-table-header listSlot="primary">Video</s-table-header>
                <s-table-header listSlot="kicker">Event</s-table-header>
                <s-table-header listSlot="secondary">When</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {recentEvents.map((event) => {
                  const video = videos.find((item) => item.id === event.videoId);
                  return (
                    <s-table-row key={event.id}>
                      <s-table-cell>
                        <s-paragraph lineClamp={1}>
                          <s-link href={`/app/library/${event.videoId}`}>
                            <s-text type="strong">{video?.title ?? event.videoId}</s-text>
                          </s-link>
                        </s-paragraph>
                      </s-table-cell>
                      <s-table-cell>{event.type}</s-table-cell>
                      <s-table-cell>{event.ago}</s-table-cell>
                    </s-table-row>
                  );
                })}
              </s-table-body>
            </s-table>
          </s-stack>
        </s-section>
      </s-stack>
  );
}

/**
 * Ràng buộc áp cho MỌI state — StateSwitcher hiện nó dưới phần rule.
 * Đây là chỗ chứa meta-note; bản trước nhét một banner tiếng Việt vào chính UI
 * của merchant, vừa sai ngôn ngữ vừa sai đối tượng đọc.
 */
function GlobalNote() {
  return (
    <s-stack direction="block" gap="small-300">
      <s-text type="strong">⚠️ Chỗ mockup ĐI TRƯỚC app</s-text>
      <s-unordered-list>
        <s-list-item>
          <s-text color="subdued">
            Nhóm <s-text type="strong">Sales</s-text> (2 KPI + 2 cột bảng + chart doanh thu) là
            scope THẬT nhưng app chưa build. Analytics thật hiện chỉ đo sự kiện: item clicks ·
            product visits · add to cart · buy now · action rate · cart conversion.
          </s-text>
        </s-list-item>
        <s-list-item>
          <s-text color="subdued">
            🛑 Listing đã nộp claim &quot;orders and revenue attributed to each video in your
            dashboard&quot; → phần Sales phải xong <s-text type="strong">trước lượt review</s-text>,
            không phải trước launch. Reviewer sẽ bấm đúng trang này để kiểm chứng.
          </s-text>
        </s-list-item>
        <s-list-item>
          <s-text color="subdued">
            Triple Whale KHÔNG có trên trang này: app tự xin scope đọc Orders/Revenue. TW chỉ phục
            vụ khách đã dùng TW → thuộc Integrations.
          </s-text>
        </s-list-item>
        <s-list-item>
          <s-text color="subdued">
            Định nghĩa <s-text type="strong">Action rate</s-text> (item clicks ÷ widget loads) và{' '}
            <s-text type="strong">Cart conversion</s-text> (orders ÷ add to cart) là ĐỀ XUẤT — app
            thật không định nghĩa hai tỉ lệ này ở đâu cả. Cần Duong xác nhận trước khi build.
          </s-text>
        </s-list-item>
      </s-unordered-list>
    </s-stack>
  );
}
