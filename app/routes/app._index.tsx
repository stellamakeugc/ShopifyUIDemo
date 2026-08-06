/**
 * MOCKUP — Home (bản vẽ lại 05 Aug 2026, dựa trên screenshot app THẬT)
 *
 * ═══ VÌ SAO VIẾT LẠI ═══
 * Home của app hiện tại có một lỗi sản phẩm ở gốc: setup guide dạy con đường
 * merchant KHÔNG đi được. Plan mặc định là Free Forever với 0 credit, nhưng step 1
 * là "Generate a product video" trong AI Studio — mà AI Studio là "Growth plan up"
 * (roadmap Phase 0). Merchant mới install không hoàn thành được bước 1, nên
 * activation metric của Phase 1 (install → first video live dưới 10 phút) chết ngay.
 * Setup guide cũ cũng không có bước import NÀO, và không có bước TAG PRODUCT nào —
 * tag product mới là bước biến view thành đơn hàng.
 *
 * ═══ TRANG NÀY TRẢ LỜI 3 CÂU, ĐÚNG THỨ TỰ ═══
 *   1. Tôi đã setup xong chưa?   → action zone + setup guide
 *   2. Nó có ra tiền chưa?       → Performance (CHỈ hiện khi có data)
 *   3. Giờ làm gì tiếp?          → mỗi state có ĐÚNG MỘT next action
 *
 * ═══ KHÁC BẢN CŨ CHỖ NÀO ═══
 * - Đảo thứ tự: 4 con số 0 không còn đứng trên setup guide
 * - Credit nói MỘT lần (aside), có BUTTON — bản cũ nói 3 lần, không lần nào có button
 * - Xoá "Quick links": copy y nguyên sidebar, bằng raw HTML bullet list
 * - "Item clicks" / "action rate" → attributed revenue + orders (north-star roadmap)
 * - "Live on store 0" → card Store status theo đúng tên surface Shopify
 * - KHÔNG có chart: polaris-viz là React, Home là trang landing → page speed là
 *   guardrail metric + điều kiện BFS. Chart để ở Analytics.
 *
 * Route file thật: app/routes/app._index.tsx
 */
import {useContext, useState} from 'react';

import StateSwitcher from '../components/StateSwitcher';
import type {StateOption} from '../components/StateSwitcher';
import CreditMeter from '../components/CreditMeter';
import JobProgress from '../components/JobProgress';
import {HarnessJobContext} from '../Shell';
import {KpiTile, ProgressBar} from '../components/primitives';
import {
  PLANS,
  TOTAL_VIDEOS,
  setupSteps,
  storeSurfaces,
  thumb,
  videos,
  widgetPreviews,
} from '../data/sample';

/**
 * Lấy allowance TỪ `PLANS` thay vì gõ tay.
 *
 * Vì sao: bản trước hardcode `{name: 'Scale', credits: 200}` ở đây trong khi trang
 * Plans ghi 2.500 — hai trang cùng app nói hai con số giá khác nhau, lệch 12,5×.
 * Con số giá gõ tay ở hai chỗ thì sớm muộn cũng trôi khỏi nhau; đọc từ một nguồn
 * thì không thể lệch.
 */
const GROWTH = PLANS.find((plan) => plan.id === 'growth')!;
const SCALE = PLANS.find((plan) => plan.id === 'scale')!;

/**
 * State + rule hiển thị, để CẠNH NHAU cho khỏi lệch.
 *
 * `doc` chỉ ghi rule **không tự hiện rõ trên trang** — cái gì nhìn là thấy thì không
 * viết lại. Dev đọc panel này thay vì dò điều kiện trong JSX.
 */
