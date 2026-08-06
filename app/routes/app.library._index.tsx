/**
 * MOCKUP — Library (viết lại 06 Aug 2026 theo app THẬT)
 *
 * ═══ LIBRARY LÀM GÌ ═══
 * Là đích đến của Generate (bấm ở AI Studio → nhảy sang đây), và là chỗ merchant
 * quyết định video nào lên storefront, video nào tag product.
 *
 * ═══ APP THẬT ĐANG THIẾU GÌ ═══
 * Một card "Media library" + 9 chip filter + grid thẻ. Không search, không sort,
 * không bulk, không phân trang, không số liệu. Chín chip trộn 4 TRỤC khác nhau vào
 * một hàng single-select (loại · nguồn · placement · trạng thái) nên không hỏi được
 * câu hữu ích nhất: "video AI nào chưa được đặt vào widget".
 *
 * ═══ MÔ HÌNH (verify 06 Aug 2026 từ 3 modal của app) ═══
 * - Placement: **gán tay**, MỘT video vào NHIỀU widget ("Choose widget", checkbox)
 * - Product: app đang **1:1** — mockup CỐ Ý vẽ 1:n, xem `Video.products` trong
 *   sample.ts. Dev copy route phải biết backend chưa đỡ được.
 * - `Save to Product Media` ≠ `Tag products`: cái đầu đẩy file vào media gallery của
 *   product trong Shopify Admin, cái sau chỉ liên kết để player biết bán gì.
 *
 * Route file thật: app/routes/app.library._index.tsx
 */
import {useMemo, useState} from 'react';

import JobProgress from '../components/JobProgress';
import StateSwitcher from '../components/StateSwitcher';
import type {StateOption} from '../components/StateSwitcher';
import {EmptyState, SelectAllBar} from '../components/primitives';
import {PLANS, TOTAL_VIDEOS, templateFor, thumb, videos, widgetList} from '../data/sample';
import type {Video} from '../data/sample';

const PAGE_SIZE = 20;

/**
 * Trục trạng thái.
 *
 * KHÔNG có "Published/Draft" tách riêng khỏi "Not placed": trong app, publish CHÍNH
 * LÀ gán vào widget, nên hai cái đó là **một trạng thái**. Bộ filter của app cũng
 * chỉ có `Not placed` / `In widgets`, không có Published/Draft.
 */
const TABS = ['All', 'Live on storefront', 'Not placed', 'Processing', 'Failed'] as const;

/** Nguồn — dropdown một lựa chọn, có NHÃN. Chip không nhãn thì không tự giải thích. */
const SOURCES: Video['source'][] = ['AI Studio', 'Upload', 'TikTok', 'Instagram'];