const STATES: StateOption[] = [
  {
    value: 'first-run-free',
    label: 'First run — Free Forever, 0 video, 0 credit',
    doc: [
      {section: 'Page action', rule: 'Không có primary; secondary "View all videos" cũng ẩn — 0 video thì nó dẫn tới trang rỗng. Đây là state DUY NHẤT ẩn secondary.'},
      {section: 'Action zone', rule: 'Trống. Chưa có gì để merchant phải xử lý.'},
      {section: 'Performance', rule: 'Vẫn render nhưng KHÔNG có số 0 nào: mọi ô là "Not live yet" / "None yet", không trend, không subtitle "Last 30 days".'},
      {section: 'Top videos', rule: 'Không render — chưa có video thì bảng rỗng vô nghĩa.'},
      {section: 'Most used formats', rule: 'CHỈ hiện ở state này. Ba ô là placeholder, chờ asset design; CTA sang Widgets vì app có 6 format.'},
      {section: 'Aside', rule: 'Cả 4 surface "Not added". AI credits dùng nhánh plan-gated (banner + button Compare plans), KHÔNG hiện meter 0/0.'},
    ],
  },
  {
    value: 'setup-in-progress',
    label: 'Setup 2/4 — có video, chưa có widget',
    doc: [
      {section: 'Setup guide', rule: 'Bước xong tự thu, chỉ còn tick (không badge "Done"); bước hiện tại mở kèm badge "Next up".'},
      {section: 'Performance', rule: 'Vẫn "Not live yet": chưa có widget thì không thể có view/đơn — đây là sự thật, không phải thiếu data.'},
      {section: 'Top videos', rule: 'Render (đã có video trong Library) dù chưa cái nào lên storefront.'},
      {section: 'Aside', rule: 'Surface vẫn "Not added" — báo "18 videos" lúc guide còn nói chưa tạo widget là tự mâu thuẫn.'},
    ],
  },
  {
    value: 'widget-not-in-theme',
    label: 'Widget chưa vào theme — shopper không thấy gì',
    doc: [
      {section: 'Action zone', rule: 'Banner warning. Đây là state tệ nhất mà app hiện tại KHÔNG báo: video đã publish, merchant tưởng xong, nhưng theme chưa có app block nên storefront trống.'},
      {section: 'Setup guide', rule: 'Bước theme mở, có nút "Refresh status" — bước duy nhất xảy ra ngoài app nên app không tự biết lúc nào xong.'},
      {section: 'Performance', rule: '"Not live yet" — publish trong app ≠ hiện trên storefront.'},
    ],
  },
  {
    value: 'setup-just-completed',
    label: 'Setup vừa xong 4/4 — video vừa lên storefront',
    doc: [
      {section: 'Setup guide', rule: 'Hiện ĐÚNG MỘT LẦN rồi ẩn hẳn. Xong bước cuối mà card biến mất ngay thì hành động cuối của merchant không được xác nhận gì.'},
      {section: 'Performance', rule: 'ĐÃ live nên KHÔNG dùng "Not live yet": revenue/orders = "No sales yet"/"No orders yet", views = "No data yet", Videos live = số thật.'},
      {section: 'Top videos', rule: 'views/orders/revenue = 0 / — . Vừa lên storefront thì chưa ai kịp xem.'},
      {section: 'Aside', rule: 'Surface chuyển sang live — vừa add widget mà báo "Not added" là sai.'},
    ],
  },
  {
    value: 'default-free',
    label: 'Default — Free Forever, có video + có đơn',
    doc: [
      {section: 'Setup guide', rule: 'Ẩn hẳn.'},
      {section: 'Aside', rule: 'AI credits vẫn plan-gated: Free Forever không có credit, và đó là "plan không có tính năng" chứ KHÔNG phải "hết credit" — hai đường thoát khác nhau.'},
    ],
  },
  {
    value: 'default-paid',
    label: 'Default — Growth, còn credit',
    doc: [
      {section: 'Aside', rule: 'CreditMeter thật: còn lại / đã dùng / % / ngày reset / tên plan. Warning tự bật khi còn ≤20%.'},
    ],
  },
  {
    value: 'no-sales-yet',
    label: 'No sales yet — có video live, chưa có đơn',
    doc: [
      {section: 'Performance', rule: 'views là số THẬT (có người xem), chỉ revenue/orders là "No sales yet" — đó chính là ý nghĩa của state này, khác hẳn empty state.'},
      {section: 'Performance', rule: 'Có thêm card giải thích + CTA kiểm tra widget: thấy "$0" trơ trọi thì merchant tưởng tracking hỏng.'},
      {section: 'Top videos', rule: 'orders = 0, revenue = — , views giữ số thật.'},
    ],
  },
  {
    value: 'untagged',
    label: 'Untagged — video live chưa tag product',
    doc: [
      {section: 'Action zone', rule: 'Banner warning, số video đếm từ data (published && products.length === 0) — KHÔNG hardcode.'},
      {section: 'Top videos', rule: 'Row chưa tag đổi badge thành "No product tagged" thay cho "Published". Đây là lỗi im lặng tệ nhất của app: shopper xem được nhưng không mua được gì.'},
    ],
  },
  {
    value: 'job-processing',
    label: 'Async job — đang generate',
    doc: [
      {section: 'Action zone', rule: 'Card chi tiết: done/total + ETA + Cancel. Job phải nhìn thấy được từ Home và survive reload — không thì merchant reload, tưởng vỡ, bấm generate lần nữa và tiêu credit hai lần.'},
      {section: 'Toàn cục', rule: 'Các trang KHÁC hiện banner gọn (GlobalJobProgress); Home thì không, để không nói một chuyện hai lần.'},
      {section: 'Aside', rule: 'Credit 43/50 → tự vào nhánh low warning. Không hardcode banner.'},
      {section: 'Cả trang', rule: 'KHÔNG chặn gì. Job async thì merchant phải làm việc khác được.'},
    ],
  },
  {
    value: 'job-failed',
    label: 'Async job — fail',
    doc: [
      {section: 'Action zone', rule: 'Phải có LÝ DO CỤ THỂ (không phải "Something went wrong") + Retry + nói rõ credit đã hoàn hay bị trừ — enterprise sẽ đối chiếu hoá đơn.'},
    ],
  },
  {
    value: 'quota-blocked',
    label: 'Quota blocked — paid, hết credit',
    doc: [
      {section: 'Aside', rule: 'Banner critical có NGÀY RESET + đường upgrade. Nút Generate disabled, và lý do nằm ở banner ngay trên — KHÔNG dựa vào tooltip (tooltip không mở được trên control disabled).'},
      {section: 'Cả trang', rule: 'Mọi thứ khác dùng bình thường: hết credit ≠ mất tính năng. Đừng ẩn AI Studio.'},
    ],
  },
  {
    value: 'loading',
    label: 'Loading — s-spinner (KHÔNG có skeleton)',
    doc: [
      {section: 'Performance', rule: 'Mỗi ô một s-spinner có accessibilityLabel riêng ("Loading Attributed revenue"). Polaris web components KHÔNG có skeleton.'},
      {section: 'Top videos', rule: 'Dùng attr `loading` của s-table, không tự dựng.'},
      {section: 'Aside', rule: 'Render bình thường — nó không phụ thuộc data đang load.'},
    ],
  },
  {
    value: 'error',
    label: 'Error — không load được dashboard',
    doc: [
      {section: 'Performance', rule: 'KHÔNG render. Hiện số cũ hoặc số 0 lúc lỗi là báo sai sự thật.'},
      {section: 'Top videos', rule: 'KHÔNG render.'},
      {section: 'Action zone', rule: 'Banner critical phải nói rõ cái gì KHÔNG bị ảnh hưởng (video vẫn live, đơn vẫn được ghi) — merchant sợ nhất là mất data.'},
    ],
  },
  {
    value: 'no-permission',
    label: 'No permission — staff không có billing access',
    doc: [
      {section: 'Aside', rule: 'Thay CreditMeter bằng block AI Studio: nút disabled + lý do bằng TEXT HIỆN SẴN (ai làm được việc này). Không ẩn nút — ẩn thì staff không hiểu vì sao mình không thấy.'},
      {section: 'Cả trang', rule: 'Vẫn xem được video + performance. Chỉ chặn việc tiêu tiền.'},
    ],
  },
];