const STATES: StateOption[] = [
  {
    value: 'default',
    label: 'Default — 24 video, đầy hơn 1 trang',
    doc: [
      {section: 'Filter', rule: 'Mỗi control TỰ NÓI mình lọc theo gì: tab trạng thái · dropdown "Sort by" · dropdown "Source" · checkbox "Only videos with no products tagged". App thật là 9 chip trần không nhãn, trộn 4 trục, single-select — nhìn không ra là filter và không kết hợp được điều kiện.'},
      {section: 'Grid', rule: '`auto-fill minmax(200px, 1fr)` — LẤP ĐẦY chiều ngang. App thật để thẻ rộng cố định nên 2 item bỏ trống ~85% card.'},
      {section: 'Thẻ', rule: 'Chỉ hiện DOANH THU, không hiện view/đơn. Thẻ đã mang badge trạng thái + cảnh báo; ba số thì không đọc được số nào. Cần đủ số thì bật table view.'},
    ],
  },
  {
    value: 'overload',
    label: 'Overload — 543 video (khách enterprise)',
    doc: [
      {section: 'Cả trang', rule: 'Giả định thiết kế là merchant có 543 video, không phải 2. Search + 3 trục filter + sort + phân trang đều BẮT BUỘC ở quy mô này.'},
      {section: 'Footer', rule: 'Luôn hiện "Showing 20 of 543" — merchant phải biết mình đang xem một phần.'},
      {section: 'Bulk', rule: 'SelectAllBar phân biệt rõ "20 trên trang này" vs "tất cả 543". Gộp chung là merchant xoá nhầm cả kho.'},
    ],
  },
  {
    value: 'generating',
    label: 'Generating — vừa bấm Generate ở AI Studio',
    doc: [
      {section: 'Action zone', rule: 'MỘT banner tone="info", KHÔNG phải hai. App thật hiện banner success "Queued for generation" + banner info "Generating…" — cùng một message, và success là tone của việc ĐÃ XONG.'},
      {section: 'Action zone', rule: 'Refresh nằm TRONG banner job, không phải nút thường trú ở header. Có ETA + Cancel (enterprise §1).'},
      {section: 'Thẻ', rule: 'Item đang chạy có overlay "Generating" và KHÔNG chọn được — chọn để bulk một thứ chưa tồn tại là vô nghĩa.'},
    ],
  },
  {
    value: 'partial-fail',
    label: 'Partial fail — 2 video generate lỗi',
    doc: [
      {section: 'Action zone', rule: 'Nói rõ SỐ credit đã hoàn. Enterprise sẽ đối chiếu hoá đơn.'},
      {section: 'Thẻ', rule: 'Item lỗi có badge critical + hành động Retry ngay trên thẻ, không bắt merchant đi tìm.'},
    ],
  },
  {
    value: 'untagged-warning',
    label: 'Untagged — video live chưa tag product',
    doc: [
      {section: 'Action zone', rule: 'Banner warning + nút bật thẳng bộ lọc "no products tagged". Đây là lỗi im lặng tệ nhất của app: video có view nhưng shopper không mua được gì.'},
      {section: 'Thẻ', rule: 'Badge warning trên thẻ, không phải chờ merchant tự mở từng cái ra xem.'},
    ],
  },
  {
    value: 'unplaced-warning',
    label: 'Not placed — video chưa nằm trong widget nào',
    doc: [
      {section: 'Action zone', rule: 'Cùng hạng với untagged: video không nằm trong widget nào thì shopper KHÔNG THẤY nó ở đâu cả. App thật chỉ để "Not placed" làm một chip trung tính, không nhắc gì.'},
      {section: 'Bulk', rule: '"Add to widget" là bulk action đáng giá nhất trang — gán tay từng video vào widget với 543 video là không xong.'},
      {section: 'Trạng thái', rule: 'KHÔNG có Published/Draft tách riêng khỏi Not placed: trong app publish CHÍNH LÀ gán vào widget nên hai cái là MỘT trạng thái. Tách hai là bịa ra trạng thái không tồn tại.'},
    ],
  },
  {
    value: 'bulk-selected',
    label: 'Bulk selected — 8 video',
    doc: [
      {section: 'Bulk', rule: 'Destructive để tone critical và confirm phải nói SỐ LƯỢNG cụ thể ("Delete 8 videos?"), không phải "Delete selected?".'},
      {section: 'Bulk', rule: 'Xoá video đang nằm trong widget thì widget đó mất item — confirm phải nói ra. ⏳ Hành vi thật cần Duong xác nhận.'},
      {section: 'Bulk', rule: 'Tag products = áp CÙNG product cho mọi video đã chọn → modal đếm ra bao nhiêu video sẽ bị GHI ĐÈ product đang có. Không nói thì merchant xoá sạch product của 20 video mà không biết.'},
    ],
  },
  {
    value: 'no-results',
    label: 'No search result — có data, filter không ra',
    doc: [
      {section: 'Empty', rule: 'KHÁC empty state. Không dạy lại "import video đầu tiên" và không hiện CTA tạo mới — chỉ gợi ý sửa filter, kèm nút "Reset search and filters" dọn HẾT (tab + search + filter) — khác nút "Clear filters" ở hàng filter, cái đó chỉ dọn đúng hàng đó và giữ nguyên tab. Merchant có 543 video mà thấy "chưa có video nào" sẽ tưởng mất data.'},
    ],
  },
  {
    value: 'empty',
    label: 'Empty — chưa có video nào',
    doc: [
      {section: 'Empty', rule: 'Dạy + CTA. Hai đường vào: Upload file và Import từ TikTok/Instagram.'},
      {section: 'Filter', rule: 'Ẩn toàn bộ thanh filter — lọc trong cái rỗng là vô nghĩa.'},
    ],
  },
  {
    value: 'loading',
    label: 'Loading — s-spinner (KHÔNG có skeleton)',
    doc: [
      {section: 'Grid', rule: 'Polaris web components KHÔNG có skeleton. Table view dùng attr `loading` của s-table; grid dùng s-spinner có accessibilityLabel.'},
    ],
  },
  {
    value: 'video-limit-reached',
    label: 'Limit reached — Free Forever, 5/5 video',
    doc: [
      {
        section: 'Mô hình',
        rule: 'Pricing thật (Notion → Tactic 2): CHỈ Free Forever bị gate — 1 widget + 5 shoppable video. Starter/Growth/Scale unlimited. Không có tier nào ở giữa.',
      },
      {
        section: 'Banner',
        rule: 'Nói CON SỐ (5/5) + việc merchant làm được NGAY mà không tốn tiền (xoá bớt video) trước khi nói upgrade. Chỉ nói upgrade là ép, không phải giúp.',
      },
      {
        section: 'Nút Add videos',
        rule: 'Disabled kèm lý do bằng TEXT HIỆN SẴN cạnh nút — tooltip không mở trên control disabled (§7a).',
      },
    ],
  },
  {
    value: 'no-permission',
    label: 'No permission — staff chỉ xem được',
    doc: [
      {section: 'Cả trang', rule: 'Vẫn xem được video và số liệu. Chỉ chặn sửa đổi: checkbox chọn, bulk, và menu từng thẻ bị disable + lý do bằng TEXT (tooltip không mở trên control disabled).'},
    ],
  },
];

export default function Library() {
  const [state, setState] = useState('default');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(0);
  const [source, setSource] = useState('all');
  const [untaggedOnly, setUntaggedOnly] = useState(false);
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const is = (...names: string[]) => names.includes(state);
  const loading = is('loading');
  const readOnly = is('no-permission');
  const isEmptyState = is('empty');

  /** Trạng thái job được gắn vào data theo kịch bản, không hardcode vào JSX */
  const list: Video[] = useMemo(() => {
    if (is('empty')) return [];
    if (is('generating')) {
      return videos.map((video, i) =>
        i < 3 ? {...video, status: 'processing' as const} : video,
      );
    }
    if (is('partial-fail')) {
      return videos.map((video, i) => (i < 2 ? {...video, status: 'failed' as const} : video));
    }
    // Free Forever cho ĐÚNG 5 shoppable video → 5 là đã đụng trần
    if (is('video-limit-reached')) return videos.slice(0, 5);
    return videos;
  }, [state]);

  /**
   * Gate theo plan — pricing thật ở Notion (Tactic 2): **CHỈ Free Forever** giới hạn
   * 5 shoppable video. Starter/Growth/Scale unlimited, không có tier nào ở giữa.
   */
  const plan = PLANS.find((entry) => entry.id === (is('video-limit-reached') ? 'free' : 'scale'))!;
  const videoLimit = plan.videoLimit;
  const usedVideos = videoLimit === null ? list.length : Math.min(list.length, videoLimit);
  const atVideoLimit = videoLimit !== null && usedVideos >= videoLimit;

  const effectiveQuery = is('no-results') ? 'zzzz' : query;
  const effectiveUntagged = is('untagged-warning') ? true : untaggedOnly;
  // "Not placed" giờ là một TAB, không còn là chip riêng
  const effectiveTab = is('unplaced-warning') ? 2 : tab;

  const filtered = useMemo(() => {
    const matchStatus = (video: Video) =>
      effectiveTab === 0 ||
      (effectiveTab === 1 && video.widgets.length > 0 && video.status === 'ready') ||
      (effectiveTab === 2 && video.widgets.length === 0 && video.status === 'ready') ||
      (effectiveTab === 3 && video.status === 'processing') ||
      (effectiveTab === 4 && video.status === 'failed');

    const result = list.filter(
      (video) =>
        video.title.toLowerCase().includes(effectiveQuery.toLowerCase()) &&
        matchStatus(video) &&
        (source === 'all' || video.source === source) &&
        (!effectiveUntagged || video.products.length === 0),
    );

    return [...result].sort((a, b) => {
      if (sort === 'revenue') return b.revenue - a.revenue;
      if (sort === 'views') return b.views - a.views;
      return 0; // newest = giữ thứ tự gốc
    });
  }, [list, effectiveQuery, effectiveTab, source, effectiveUntagged, sort]);

  /**
   * Filter của HÀNG filter — chỉ Source + checkbox. Tab KHÔNG tính.
   *
   * Tab là **view** (merchant đang đứng ở đâu), filter là điều kiện lọc bên trong
   * view đó. Bấm "Clear filters" ở tab "Not placed" mà nhảy về "All" là làm mất chỗ
   * merchant đang đứng — Shopify cũng tách hai khái niệm này.
   */
  const hasRowFilters = source !== 'all' || effectiveUntagged;
  /** Có BẤT KỲ điều kiện nào đang thu hẹp kết quả — dùng cho dual empty state */
  const hasAnyFilter = effectiveQuery !== '' || effectiveTab !== 0 || hasRowFilters;
  const totalItems = is('overload') ? TOTAL_VIDEOS : filtered.length;
  const pageItems = filtered.slice(0, PAGE_SIZE);

  const untaggedLive = list.filter((v) => v.widgets.length > 0 && v.products.length === 0).length;
  const unplacedLive = list.filter((v) => v.widgets.length === 0).length;

  const selection = is('bulk-selected') ? list.slice(0, 8).map((v) => v.id) : selected;
  /** Product chọn trong modal bulk tag — in real app: shopify.resourcePicker */
  const [bulkProducts, setBulkProducts] = useState<string[]>([]);
  /** Bao nhiêu video đang chọn ĐÃ có product — bulk tag sẽ ghi đè lên chúng */
  const willOverwrite = list.filter(
    (v) => selection.includes(v.id) && v.products.length > 0,
  ).length;
  const toggleRow = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /** Nút trong hàng filter — chỉ dọn đúng hàng đó, giữ nguyên tab và search */
  const clearFilters = () => {
    setSource('all');
    setUntaggedOnly(false);
    if (is('untagged-warning')) setState('default');
  };

  /**
   * Nút trong empty state của "không tìm thấy gì" — dọn HẾT, kể cả tab và search.
   * Ở đó merchant cần thoát khỏi bế tắc, nên nhãn phải nói rõ nó làm nhiều hơn.
   */
  const resetAll = () => {
    setQuery('');
    setTab(0);
    setSource('all');
    setUntaggedOnly(false);
    if (is('no-results', 'untagged-warning', 'unplaced-warning')) setState('default');
  };

  return (
    <s-page heading="Library" inlineSize="large">
      {/* Một primary duy nhất. App thật có 4 nút ở header (Upload · Import · Refresh ·
          AI Studio) + pill Credits: credit thuộc AI Studio, AI Studio đã có ở sidebar,
          còn Refresh chuyển vào banner job — nó chỉ có nghĩa khi đang có job. */}
      {!isEmptyState && (
        <s-button
          slot="primary-action"
          variant="primary"
          disabled={readOnly || atVideoLimit}
          command="--show"
          commandFor="add-videos"
        >
          Add videos
        </s-button>
      )}

      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={setState}
          states={STATES}
          globalNote={<LibraryPageNotes />}
        />

        {/* ══ ACTION ZONE — chỉ MỘT thứ, theo thứ tự thiệt hại ══ */}
        {is('generating') ? (
          <JobProgress
            status="processing"
            title="Generating 3 videos"
            done={1}
            total={3}
            etaLabel="~3 min left"
            onCancel={() => {}}
          />
        ) : is('partial-fail') ? (
          <JobProgress
            status="done"
            title="Generating 5 videos"
            done={3}
            total={5}
            failedCount={2}
            creditNote="2 credits refunded"
            onRetry={() => {}}
          />
        ) : atVideoLimit ? (
          /* Gate video của Free Forever. Nói CON SỐ trước, rồi việc merchant làm được
             NGAY mà không tốn tiền (xoá bớt), rồi mới tới upgrade — chỉ nói upgrade là
             ép chứ không phải giúp. */
          <s-banner
            tone="warning"
            heading={`You're using all ${videoLimit} shoppable videos on ${plan.name}`}
          >
            <s-paragraph>
              Delete a video you&apos;re not using to make room, or upgrade for unlimited videos
              and widgets. Your existing videos keep working either way.
            </s-paragraph>
            <s-button slot="secondary-actions" href="/app/billing">
              Compare plans
            </s-button>
          </s-banner>
        ) : readOnly ? (
          <s-banner tone="info" heading="You have view-only access">
            <s-paragraph>
              You can see videos and their performance. Adding, editing, and deleting need staff
              access to this app.
            </s-paragraph>
          </s-banner>
        ) : untaggedLive > 0 && is('untagged-warning') ? (
          <s-banner tone="warning" heading={`${untaggedLive} live videos have no products tagged`}>
            <s-paragraph>
              Shoppers can watch these but can&apos;t buy anything from them. Tagging a product is
              what turns a view into an order.
            </s-paragraph>
            <s-button slot="secondary-actions" onClick={() => setUntaggedOnly(true)}>
              Show them
            </s-button>
          </s-banner>
        ) : unplacedLive > 0 && is('unplaced-warning') ? (
          <s-banner tone="warning" heading={`${unplacedLive} published videos aren't in any widget`}>
            {/* Cùng hạng với untagged: video không nằm trong widget nào thì shopper
                không thấy nó ở đâu cả. App thật chỉ để đây là một chip trung tính. */}
            <s-paragraph>
              Publishing a video doesn&apos;t put it on your storefront — it has to be in a widget.
              Select them and add them to one.
            </s-paragraph>
            <s-button slot="secondary-actions" onClick={() => setTab(2)}>
              Show them
            </s-button>
          </s-banner>
        ) : null}

        {isEmptyState ? (
          <s-section>
            <EmptyState
              isEmptyState
              heading="Add your first video"
              body="Upload a file, or import videos you already posted on TikTok and Instagram. Then tag products so shoppers can buy while they watch."
              actionLabel="Upload a file"
              actionHref="#"
              secondaryLabel="Import from TikTok or Instagram"
              secondaryHref="#"
              resourceName="videos"
            />
          </s-section>
        ) : (
          <s-section padding="none">
            <s-stack direction="block" gap="none">
              {/* ── Trục 1: trạng thái (single-select) ── */}
              <s-box padding="small-100" background="subdued">
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  {TABS.map((label, index) => (
                    <s-button
                      key={label}
                      variant={tab === index ? 'primary' : 'tertiary'}
                      onClick={() => {
                        setTab(index);
                        setPage(1);
                      }}
                    >
                      {label}
                    </s-button>
                  ))}
                </s-stack>
              </s-box>

              {/* ── Search + view toggle ── */}
              <s-box padding="small-100">
                <s-grid
                  gap="small-200"
                  gridTemplateColumns="minmax(0, 1fr) max-content"
                  alignItems="center"
                >
                  <s-search-field
                    label="Search videos"
                    labelAccessibilityVisibility="exclusive"
                    placeholder="Search videos by title"
                    value={effectiveQuery}
                    onInput={(event) => setQuery(event.currentTarget.value)}
                  />
                  {/* Toggle grid ⇄ table là CONTROL của merchant, không phải một state
                      để review (bản mockup cũ để grid là state — sai). Grid để nhận
                      diện bằng mắt, table để quét số. */}
                  <s-stack direction="inline" gap="small-500">
                    <s-button
                      variant={view === 'grid' ? 'primary' : 'tertiary'}
                      icon="grid"
                      accessibilityLabel="Grid view"
                      onClick={() => setView('grid')}
                    />
                    <s-button
                      variant={view === 'table' ? 'primary' : 'tertiary'}
                      icon="list-bulleted"
                      accessibilityLabel="Table view"
                      onClick={() => setView('table')}
                    />
                  </s-stack>
                </s-grid>
              </s-box>

              {/* ── Sort + Source + lọc chưa tag ──
                  Dropdown CÓ NHÃN thay cho hai hàng chip trần: chip không nhãn thì
                  merchant không biết chúng là filter, cũng không biết chúng thuộc
                  trục nào. Mọi control ở đây tự nói ra mình lọc theo cái gì. */}
              <s-box padding="small-100">
                {/* `s-select` là block, trong `s-stack` nó chiếm hết chiều ngang và
                    xếp dọc → phải dùng grid với cột cố định */}
                <s-grid
                  gap="base"
                  gridTemplateColumns="200px 200px minmax(0, 1fr)"
                  alignItems="end"
                >
                  <s-select
                    label="Sort by"
                    value={sort}
                    onChange={(event) => setSort(event.currentTarget.value)}
                  >
                    <s-option value="newest">Newest first</s-option>
                    <s-option value="revenue">Highest revenue</s-option>
                    <s-option value="views">Most views</s-option>
                  </s-select>

                  <s-select
                    label="Source"
                    value={source}
                    onChange={(event) => {
                      setSource(event.currentTarget.value);
                      setPage(1);
                    }}
                  >
                    <s-option value="all">All sources</s-option>
                    {SOURCES.map((item) => (
                      <s-option key={item} value={item}>
                        {item}
                      </s-option>
                    ))}
                  </s-select>

                  {/* Trục "vấn đề" chỉ còn MỘT: "Not placed" đã thành tab, vì trong app
                      publish chính là gán vào widget nên nó trùng với Draft. */}
                  <s-stack direction="inline" gap="base" alignItems="center">
                    <s-checkbox
                      label="Only videos with no products tagged"
                      checked={effectiveUntagged}
                      onChange={() => {
                        setUntaggedOnly((on) => !on);
                        setPage(1);
                      }}
                    />
                    {hasRowFilters && (
                      <s-button variant="tertiary" onClick={clearFilters}>
                        Clear filters
                      </s-button>
                    )}
                  </s-stack>
                </s-grid>
              </s-box>

              {/* Nút "Add videos" ở header bị disable khi đụng trần → lý do phải là TEXT
                  HIỆN SẴN, tooltip không mở trên control disabled (§7a). */}
              {atVideoLimit && !readOnly && (
                <s-box padding="small-100">
                  <s-text color="subdued">
                    You&apos;ve used all {videoLimit} videos on {plan.name} — delete one to add
                    another, or upgrade for unlimited.
                  </s-text>
                </s-box>
              )}

              {/* ── Bulk bar: tự dựng vì s-table không có row selection ── */}
              <s-box padding="small-100">
                <SelectAllBar
                  selectedCount={selection.length}
                  pageCount={pageItems.length}
                  totalCount={totalItems}
                  onSelectAllPages={() => setSelected(list.map((v) => v.id))}
                  onClear={() => {
                    setSelected([]);
                    if (is('bulk-selected')) setState('default');
                  }}
                >
                  {/* Bulk đáng giá nhất trang: placement là gán tay từng video vào
                      từng widget — 543 video mà làm từng cái là không xong */}
                  <s-button variant="secondary" command="--show" commandFor="add-to-widget">
                    Add to widget
                  </s-button>
                  <s-button variant="secondary" command="--show" commandFor="tag-products">
                    Tag products
                  </s-button>
                  <s-button variant="secondary" tone="critical" command="--show" commandFor="confirm-delete">
                    Delete
                  </s-button>
                </SelectAllBar>
              </s-box>

              {/* ── Danh sách ── */}
              {loading ? (
                <s-box padding="large-200">
                  <s-stack direction="block" gap="small-100" alignItems="center">
                    <s-spinner size="large" accessibilityLabel="Loading your videos" />
                    <s-text color="subdued">Loading your videos</s-text>
                  </s-stack>
                </s-box>
              ) : pageItems.length === 0 ? (
                <s-box padding="base">
                  <EmptyState
                    isEmptyState={!hasAnyFilter}
                    heading="Add your first video"
                    body="Upload a file, or import from TikTok and Instagram."
                    resourceName="videos"
                  />
                  {hasAnyFilter && (
                    <s-stack direction="block" gap="small-200" alignItems="center">
                      {/* Ở đây dọn HẾT (tab + search + filter) nên nhãn phải nói rõ,
                          khác với nút "Clear filters" ở hàng filter phía trên. */}
                      <s-button onClick={resetAll}>Reset search and filters</s-button>
                    </s-stack>
                  )}
                </s-box>
              ) : view === 'grid' ? (
                <s-box padding="small-100">
                  {/* `auto-fill` để grid LẤP ĐẦY chiều ngang — app thật để thẻ rộng cố
                      định nên 2 item bỏ trống gần hết card */}
                  <s-grid gap="base" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))">
                    {pageItems.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        selected={selection.includes(video.id)}
                        readOnly={readOnly}
                        onToggle={() => toggleRow(video.id)}
                      />
                    ))}
                  </s-grid>
                </s-box>
              ) : (
                <s-table variant="auto">
                  <s-table-header-row>
                    <s-table-header listSlot="primary">Video</s-table-header>
                    <s-table-header listSlot="kicker">Status</s-table-header>
                    <s-table-header>Products</s-table-header>
                    <s-table-header>Widgets</s-table-header>
                    <s-table-header format="numeric">Views</s-table-header>
                    <s-table-header format="numeric">Orders</s-table-header>
                    <s-table-header format="currency" listSlot="secondary">
                      Revenue
                    </s-table-header>
                  </s-table-header-row>
                  <s-table-body>
                    {pageItems.map((video) => (
                      <s-table-row key={video.id}>
                        <s-table-cell>
                          {/* `s-grid` chứ KHÔNG phải `s-stack direction="inline"`:
                              `s-paragraph` là block nên trong stack nó chiếm hết chiều
                              ngang và bị đẩy xuống dưới thumbnail. `minmax(0, 1fr)` mới
                              cho cột co lại để `lineClamp` cắt được.
                              (MAKEUGC-UI-PATTERNS §7d — lỗi này đã gặp ở Home.) */}
                          <s-grid
                            gap="small-100"
                            gridTemplateColumns="auto auto minmax(0, 1fr)"
                            alignItems="center"
                          >
                            {!readOnly ? (
                              <s-checkbox
                                label={`Select ${video.title}`}
                                labelAccessibilityVisibility="exclusive"
                                checked={selection.includes(video.id)}
                                onChange={() => toggleRow(video.id)}
                              />
                            ) : (
                              <s-text> </s-text>
                            )}
                            <s-thumbnail src={thumb(video.id, 80)} alt={video.title} size="small" />
                            <s-paragraph lineClamp={1}>
                              <s-link href={`/app/library/${video.id}`}>
                                <s-text type="strong">{video.title}</s-text>
                              </s-link>
                            </s-paragraph>
                          </s-grid>
                        </s-table-cell>
                        <s-table-cell>
                          <StatusBadge video={video} />
                        </s-table-cell>
                        {/* Tên product, KHÔNG phải một con số — merchant biết ngay
                            video nói về cái gì */}
                        <s-table-cell>
                          {video.products.length === 0 ? (
                            <s-badge tone="warning">None</s-badge>
                          ) : (
                            <s-text>{video.products.join(', ')}</s-text>
                          )}
                        </s-table-cell>
                        <s-table-cell>
                          {video.widgets.length === 0 ? (
                            <s-badge tone="warning">Not placed</s-badge>
                          ) : (
                            <s-text>{video.widgets.join(', ')}</s-text>
                          )}
                        </s-table-cell>
                        <s-table-cell>{video.views.toLocaleString()}</s-table-cell>
                        <s-table-cell>{String(video.orders)}</s-table-cell>
                        <s-table-cell>${video.revenue.toLocaleString()}</s-table-cell>
                      </s-table-row>
                    ))}
                  </s-table-body>
                </s-table>
              )}

              {/* Hiện tổng số + phân trang — merchant phải biết đang xem 20 trong 543.
                  Ẩn khi đang load (chưa biết số mà đã nói là nói bừa) và khi không có
                  kết quả ("Showing 0 of 0 videos" là câu vô nghĩa). */}
              {!loading && pageItems.length > 0 && (
              <s-box padding="small-100" background="subdued">
                <s-stack
                  direction="inline"
                  gap="small-200"
                  alignItems="center"
                  justifyContent="space-between"
                >
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
            </s-stack>
          </s-section>
        )}
      </s-stack>

      {/* ══ MODAL: hai đường thêm video ══ */}
      <s-modal id="add-videos" heading="Add videos" accessibilityLabel="Add videos">
        <s-stack direction="block" gap="small">
          <s-paragraph color="subdued">
            Both end up in your Library. Nothing goes on your storefront until you add it to a
            widget.
          </s-paragraph>
          <s-button>Upload a file</s-button>
          <s-button>Import from TikTok or Instagram</s-button>
        </s-stack>
        <s-button slot="secondary-actions" command="--hide" commandFor="add-videos">
          Cancel
        </s-button>
      </s-modal>

      {/* ══ MODAL: bulk add to widget ══
          Danh sách đa chọn nên nút phải là "Save", KHÔNG phải "Add to widget" —
          app thật ghi "Add to widget" trong khi bỏ tick cũng là một hành động. */}
      <s-modal
        id="add-to-widget"
        heading={`Add ${selection.length} videos to widgets`}
        accessibilityLabel={`Add ${selection.length} videos to widgets`}
      >
        <s-stack direction="block" gap="small">
          <s-paragraph color="subdued">
            Pick where these should appear on your storefront. A video can be in more than one
            widget.
          </s-paragraph>
          {widgetList.map((widget) => (
            <s-checkbox
              key={widget.id}
              label={widget.name}
              // Bản trước in `${widget.type} · ${widget.surface}`. Field `surface` đã bị
              // XOÁ khỏi data model (06 Aug 2026): app không biết block nằm ở surface nào
              // — merchant thêm block trong theme editor. In nó ra là khẳng định sai.
              // Thay bằng hai thứ app BIẾT: template và số video đang có trong widget.
              details={`${templateFor(widget.templateId).name} · ${widget.videoCount} videos`}
            />
          ))}
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          command="--hide"
          commandFor="add-to-widget"
        >
          Save
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="add-to-widget">
          Cancel
        </s-button>
      </s-modal>

      {/* ══ MODAL: bulk tag product ══
          Bulk tag = áp CÙNG một product cho mọi video đã chọn, nên phải nói rõ nó
          GHI ĐÈ cái đang có và ghi đè lên bao nhiêu cái. Không nói thì merchant chọn
          nhầm 20 video rồi xoá sạch product của cả 20. */}
      <s-modal
        id="tag-products"
        heading={`Tag ${selection.length} videos`}
        accessibilityLabel={`Tag ${selection.length} videos with products`}
      >
        <s-stack direction="block" gap="small">
          <s-paragraph color="subdued">
            The products you pick apply to every selected video. Tagging is what lets shoppers buy
            from a video.
          </s-paragraph>

          {/* In real app: shopify.resourcePicker({type: 'product', multiple: true}) */}
          <s-button onClick={() => setBulkProducts(['Linen wide-leg trousers'])}>
            Choose products
          </s-button>

          {bulkProducts.length === 0 ? (
            <s-text color="subdued">No products chosen yet.</s-text>
          ) : (
            <s-stack direction="inline" gap="small-300" alignItems="center">
              {bulkProducts.map((name) => (
                <s-chip key={name} removable>
                  {name}
                </s-chip>
              ))}
            </s-stack>
          )}

          {willOverwrite > 0 && (
            <s-banner
              tone="warning"
              heading={`${willOverwrite} of these already have products tagged`}
            >
              <s-paragraph>
                Their current products will be replaced by the ones you pick here.
              </s-paragraph>
            </s-banner>
          )}
        </s-stack>

        <s-button
          slot="primary-action"
          variant="primary"
          disabled={bulkProducts.length === 0}
          command="--hide"
          commandFor="tag-products"
        >
          Tag {selection.length} videos
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="tag-products">
          Cancel
        </s-button>
      </s-modal>

      {/* ══ MODAL: confirm xoá — PHẢI có số lượng ══ */}
      <s-modal
        id="confirm-delete"
        heading={`Delete ${selection.length} videos?`}
        accessibilityLabel={`Delete ${selection.length} videos`}
      >
        <s-stack direction="block" gap="small">
          <s-paragraph>
            This removes them from your Library and from every widget they&apos;re in. Shoppers
            will stop seeing them on your storefront.
          </s-paragraph>
          <s-paragraph color="subdued">This can&apos;t be undone.</s-paragraph>
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          tone="critical"
          command="--hide"
          commandFor="confirm-delete"
        >
          Delete {selection.length} videos
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="confirm-delete">
          Cancel
        </s-button>
      </s-modal>
    </s-page>
  );
}