/**
 * Note áp cho MỌI state của trang.
 *
 * Hai loại: (1) rule cấp TRANG — đúng ở mọi state nên không nhét vào `doc` của từng
 * state được, (2) ràng buộc từ phía Shopify — không phải quyết định design.
 */
function HomePageNotes() {
  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="block" gap="small-300">
        <s-text type="strong">Rule cấp trang — đúng ở mọi state</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              Primary action <s-text type="strong">Add videos</s-text> chỉ hiện khi setup guide
              KHÔNG hiện (setup đã xong, hoặc merchant đã Dismiss). Guide còn hiện thì NÓ sở hữu
              next action — thêm primary ở header nữa là hai nút primary cùng một câu.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Secondary <s-text type="strong">View all videos</s-text> hiện ở mọi state trừ
              first-run: 0 video thì nó dẫn tới một trang rỗng.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Action zone chỉ render <s-text type="strong">MỘT</s-text> thứ, ưu tiên theo thứ tự
              thiệt hại: error → job → no-permission → widget chưa vào theme → untagged.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>

      <s-stack direction="block" gap="small-300">
        <s-text type="strong">
          ⚠️ Trước khi Shopify approve scope đọc Orders / Revenue của merchant
        </s-text>
      <s-unordered-list>
        <s-list-item>
          <s-text color="subdued">
            Performance: bỏ 2 card <s-text type="strong">Attributed revenue</s-text> và{' '}
            <s-text type="strong">Attributed orders</s-text>. Còn lại Video views + Videos live.
          </s-text>
        </s-list-item>
        <s-list-item>
          <s-text color="subdued">
            Top videos: bỏ 2 cột <s-text type="strong">Orders</s-text> và{' '}
            <s-text type="strong">Revenue</s-text>, đổi heading thành{' '}
            <s-text type="strong">Top videos by views</s-text> và sort theo views.
          </s-text>
        </s-list-item>
        <s-list-item>
          <s-text color="subdued">
            Kéo theo: state <s-text type="strong">no-sales-yet</s-text> mất nghĩa trong giai đoạn
            này (không có dữ liệu đơn để nói &quot;chưa có đơn&quot;) — dùng no-data-yet theo views.
          </s-text>
        </s-list-item>
      </s-unordered-list>
        <s-text color="subdued">
          Mockup dưới đây CỐ Ý vẽ bản đầy đủ (sau khi được approve). Dev tự bỏ 2 card + 2 cột,
          không cần bản design riêng.
        </s-text>
      </s-stack>
    </s-stack>
  );
}

/**
 * Bước nào đã xong theo từng state — điều khiển cả progress lẫn next action.
 * Có mặt trong bảng này = setup guide CÒN HIỆN. Mọi state khác coi như đã xong từ
 * lâu và guide ẩn hẳn.
 */
const DONE_STEPS: Record<string, string[]> = {
  'first-run-free': [],
  'setup-in-progress': ['add', 'tag'],
  'widget-not-in-theme': ['add', 'tag', 'widget'],
  // 4/4 nhưng guide VẪN hiện một lần: xong bước cuối mà cả card biến mất ngay thì
  // hành động cuối cùng của merchant không được xác nhận gì. Lần vào Home sau mới ẩn.
  'setup-just-completed': ['add', 'tag', 'widget', 'theme'],
};