/** Trạng thái có ICON + TEXT, không bao giờ chỉ bằng màu */
function StatusBadge({video}: {video: Video}) {
  if (video.status === 'processing') return <s-badge tone="info">Generating</s-badge>;
  if (video.status === 'failed') return <s-badge tone="critical">Failed</s-badge>;
  // "Not placed" là CẢNH BÁO chứ không trung tính: shopper không thấy video ở đâu cả
  if (video.widgets.length === 0) return <s-badge tone="warning">Not placed</s-badge>;
  return <s-badge tone="success">Live</s-badge>;
}

/**
 * Thẻ video.
 *
 * KHÔNG bọc cả thẻ trong `s-clickable`: bên trong đã có checkbox + link + nút menu,
 * lồng control tương tác vào nhau là vỡ cả a11y lẫn hành vi click. Thay vào đó
 * **thumbnail** là vùng bấm để chọn, còn tên là link sang trang detail.
 */
function VideoCard({
  video,
  selected,
  readOnly,
  onToggle,
}: {
  video: Video;
  selected: boolean;
  readOnly: boolean;
  onToggle: () => void;
}) {
  const processing = video.status === 'processing';
  const failed = video.status === 'failed';

  return (
    <s-box
      border="base"
      borderRadius="base"
      padding="small-300"
      background={selected ? 'subdued' : 'base'}
    >
      <s-stack direction="block" gap="small-300">
        {processing ? (
          // Item đang chạy KHÔNG chọn được — bulk một thứ chưa tồn tại là vô nghĩa
          <s-box background="subdued" borderRadius="base" padding="large-200">
            <s-stack direction="block" gap="small-300" alignItems="center">
              <s-spinner size="base" accessibilityLabel={`Generating ${video.title}`} />
              <s-text color="subdued">Generating</s-text>
            </s-stack>
          </s-box>
        ) : (
          <s-clickable
            borderRadius="base"
            disabled={readOnly}
            accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${video.title}`}
            onClick={onToggle}
          >
            <s-image
              src={thumb(video.id, 320)}
              alt={video.title}
              aspectRatio="1"
              objectFit="cover"
              borderRadius="base"
              loading="lazy"
            />
          </s-clickable>
        )}

        <s-stack direction="inline" gap="small-300" alignItems="center">
          {/* Checkbox HIỆN RÕ: bấm thumbnail cũng chọn được, nhưng không có gì báo
              cho merchant biết điều đó. Chỉ đổi nền khi đã chọn là quá muộn —
              affordance phải có TRƯỚC hành động. */}
          {!readOnly && !processing && (
            <s-checkbox
              label={`Select ${video.title}`}
              labelAccessibilityVisibility="exclusive"
              checked={selected}
              onChange={onToggle}
            />
          )}
          {/* StatusBadge đã nói "Not placed" khi rỗng — đừng thêm badge thứ hai cùng
              nội dung. Chỉ khi ĐÃ đặt mới cần nói đặt ở mấy widget. */}
          <StatusBadge video={video} />
          {video.widgets.length > 0 && (
            <s-badge tone="neutral">
              On {video.widgets.length} {video.widgets.length === 1 ? 'widget' : 'widgets'}
            </s-badge>
          )}
        </s-stack>

        {/* lineClamp chỉ có ở s-paragraph — s-text/s-link không có */}
        <s-paragraph lineClamp={2}>
          <s-link href={`/app/library/${video.id}`}>
            <s-text type="strong">{video.title}</s-text>
          </s-link>
        </s-paragraph>

        <s-text color="subdued">
          {video.source} · {video.createdAt}
        </s-text>

        {video.products.length === 0 && !failed && (
          <s-stack direction="inline" gap="small-400" alignItems="center">
            <s-icon type="alert-triangle" tone="warning" size="small" />
            <s-text tone="caution">No products tagged</s-text>
          </s-stack>
        )}

        {/* CHỈ doanh thu — view/đơn để table view lo. Ba số trên thẻ hẹp thì
            không đọc được số nào. */}
        {video.revenue > 0 && (
          <s-text type="strong">${video.revenue.toLocaleString()}</s-text>
        )}

        {failed && (
          <s-button variant="tertiary" disabled={readOnly}>
            Retry
          </s-button>
        )}
      </s-stack>
    </s-box>
  );
}

/** Note cấp trang — đúng ở mọi state */
function LibraryPageNotes() {
  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="block" gap="small-300">
        <s-text type="strong">Rule cấp trang — đúng ở mọi state</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              Filter có <s-text type="strong">ba trục tách riêng</s-text>: trạng thái (tab,
              single-select) · nguồn (chip, đa chọn) · vấn đề (chip, đa chọn). Kết hợp được với
              nhau và với search.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Grid ⇄ table là <s-text type="strong">control của merchant</s-text>, không phải state
              để review. Grid nhận diện bằng mắt, table quét số.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Publish ≠ lên storefront. Video phải nằm trong <s-text type="strong">widget</s-text>{' '}
              mới có người xem — nên &quot;Not placed&quot; là cảnh báo, không phải filter trung
              tính.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>

      <s-stack direction="block" gap="small-300">
        <s-text type="strong">⚠️ Khác app đang chạy — cần chốt</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              🛑 <s-text type="strong">Mockup vẽ 1 video : NHIỀU product, app đang 1:1</s-text>{' '}
              (modal &quot;Link to product&quot; ghi rõ 1:1). Stella chốt vẽ 1:n vì ràng buộc này
              là tạm thời — dev copy route phải biết backend chưa đỡ được.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Vốn từ chốt là <s-text type="strong">&quot;Tag products&quot;</s-text>; app đang ghi
              &quot;Link to product&quot; và sẽ đổi theo mockup.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Library <s-text type="strong">chỉ chứa video</s-text> — hệ quả của việc bỏ image
              generation ở AI Studio. Bỏ chip Images.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              🛑 Modal &quot;Choose widget&quot; của app nói video đang ở trong widget{' '}
              <s-text type="strong">Test</s-text> mà widget đó không có trong danh sách để gỡ ra.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>
    </s-stack>
  );
}