export default function Home() {
  const [state, setState] = useState('first-run-free');
  // Dismiss được nhưng phải MỞ LẠI ĐƯỢC (enterprise checklist §7) — đừng khoá vĩnh viễn
  const [setupDismissed, setSetupDismissed] = useState(false);
  /**
   * Step nào đang mở.
   *   null = merchant chưa can thiệp → mở step hiện tại
   *   ''   = đã tự đóng hết
   *   id   = mở đúng step đó
   */
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const is = (...names: string[]) => names.includes(state);

  const loading = is('loading');
  const firstRun = is('first-run-free');
  const noSales = is('no-sales-yet');
  const paidPlan = is('default-paid', 'quota-blocked', 'job-processing', 'job-failed');

  // Setup chưa xong → guide còn sống. State khác coi như merchant đã setup xong.
  const setupIncomplete = state in DONE_STEPS;
  const doneStepIds = DONE_STEPS[state] ?? setupSteps.map((step) => step.id);
  const steps = setupSteps.map((step) => ({...step, done: doneStepIds.includes(step.id)}));
  const currentStep = steps.find((step) => !step.done);
  const doneCount = steps.filter((step) => step.done).length;
  const minutesLeft = steps
    .filter((step) => !step.done)
    .reduce((total, step) => total + step.minutes, 0);
  const showSetup = setupIncomplete && !setupDismissed;
  const expandedStepId = openStepId === null ? currentStep?.id : openStepId;
  const toggleStep = (id: string) => setOpenStepId(expandedStepId === id ? '' : id);
  const justCompleted = is('setup-just-completed');

  // Performance hiện ở MỌI state trừ error — kể cả khi chưa có số.
  //
  // Vì sao KHÔNG ẩn hẳn lúc first-run: ẩn thì merchant không biết app có đo gì
  // không và số sẽ hiện ở đâu. Vấn đề của app hiện tại không phải là "có khối
  // metric" mà là (a) nó đứng TRÊN setup guide và (b) nó hiện bốn con số 0.
  // Khối này đã xuống dưới setup guide, nên chỉ cần bỏ số 0: `preLaunch` cho ra
  // nhãn trạng thái thật thay vì "0".
  const showData = !is('error');
  // Chưa setup xong → chưa có gì trên storefront → không thể có view/đơn nào.
  // Đây là sự thật, không phải thiếu data: nói "Not live yet" chứ không nói "0".
  // `justCompleted` đã live rồi nên KHÔNG tính là preLaunch — nói "Not live yet"
  // ngay sau khi merchant vừa đưa widget lên là nói sai.
  const preLaunch = setupIncomplete && !justCompleted;
  // Vừa live thì chưa kịp có số nào, nhưng đó là "chưa có data" chứ không phải "chưa live"
  const noData = noSales || justCompleted;
  const topVideosVisible = showData && !firstRun;

  const liveVideos = videos.filter((video) => video.widgets.length > 0);
  const untaggedLive = liveVideos.filter((video) => video.products.length === 0);
  const totals = liveVideos.reduce(
    (acc, video) => ({
      revenue: acc.revenue + video.revenue,
      orders: acc.orders + video.orders,
      views: acc.views + video.views,
    }),
    {revenue: 0, orders: 0, views: 0},
  );
  const topVideos = [...liveVideos].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Setup chưa xong thì KHÔNG surface nào live được — nói "Product page: 18 videos"
  // trong lúc guide còn bảo "chưa tạo widget" là tự mâu thuẫn ngay trên một trang.
  const surfaces = preLaunch
    ? storeSurfaces.map((row) => ({...row, live: false, videoCount: 0}))
    : storeSurfaces;

  return (
    <s-page heading="Home">
      {/* Setup guide đang hiện thì NÓ sở hữu next action — thêm primary action ở
          header nữa là hai button primary nói cùng một câu, đúng cái lỗi CTA trùng
          của bản cũ (AI Studio xuất hiện 3 lần trên một trang). */}
      {!showSetup && (
        <s-button slot="primary-action" variant="primary" href="/app/library">
          Add videos
        </s-button>
      )}
      {!firstRun && (
        <s-button slot="secondary-actions" href="/app/library">
          View all videos
        </s-button>
      )}

      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={setState}
          states={STATES}
          globalNote={<HomePageNotes />}
        />

        {/* ══ 1. ACTION ZONE — chỉ MỘT thứ render, theo thứ tự ưu tiên ══
            Bản cũ để banner info thường trú (không button, không dismiss) làm chỗ
            quảng cáo plan. Vùng này chỉ dành cho việc merchant PHẢI xử lý. */}
        <ActionZone state={state} untaggedCount={untaggedLive.length} />

        {/* ══ 2. SETUP GUIDE — một s-section, không phải 4 card rời ══
            Bản cũ: 4 card viền riêng, cao ~2 viewport, không progress bar, không
            dismiss. Đây là pattern setup-guide của Shopify: step xong thì collapse,
            chỉ step hiện tại mở. */}
        {showSetup && (
          <s-section heading={justCompleted ? 'Setup complete' : 'Get set up'}>
            <s-stack direction="block" gap="base">
              <s-stack
                direction="inline"
                gap="small-100"
                justifyContent="space-between"
                alignItems="start"
              >
                <s-paragraph color="subdued">
                  {/* Nói ra thời gian còn lại — mục tiêu roadmap là dưới 10 phút,
                      nên con số này là lời hứa, không phải trang trí */}
                  {justCompleted
                    ? 'Your videos are live on your storefront. Shoppers can watch and buy from them now.'
                    : doneCount === 0
                      ? `Go from first video to storefront sales in about ${minutesLeft} minutes.`
                      : `About ${minutesLeft} minutes left.`}
                </s-paragraph>
                <s-button variant="tertiary" onClick={() => setSetupDismissed(true)}>
                  {justCompleted ? 'Hide' : 'Dismiss'}
                </s-button>
              </s-stack>

              <ProgressBar
                progress={(doneCount / steps.length) * 100}
                label={`${doneCount} of ${steps.length} steps complete`}
              />

              <s-divider />

              <s-stack direction="block" gap="small">
                {steps.map((step, index) => {
                  const isCurrent = step.id === currentStep?.id;
                  const expanded = step.id === expandedStepId;

                  return (
                    <s-stack key={step.id} direction="block" gap="small-300">
                      {/* Xổ ra / thu lại bằng NÚT CHEVRON, không phải cả dòng.
                          Vì sao không dùng `s-clickable` cho cả dòng: nó luôn tô nền
                          xám khi hover, kể cả `background="transparent"` — rule
                          `.background-transparent:not(.disabled):hover` nằm trong
                          shadow DOM và chỉ đọc token nội bộ có hash build
                          (`--t-surface-hover-26021`), không có prop nào tắt được và
                          override token đó thì vỡ mỗi lần Shopify build lại polaris.js.
                          Nút icon-only vẫn có accessibilityLabel nên keyboard +
                          screen reader không mất gì. */}
                      <s-stack
                        direction="inline"
                        gap="small-200"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <s-stack direction="inline" gap="small-200" alignItems="center">
                          <s-icon
                            type={step.done ? 'check-circle' : 'circle'}
                            tone={step.done ? 'success' : 'neutral'}
                          />
                          <s-text
                            type={isCurrent ? 'strong' : undefined}
                            color={step.done ? 'subdued' : 'base'}
                          >
                            {step.label}
                          </s-text>
                        </s-stack>

                        <s-stack direction="inline" gap="small-200" alignItems="center">
                          {/* Không có badge "Done": icon check-circle đã nói rồi, thêm
                              chữ là nói hai lần. Nhưng KHÔNG được mất tín hiệu cho
                              screen reader — `s-icon` không nhận accessibilityLabel,
                              nên gắn text ẩn (`accessibilityVisibility="exclusive"`:
                              không hiện, vẫn đọc được). */}
                          {step.done && (
                            <s-text accessibilityVisibility="exclusive">Done</s-text>
                          )}
                          {isCurrent && <s-badge tone="info">Next up</s-badge>}
                          <s-button
                            variant="tertiary"
                            icon={expanded ? 'chevron-up' : 'chevron-down'}
                            accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} step ${index + 1}: ${step.label}`}
                            onClick={() => toggleStep(step.id)}
                          />
                        </s-stack>
                      </s-stack>

                      {expanded && (
                        <s-box paddingInlineStart="large">
                          <s-stack direction="block" gap="small-200" alignItems="start">
                            <s-paragraph color="subdued">{step.why}</s-paragraph>
                            <s-text color="subdued">
                              Step {index + 1} of {steps.length} · about {step.minutes} min
                            </s-text>
                            <s-stack direction="inline" gap="small-200" alignItems="center">
                              <s-button variant="primary" href={step.href}>
                                {step.ctaLabel}
                              </s-button>
                              {/* Bước theme là bước DUY NHẤT xảy ra ngoài app: merchant
                                  sang theme editor kéo block vào rồi quay lại. App không
                                  tự biết lúc nào xong, nên phải có đường tự bấm kiểm tra
                                  lại — không có nút này thì merchant kẹt ở 3/4 vĩnh viễn
                                  dù đã làm xong.
                                  In real app: gọi lại check theme asset (Shopify Asset
                                  API / storefront probe) rồi shopify.toast.show(...). */}
                              {step.id === 'theme' && !step.done && (
                                <s-button icon="refresh" onClick={() => {}}>
                                  Refresh status
                                </s-button>
                              )}
                            </s-stack>
                          </s-stack>
                        </s-box>
                      )}
                    </s-stack>
                  );
                })}
              </s-stack>

              {/* Xong 4/4: đóng vòng lặp bằng một hành động xem KẾT QUẢ, và nói rõ
                  card này sẽ tự ẩn — merchant không phải đoán vì sao lần sau nó mất. */}
              {justCompleted && (
                <s-stack direction="block" gap="small-200" alignItems="start">
                  <s-divider />
                  <s-button variant="primary" href="/app/widgets">
                    See where your widget appears
                  </s-button>
                  <s-text color="subdued">
                    This guide disappears the next time you open Home.
                  </s-text>
                </s-stack>
              )}
            </s-stack>
          </s-section>
        )}

        {/* Dismiss rồi vẫn mở lại được — và phải GIỮ NGUYÊN KHUNG THẺ.
            Bản trước chỉ còn một dòng chữ trần: nhìn không ra là bấm được, nên hoá
            ra dismiss = mất luôn setup guide. Giữ card + button thật + tiến độ. */}
        {setupIncomplete && setupDismissed && (
          <s-section>
            <s-stack
              direction="inline"
              gap="small"
              alignItems="center"
              justifyContent="space-between"
            >
              <s-stack direction="block" gap="small-500">
                <s-text type="strong">Setup guide</s-text>
                <s-text color="subdued">
                  {doneCount} of {steps.length} steps complete · about {minutesLeft} min left
                </s-text>
              </s-stack>
              <s-button onClick={() => setSetupDismissed(false)}>Resume setup</s-button>
            </s-stack>
          </s-section>
        )}

        {/* ══ 3. PERFORMANCE — chỉ khi CÓ data ══
            Attributed revenue là north-star metric của roadmap và MVP có revenue
            counter cho mọi plan, nhưng Home hiện tại không hiện nó ở đâu cả. */}
        {showData && (
          // KHÔNG bọc trong `s-section`: `s-section` lồng nhau thì thẻ con mất viền,
          // 4 metric chìm hết vào một mảng trắng. Để `s-grid` ở cấp trang thì mỗi
          // `KpiTile` (bản thân là một `s-section`) render thành thẻ riêng.
          <s-stack direction="block" gap="small">
            <s-stack direction="inline" gap="small" alignItems="center" justifyContent="space-between">
              <s-heading>Performance</s-heading>
              {!preLaunch && <s-text color="subdued">Last 30 days</s-text>}
            </s-stack>

            {/* 2×2 CỐ ĐỊNH, không dùng `auto-fit`.
                Cột main rộng ~638px (có aside bên cạnh) nên `minmax(200px, 1fr)` chỉ
                vừa 3 cột → thẻ thứ tư mồ côi một hàng riêng, đúng cái lỗi grid 3+1
                của app hiện tại. `auto-fit` còn đổi số cột theo độ rộng viewport nên
                lỗi mồ côi quay lại ở màn khác. 2×2 thì mọi độ rộng đều cân, và nhãn
                dài như "Attributed revenue" không bị wrap. */}
            <s-grid gap="base" gridTemplateColumns="repeat(2, minmax(0, 1fr))">
                <KpiTile
                  id="kpi-revenue"
                  label="Attributed revenue"
                  help="Revenue from orders where the shopper watched one of your videos first. Tracked by MakeUGC on every plan, in your store's currency."
                  value={`$${totals.revenue.toLocaleString()}`}
                  trend={preLaunch ? undefined : {value: '18.2%', direction: 'up', good: true}}
                  loading={loading}
                  emptyLabel={preLaunch ? 'Not live yet' : noData ? 'No sales yet' : undefined}
                />
                <KpiTile
                  id="kpi-orders"
                  label="Attributed orders"
                  help="Orders where the shopper watched a video before buying."
                  value={totals.orders.toLocaleString()}
                  trend={preLaunch ? undefined : {value: '12.4%', direction: 'up', good: true}}
                  loading={loading}
                  emptyLabel={preLaunch ? 'Not live yet' : noData ? 'No orders yet' : undefined}
                />
                <KpiTile
                  id="kpi-views"
                  label="Video views"
                  help="Times a shopper watched at least 3 seconds of one of your videos on your storefront."
                  value={totals.views.toLocaleString()}
                  trend={preLaunch || justCompleted ? undefined : {value: '9.7%', direction: 'up', good: true}}
                  loading={loading}
                  // Vừa lên storefront thì chưa ai kịp xem — "No data yet", không phải
                  // "Not live yet" (đã live) và cũng không phải con số của tháng trước.
                  emptyLabel={preLaunch ? 'Not live yet' : justCompleted ? 'No data yet' : undefined}
                />
                <KpiTile
                  id="kpi-live"
                  label="Videos live"
                  help="Published videos currently visible on your storefront."
                  value={String(liveVideos.length)}
                  loading={loading}
                  emptyLabel={preLaunch ? 'None yet' : undefined}
                />
            </s-grid>

            {/* "no-sales-yet" ≠ empty state. Có video, đang có view, chưa có đơn —
                merchant cần biết mình KHÔNG làm sai gì, và chỗ để kiểm tra.
                Giữ lại vì đây là state DỄ HIỂU SAI nhất: nhìn "$0" mà không có lời
                giải thích thì merchant tưởng tracking hỏng. Khác với preLaunch —
                lúc đó nhãn "Not live yet" đã tự nói rồi, không cần thêm note. */}
            {noSales && !justCompleted && (
              <s-section>
                <s-stack direction="block" gap="small-200" alignItems="start">
                  <s-text type="strong">No attributed sales yet</s-text>
                  <s-paragraph color="subdued">
                    Your videos are live and being watched. Sales appear here once a shopper buys
                    after watching. Check that the products tagged in your videos are in stock.
                  </s-paragraph>
                  <s-button href="/app/widgets">Check where your widget appears</s-button>
                </s-stack>
              </s-section>
            )}
          </s-stack>
        )}

        {/* ══ 4. TOP VIDEOS — cần có video mới có bảng ══ */}
        {topVideosVisible && (
          <s-section heading="Top videos by revenue">
            <s-stack direction="block" gap="small">
              <s-stack direction="inline" gap="small-100" justifyContent="space-between">
                <s-text color="subdued">
                  Top {topVideos.length} of {TOTAL_VIDEOS} videos
                </s-text>
                <s-link href="/app/library">
                  <s-text type="strong">View all</s-text>
                </s-link>
              </s-stack>

              <s-table variant="auto" loading={loading}>
                <s-table-header-row>
                  <s-table-header listSlot="primary">Video</s-table-header>
                  <s-table-header listSlot="kicker">Status</s-table-header>
                  <s-table-header format="numeric">Views</s-table-header>
                  <s-table-header format="numeric">Orders</s-table-header>
                  <s-table-header format="currency" listSlot="secondary">
                    Revenue
                  </s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {topVideos.map((video) => (
                    <s-table-row key={video.id}>
                      <s-table-cell>
                        {/* Tên + kênh trên MỘT dòng, cắt bằng "…" khi dài.
                            `lineClamp` chỉ có ở `s-paragraph` (không có ở `s-text` hay
                            `s-link`) nên cả dòng nằm trong một paragraph.
                            Dùng `s-grid` chứ KHÔNG dùng `s-stack direction="inline"`:
                            `s-paragraph` là block nên trong stack nó chiếm hết chiều
                            ngang và bị đẩy xuống dưới thumbnail. Cột `minmax(0, 1fr)`
                            mới cho phép co lại để `lineClamp` cắt được — `1fr` trơn
                            có min-width auto nên text tràn thay vì cắt. */}
                        <s-grid
                          gap="small-100"
                          gridTemplateColumns="auto minmax(0, 1fr)"
                          alignItems="center"
                        >
                          <s-thumbnail src={thumb(video.id, 80)} alt={video.title} size="small" />
                          <s-paragraph lineClamp={1}>
                            <s-link href={`/app/library/${video.id}`}>
                              <s-text type="strong">{video.title}</s-text>
                            </s-link>{' '}
                            <s-text color="subdued">· {video.source}</s-text>
                          </s-paragraph>
                        </s-grid>
                      </s-table-cell>
                      <s-table-cell>
                        {/* Badge có TEXT, không chỉ dot màu (a11y — điều kiện BFS).
                            "Chưa tag product" là lỗi im lặng tệ nhất của app này nên
                            nó phải hiện ngay trong bảng, không chờ merchant tự tìm. */}
                        {video.products.length === 0 ? (
                          <s-badge tone="warning">No product tagged</s-badge>
                        ) : (
                          <s-badge tone="success">Published</s-badge>
                        )}
                      </s-table-cell>
                      {/* `no-sales-yet` thì view là THẬT (có người xem, chưa ai mua) —
                          đó chính là ý nghĩa của state đó. `justCompleted` thì vừa lên
                          storefront nên chưa có view nào. */}
                      <s-table-cell>
                        {justCompleted ? '0' : video.views.toLocaleString()}
                      </s-table-cell>
                      <s-table-cell>{noData ? '0' : String(video.orders)}</s-table-cell>
                      <s-table-cell>
                        {noData ? '—' : `$${video.revenue.toLocaleString()}`}
                      </s-table-cell>
                    </s-table-row>
                  ))}
                </s-table-body>
              </s-table>
            </s-stack>
          </s-section>
        )}

        {/* ══ 5. FIRST RUN — cho merchant thấy thứ mình sắp bán ══
            Thay cho empty state "No videos yet" với ô vuông trắng (nhìn như ảnh lỗi).
            App về video mà lần install đầu không có một pixel video nào là kỳ. */}
        {firstRun && (
          <s-section heading="Most used formats">
            <s-stack direction="block" gap="base">
              <s-paragraph color="subdued">
                These three cover most stores. Six formats in total — pick one in step 3 and change
                it any time.
              </s-paragraph>
              <s-grid gap="base" gridTemplateColumns="repeat(auto-fit, minmax(160px, 1fr))">
                {widgetPreviews.map((preview) => (
                  <s-stack key={preview.id} direction="block" gap="small-300">
                    {/* ⏳ PLACEHOLDER — chờ design cấp screenshot/video widget thật
                        trên storefront (Stella chốt 05 Aug 2026: giữ slot).
                        KHÔNG dùng ảnh stock random: bản trước để picsum, ra một cái
                        đồng hồ và một cái ruộng — team review nội dung thay vì layout.
                        Nhãn bên trong chỉ là "Preview": để "{label} preview" thì
                        "Floating player preview" wrap 2 dòng, ô thứ ba cao hơn hai ô
                        kia và lệch baseline cả hàng. Tên format đã có ngay dưới ô. */}
                    <s-box
                      background="subdued"
                      borderRadius="base"
                      border="base"
                      padding="large-300"
                      minBlockSize="140px"
                    >
                      <s-stack direction="block" gap="small-300" alignItems="center">
                        <s-icon type="play-circle" tone="neutral" />
                        <s-text color="subdued">Preview</s-text>
                      </s-stack>
                    </s-box>
                    <s-stack direction="block" gap="small-500">
                      <s-text type="strong">{preview.label}</s-text>
                      <s-text color="subdued">{preview.caption}</s-text>
                    </s-stack>
                  </s-stack>
                ))}
              </s-grid>

              {/* CTA sang Widgets để xem 3 format còn lại. Không liệt kê 6 cái ở đây:
                  Home không phải chỗ so sánh format, và 6 ô placeholder thì trang
                  first-run thành một bức tường xám. Ba cái phổ biến + một đường đi
                  tiếp là đủ để merchant không cảm thấy bị giới hạn. */}
              <s-button href="/app/widgets" icon="arrow-right">
                See all 6 formats
              </s-button>
            </s-stack>
          </s-section>
        )}
      </s-stack>

      {/* ══ ASIDE — s-page slot="aside", KHÔNG có Layout.Section oneThird ══ */}
      <s-stack slot="aside" direction="block" gap="base">
        {/* Thay tile "Live on store 0": con số 0 không nói merchant thiếu gì, còn
            bảng này nói thẳng surface nào chưa có widget. Tên surface dùng ĐÚNG tên
            chính thức của Shopify (MAKEUGC-UI-PATTERNS §5) — gọi Product page là
            "PDP" làm merchant tìm sai chỗ trong theme editor. */}
        <s-section heading="Store status">
          <s-stack direction="block" gap="small-200">
            {surfaces.map((row) => (
              <s-stack
                key={row.surface}
                direction="inline"
                gap="small-200"
                alignItems="center"
                justifyContent="space-between"
              >
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-icon
                    type={row.live ? 'check-circle' : 'circle'}
                    tone={row.live ? 'success' : 'neutral'}
                    size="small"
                  />
                  <s-text>{row.surface}</s-text>
                </s-stack>
                {row.live ? (
                  <s-text color="subdued">{row.videoCount} videos</s-text>
                ) : (
                  <s-badge tone="neutral">Not added</s-badge>
                )}
              </s-stack>
            ))}
            <s-button href="/app/widgets">Manage widgets</s-button>
          </s-stack>
        </s-section>

        {/* Credit nói ĐÚNG MỘT LẦN trên trang, và có BUTTON.
            Bản cũ: banner + tile "Credits left" + card Credits = 3 chỗ, không chỗ
            nào có button; đường upgrade là inline link giữa một đoạn 4 dòng.
            planGated ≠ quota-blocked: Free Forever không phải "hết credit", nó là
            "plan không có tính năng" → hai đường thoát khác nhau. */}
        {is('no-permission') ? (
          <s-section heading="AI Studio">
            <s-stack direction="block" gap="small-200" alignItems="start">
              <s-paragraph color="subdued">
                Generate videos with AI creators. Available on Growth and above.
              </s-paragraph>
              {/* Disable thì LUÔN kèm lý do — nhưng lý do phải là TEXT HIỆN SẴN.
                  ⚠️ Verify trong browser 05 Aug 2026: `interestFor` + `s-tooltip`
                  hoạt động trên trigger thường (label KpiTile mở được), nhưng KHÔNG
                  hoạt động trên `s-button disabled` — browser không dispatch pointer
                  event lên control disabled, nên tooltip không bao giờ mở. Keyboard
                  cũng không tới được control disabled. Dựa vào tooltip ở đây là để
                  merchant bấm vào một nút chết mà không biết vì sao. */}
              <s-button disabled>Compare plans</s-button>
              <s-text color="subdued">
                Only the store owner and staff with billing access can change plans or spend AI
                credits.
              </s-text>
            </s-stack>
          </s-section>
        ) : (
          <CreditMeter
            /* Tỉ lệ, không phải số cứng: allowance Growth đổi 50 → 500 (khớp Notion
               Pricing proposal) làm mọi con số viết cho nền 50 sai nghĩa ngay — "38 đã
               dùng" trên nền 500 là meter gần rỗng. */
            used={
              is('quota-blocked')
                ? GROWTH.credits
                : Math.round(GROWTH.credits * (is('job-processing', 'job-failed') ? 0.86 : 0.76))
            }
            total={GROWTH.credits}
            resetDate="1 September"
            planName={paidPlan ? GROWTH.name : 'Free Forever'}
            nextPlan={{name: SCALE.name, credits: SCALE.credits}}
            planGated={!paidPlan}
          />
        )}
      </s-stack>
    </s-page>
  );
}

/**
 * Action zone — vùng "việc merchant PHẢI xử lý", tối đa MỘT thứ.
 *
 * Thứ tự ưu tiên là thứ tự thiệt hại: trang vỡ > job đang chạy > shopper không mua
 * được > shopper không thấy gì > không đủ quyền. Xếp sai thứ tự thì merchant xử lý
 * việc nhỏ trước việc đang mất tiền.
 *
 * Bản cũ không có vùng này: banner duy nhất là quảng cáo plan, còn job async thì
 * Home im lặng hoàn toàn dù generate mất vài phút.
 */
function ActionZone({
  state,
  untaggedCount,
}: {
  state: string;
  untaggedCount: number;
}) {
  /**
   * HARNESS — công tắc "Simulate running AI job" ở top bar.
   *
   * Home cố ý KHÔNG hiện banner gọn toàn cục (để không nói một chuyện hai lần), nên nếu
   * Home cũng không hiện card chi tiết thì bật công tắc rồi bấm "View progress" là rơi
   * vào một trang trống — nút trông như hỏng. Bắt được 06 Aug 2026.
   *
   * Chỉ ghi đè khi state hiện tại KHÔNG phải state job, để không đá vào việc review
   * `job-failed`. Trong app thật không có nhánh này.
   */
  const harnessJob = useContext(HarnessJobContext);
  if (harnessJob && !state.startsWith('job-')) {
    state = 'job-processing';
  }

  if (state === 'error') {
    return (
      <s-banner tone="critical" heading="Couldn't load your dashboard">
        {/* Nói rõ cái gì KHÔNG bị ảnh hưởng — merchant sợ nhất là mất data */}
        <s-paragraph>
          We couldn&apos;t reach the tracking service. Your videos are still live and sales are
          still being recorded — only this page is affected.
        </s-paragraph>
        <s-button slot="secondary-actions">Retry</s-button>
        <s-button slot="secondary-actions" href="#" target="_blank">
          Contact support
        </s-button>
      </s-banner>
    );
  }

  if (state === 'job-processing') {
    // Job phải nhìn thấy được TỪ HOME và survive reload — merchant bấm generate ở
    // AI Studio rồi đi chỗ khác, quay lại phải biết nó còn chạy.
    return (
      <JobProgress
        status="processing"
        title="Generating 5 AI videos"
        done={3}
        total={5}
        etaLabel="~2 min left"
        onCancel={() => {}}
      />
    );
  }

  if (state === 'job-failed') {
    return (
      <JobProgress
        status="failed"
        title="Generating 5 AI videos"
        total={5}
        errorMessage="The AI provider rejected the script — it mentions a competitor brand name, which isn't allowed."
        creditNote="5 credits refunded"
        onRetry={() => {}}
      />
    );
  }

  if (state === 'no-permission') {
    return (
      <s-banner tone="warning" heading="You have limited access">
        <s-paragraph>
          You can add videos and view performance, but only staff with billing access can change
          plans or spend AI credits. Ask your store owner for access.
        </s-paragraph>
      </s-banner>
    );
  }

  if (state === 'widget-not-in-theme') {
    return (
      <s-banner tone="warning" heading="Your videos aren't visible to shoppers yet">
        {/* Đây là trạng thái tệ nhất mà app hiện tại không hề báo: video đã publish,
            merchant tưởng xong, nhưng theme chưa có app block nên storefront trống. */}
        <s-paragraph>
          You have published videos, but the MakeUGC widget isn&apos;t in your theme yet. Add the
          block once and every published video shows up on your storefront.
        </s-paragraph>
        {/* In real app: deep link theme editor
            /admin/themes/current/editor?context=apps&addAppBlockId={UUID}/{handle} */}
        <s-button slot="secondary-actions" href="/app/widgets">
          Add widget to theme
        </s-button>
      </s-banner>
    );
  }

  if (state === 'untagged' && untaggedCount > 0) {
    return (
      <s-banner tone="warning" heading={`${untaggedCount} live videos have no product tagged`}>
        <s-paragraph>
          Shoppers can watch these videos but can&apos;t buy anything from them. Tagging a product
          is what turns a view into an order.
        </s-paragraph>
        <s-button slot="secondary-actions" href="/app/library">
          Tag products
        </s-button>
      </s-banner>
    );
  }

  return null;
}
