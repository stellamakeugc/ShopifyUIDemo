/**
 * MOCKUP — Widgets (index). Vẽ lại 06 Aug 2026 theo screenshot app thật.
 *
 * Bản trước là IA cũ: MỘT trang "Player settings" toàn cục, format là một radio cho cả
 * store. App thật thì merchant tạo **nhiều widget**, mỗi widget = 1 template + 1 tên +
 * 1 playlist riêng — và index của app hiện **chỉ có empty state**, không có chỗ nào quản
 * lý tổng. Đó là phần chính của lần vẽ lại này (Stella, 06 Aug 2026).
 *
 * Ba lỗi im lặng của trang này, cả ba đều được nói thành badge + lý do trên từng thẻ:
 *   1. widget 0 video  → shopper thấy khoảng trống, app hiện KHÔNG cảnh báo gì
 *   2. chưa add block  → settings đẹp nhưng không ai xem được
 *   3. chưa sync       → storefront đang hiện bản CŨ, app cũng không cảnh báo gì
 *
 * Route file thật: app/routes/app.widgets._index.tsx
 */
import {useState} from 'react';

import StateSwitcher from '../components/StateSwitcher';
import type {StateOption} from '../components/StateSwitcher';
import {EmptyState, SurfacePills, WidgetShape} from '../components/primitives';
import {
  PLANS,
  playlistFor,
  templateFor,
  thumb,
  videos,
  widgetList,
  widgetTemplates,
  widgetsOverload,
} from '../data/sample';
import type {Widget, WidgetTemplate} from '../data/sample';

/**
 * Hạn chọn sau khi downgrade. Hardcode vì mockup không được gọi `Date.now()` — app thật
 * lấy từ ngày kết thúc chu kỳ billing của Shopify.
 */
const KEEP_DEADLINE = '3 September';

const STATES: StateOption[] = [
  {
    value: 'default',
    label: 'Default — 6 widget, sức khoẻ lẫn lộn',
    doc: [
      {
        section: 'Grid',
        rule: 'Widget cần xử lý luôn xếp TRƯỚC widget Ready. Trang này là danh sách việc-cần-làm, không phải kho chứa.',
      },
      {
        section: 'Badge',
        rule: 'Mỗi widget đúng MỘT badge, ưu tiên: 0 video › chưa set up › Ready. Nói nhiều lỗi cùng lúc thì không lỗi nào được sửa.',
      },
    ],
  },
  {
    value: 'empty',
    label: 'Empty — 0 widget, chọn template ngay tại chỗ',
    doc: [
      {
        section: 'Empty state',
        rule: 'Template hiện INLINE, không nấp sau modal: đây là lúc merchant cần đà nhất, bắt bấm thêm một nút để mở đúng thứ đang trống là thừa.',
      },
      {
        section: 'Header',
        rule: 'Nút "New widget" vẫn còn ở header nhưng KHÔNG lặp thành nút thứ hai giữa trang — app thật có 3 cửa vào cùng một modal.',
      },
    ],
  },
  {
    value: 'first-widget',
    label: 'First widget — vừa tạo, 0 video, chưa set up',
    doc: [
      {
        section: 'Toàn trang',
        rule: 'State activation chết. Merchant tạo xong widget và tưởng đã xong — thẻ phải nói thẳng còn thiếu HAI bước và bước nào trước.',
      },
      {
        section: 'Banner',
        rule: 'Banner đếm đúng số widget chưa tới được shopper, không dùng tone success cho việc chưa xong.',
      },
    ],
  },
  {value: 'all-ready', label: 'All ready — không widget nào cần xử lý'},
  {
    value: 'no-videos',
    label: 'No videos — widget rỗng vẫn add to theme được',
    doc: [
      {
        section: 'Thẻ',
        rule: 'Widget 0 video là lỗi im lặng NẶNG nhất: block nằm trong theme, shopper thấy khoảng trắng. App thật không hề cảnh báo.',
      },
    ],
  },
  {
    value: 'not-set-up',
    label: 'Not set up — chưa thêm block vào theme',
    doc: [
      {
        section: 'Badge',
        rule: '"Not set up" = merchant chưa bấm Add to theme bao giờ. KHÔNG được đọc là "block không có trong theme" — app không detect được điều đó.',
      },
    ],
  },
  {
    value: 'theme-unsupported',
    label: 'Theme unsupported — theme Online Store 1.0',
    doc: [
      {
        section: 'Banner',
        rule: 'Mọi nút "Add to theme" disabled kèm lý do bằng TEXT HIỆN SẴN — tooltip không mở trên control disabled (patterns §7a).',
      },
    ],
  },
  {
    value: 'overload',
    label: 'Overload — 24 widget, filter xuất hiện',
    doc: [
      {
        section: 'Filter',
        rule: 'Search + select chỉ hiện khi >8 widget. Control lọc mà không lọc gì là nhiễu, nên dưới ngưỡng đó trang cố ý KHÔNG có filter.',
      },
      {
        section: 'Empty',
        rule: 'Lọc không ra thì dùng nhánh no-search-result của EmptyState, KHÔNG dạy lại "create your first widget".',
      },
    ],
  },
  {
    value: 'no-permission',
    label: 'No permission — chỉ xem được',
    doc: [
      {
        section: 'Mọi action',
        rule: 'Disable chứ không ẩn, và lý do là text hiện sẵn dưới nút — staff không hiểu vì sao mình không thấy nút là tệ hơn.',
      },
    ],
  },
  {
    value: 'widget-limit-reached',
    label: 'Limit reached — Starter, 3/3 widget',
    doc: [
      {
        section: 'Banner',
        rule: 'Nói CON SỐ cụ thể (3/3) và cả hai đường ra: upgrade hoặc xoá widget không dùng.',
      },
      {
        section: 'New widget',
        rule: 'Disabled kèm lý do hiện sẵn cạnh nút, không phải tooltip.',
      },
      {section: '⏳ Chờ', rule: 'widgetLimit mỗi plan là ĐỀ XUẤT — xem sample.ts → PLANS.'},
    ],
  },
  {
    value: 'downgraded',
    label: 'Downgraded — vượt trần, chọn cái nào chạy',
    doc: [
      {
        section: 'Mô hình',
        rule: 'Plan CHỈ gate số lượng widget, KHÔNG gate format (Stella chốt 06 Aug 2026). Free được 1 widget nhưng chọn template nào cũng được → không có khái niệm "template ngoài plan".',
      },
      {
        section: 'Nguyên tắc',
        rule: 'App KHÔNG BAO GIỜ tự xoá. Vượt trần thì widget thừa chỉ TẠM DỪNG — vẫn đủ playlist và design, bật lại miễn phí, upgrade là sống lại hết. Trả lời câu "khách cố tình không action thì sao": không sao cả, còn 1 widget chạy, không mất gì.',
      },
      {
        section: 'Vì sao không hold hết',
        rule: 'Tắt sạch cả 6 là phạt merchant vì không thao tác — họ mất doanh thu của cả 6 thay vì giữ được 1. Không-làm-gì phải có kết quả hợp lý, không phải hình phạt.',
      },
      {
        section: 'Thẻ',
        rule: 'Vượt trần thì badge đổi sang Live/Paused — lúc merchant đang phải chọn, "đang chạy hay không" là thông tin duy nhất đáng đọc, badge sức khoẻ (0 video / chưa set up) không giúp gì.',
      },
      {
        section: 'Surface trống',
        rule: 'Widget tạm dừng nhưng block vẫn nằm trong theme → chỗ đó trống. Banner phải liệt kê ĐÚNG surface nào sắp hụt, đừng để merchant tự phát hiện bằng cách mở storefront.',
      },
      {
        section: 'Modal',
        rule: 'KHÔNG dùng tone critical: không xoá gì, chỉ đổi cái nào chạy. Dùng tone destructive cho việc đảo ngược được làm merchant do dự đúng ở bước cuối.',
      },
    ],
  },
];

function planNameFor(planId: string) {
  return PLANS.find((plan) => plan.id === planId)?.name ?? planId;
}

/**
 * Trạng thái của MỘT widget — đúng một badge, theo thứ tự thiệt hại giảm dần.
 *
 * Vì sao không hiện nhiều badge cùng lúc: thẻ nói 3 lỗi thì merchant không sửa lỗi nào.
 * Sửa xong cái nặng nhất thì cái sau tự hiện ra.
 */
type WidgetStatus = {
  key: 'no-videos' | 'not-set-up' | 'ready';
  label: string;
  tone: 'critical' | 'warning' | 'caution' | 'success';
  /** Lý do + việc cần làm, hiện thành TEXT trên thẻ (không phải tooltip) */
  reason: string;
};

function statusFor(widget: Widget): WidgetStatus {
  if (widget.videoCount === 0) {
    return {
      key: 'no-videos',
      label: 'No videos',
      tone: 'warning',
      reason: 'Shoppers see an empty space until you add videos to this widget.',
    };
  }
  if (!widget.setUpInTheme) {
    return {
      key: 'not-set-up',
      label: 'Not set up',
      tone: 'warning',
      reason: "You haven't added this widget's block to your theme yet, so nobody can see it.",
    };
  }
  return {
    key: 'ready',
    label: 'Ready',
    tone: 'success',
    reason: '',
  };
}

/** Widget cần merchant làm gì đó — dùng cho thứ tự sắp xếp và filter */
function needsAttention(status: WidgetStatus) {
  return status.key !== 'ready';
}

/**
 * "Chưa tới được shopper" KHÁC "cần xử lý".
 *
 * Widget dùng template ngoài plan vẫn ĐANG CHẠY trên storefront — gộp nó vào con số
 * "aren't reaching shoppers" là nói sai sự thật (bắt được lúc verify state `downgraded`).
 * Nó cần xử lý, nhưng vì lý do khác và có banner riêng.
 */
function notReachingShoppers(status: WidgetStatus) {
  return status.key === 'no-videos' || status.key === 'not-set-up';
}

/** Data của từng state. Đổi state là dựng lại list, không vá từng field rải rác */
function widgetsForState(state: string): Widget[] {
  switch (state) {
    case 'empty':
    case 'plan-gated-template':
      return [];
    case 'first-widget':
      return [
        {
          id: 'w-new',
          name: 'My Product page stories',
          templateId: 'product-stories',
          videoCount: 0,
          setUpInTheme: false,
          updatedAt: 'just now',
          widgetId: 'cmx90ffbb0005qsywh2md6ta1',
        },
      ];
    case 'all-ready':
      return widgetList.map((widget) => ({
        ...widget,
        videoCount: widget.videoCount || 7,
        setUpInTheme: true,
      }));
    case 'no-videos':
      return widgetList.map((widget) => ({...widget, videoCount: 0}));
    case 'not-set-up':
      return widgetList.map((widget) => ({...widget, setUpInTheme: false}));
    case 'overload':
      return widgetsOverload;
    case 'widget-limit-reached':
      // Free Forever cho ĐÚNG 1 widget → 1 widget khoẻ là đã đụng trần
      return widgetList.slice(0, 1).map((widget) => ({
        ...widget,
        videoCount: widget.videoCount || 7,
        setUpInTheme: true,
      }));
    case 'downgraded':
      // 6 widget khoẻ, plan mới chỉ cho 1 → merchant phải chọn
      return widgetList.map((widget) => ({
        ...widget,
        videoCount: widget.videoCount || 7,
        setUpInTheme: true,
      }));
    default:
      return widgetList;
  }
}

/**
 * Plan của từng state review.
 *
 * ⚠️ Theo pricing thật (Notion → Tactic 2): **CHỈ Free Forever bị gate** — 1 widget +
 * 5 video. Starter/Growth/Scale đều unlimited widget. Nên mọi state đụng trần đều phải
 * là `free`; gán `starter` là banner không bao giờ hiện (Starter `widgetLimit: null`).
 */
function planForState(state: string) {
  if (state === 'widget-limit-reached' || state === 'downgraded' || state === 'first-widget') {
    return 'free';
  }
  return 'scale';
}

export default function WidgetsIndex() {
  const [state, setState] = useState('default');
  const [widgets, setWidgets] = useState<Widget[]>(() => widgetsForState('default'));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Modal tạo widget: MỘT modal hai bước (app thật dùng hai modal rời + nút Back)
  const [step, setStep] = useState<'template' | 'name'>('template');
  const [chosenTemplate, setChosenTemplate] = useState<WidgetTemplate | null>(null);
  const [newName, setNewName] = useState('');
  const [target, setTarget] = useState<Widget | null>(null);
  /**
   * ID widget đang CHẠY khi vượt trần plan. `null` = mặc định của app.
   *
   * Vì sao là "đang chạy" chứ không phải "được giữ": app **không bao giờ tự xoá**. Vượt
   * trần thì widget thừa chỉ **tạm dừng** — vẫn đủ playlist và design, bật lại miễn phí,
   * upgrade là sống lại hết. Không có hành động nào không hoàn tác được, và merchant
   * không-làm-gì thì vẫn còn 1 widget chạy chứ không mất sạch (Stella hỏi 06 Aug 2026:
   * "khách cố tình không action thì sao?").
   */
  const [activeIds, setActiveIds] = useState<string[] | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function changeState(next: string) {
    setState(next);
    setWidgets(widgetsForState(next));
    setSearch('');
    setStatusFilter('all');
    setActiveIds(null);
  }

  const planId = planForState(state);
  const plan = PLANS.find((entry) => entry.id === planId);
  const limit = plan?.widgetLimit ?? null;
  const readOnly = state === 'no-permission';
  const themeUnsupported = state === 'theme-unsupported';

  const atLimit = limit !== null && widgets.length >= limit;
  const overLimit = limit !== null && widgets.length > limit;
  // Mặc định khi merchant chưa chọn: giữ chạy `limit` widget đầu danh sách (mới sửa nhất)
  const running = activeIds ?? widgets.slice(0, limit ?? widgets.length).map((w) => w.id);
  const isRunning = (widget: Widget) => !overLimit || running.includes(widget.id);

  // Filter chỉ tồn tại khi thật sự có gì để lọc — xem doc của state `overload`
  const showFilters = widgets.length > 8;

  const decorated = widgets.map((widget) => ({
    widget,
    status: statusFor(widget),
  }));

  const attentionCount = decorated.filter((row) => needsAttention(row.status)).length;
  const notReachingCount = decorated.filter((row) => notReachingShoppers(row.status)).length;

  const filtered = decorated
    .filter((row) => {
      if (!showFilters) return true;
      const matchesSearch = row.widget.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'attention' && needsAttention(row.status)) ||
        (statusFilter === 'ready' && row.status.key === 'ready');
      return matchesSearch && matchesStatus;
    })
    // Cần xử lý lên trước: trang là danh sách việc-cần-làm, không phải kho chứa
    .sort((a, b) => Number(needsAttention(b.status)) - Number(needsAttention(a.status)));

  const isFiltering = showFilters && (search !== '' || statusFilter !== 'all');

  function openCreate() {
    setStep('template');
    setChosenTemplate(null);
    setNewName('');
  }

  function pickTemplate(template: WidgetTemplate) {
    setChosenTemplate(template);
    // Tiền tố "My" theo đúng app thật ("My PDP Stories"). Không để mặc định trùng y
    // hệt tên template: thẻ sẽ in cùng một chuỗi hai lần (nhãn glyph + tiêu đề).
    setNewName(`My ${template.name}`);
    setStep('name');
  }

  function createWidget() {
    if (!chosenTemplate || !newName.trim()) return;
    // In real app: shopify.toast.show('Widget created')
    setWidgets((current) => [
      {
        id: `w-${current.length + 1}-new`,
        name: newName.trim(),
        templateId: chosenTemplate.id,
        videoCount: 0,
        setUpInTheme: false,
        widgetId: `cm${current.length}new0000qsywzz${current.length}kd8mz3`,
        updatedAt: 'just now',
      },
      ...current,
    ]);
  }

  function addToTheme(widget: Widget) {
    // In real app: deep link theme editor
    // `/admin/themes/current/editor?context=apps&addAppBlockId=${EXTENSION_UUID}/${BLOCK_HANDLE}`
    // ⏳ Cần Duong: deep link này có preset sẵn widget ID không, hay merchant vẫn phải
    // dán tay chuỗi cuid như tab Setup của app đang bắt làm?
    setWidgets((current) =>
      current.map((entry) => (entry.id === widget.id ? {...entry, setUpInTheme: true} : entry)),
    );
  }

  function duplicate(widget: Widget) {
    setWidgets((current) => [
      {
        ...widget,
        id: `${widget.id}-copy`,
        name: `${widget.name} copy`,
        setUpInTheme: false,
        widgetId: `${widget.widgetId}copy`,
        updatedAt: 'just now',
      },
      ...current,
    ]);
  }

  function confirmRename() {
    if (!target || !renameValue.trim()) return;
    setWidgets((current) =>
      current.map((entry) =>
        entry.id === target.id ? {...entry, name: renameValue.trim()} : entry,
      ),
    );
  }

  function confirmDelete() {
    if (!target) return;
    setWidgets((current) => current.filter((entry) => entry.id !== target.id));
  }

  return (
    <s-page heading="Widgets">
      {/* Không có Credits pill: widget KHÔNG tiêu credit nào. App thật để nó ở đây,
          nhắc credit ở trang không liên quan chỉ làm loãng con số ở AI Studio. */}
      <s-button
        slot="primary-action"
        variant="primary"
        disabled={readOnly || atLimit}
        command="--show"
        commandFor="new-widget"
        onClick={openCreate}
      >
        New widget
      </s-button>

      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={changeState}
          states={STATES}
          globalNote={
            <s-stack direction="block" gap="small-300">
              <strong>Chỗ mockup đi trước app</strong>
              <s-paragraph color="subdued">
                Grid quản lý widget, badge trạng thái và toàn bộ gate theo plan là THIẾT KẾ MỚI —
                index của app thật chỉ có empty state. Giá trị gate (`widgetLimit`,
                `minPlan` trong `sample.ts`) là đề xuất, chưa phải pricing đã chốt.
              </s-paragraph>
              <s-paragraph color="subdued">
                Nút “Edit design” trỏ sang trang widget detail — trang đó là lần chạy sau, trong
                harness bấm vào sẽ rơi về index mockup.
              </s-paragraph>
            </s-stack>
          }
        />

        {/* ══ BANNER: widget chưa tới được shopper ══
            Chỉ hiện khi CÓ vấn đề. State all-ready cố ý không có banner nào —
            banner "mọi thứ ổn" là thứ merchant học cách bỏ qua. */}
        {notReachingCount > 0 && (
          <s-banner
            tone="warning"
            heading={
              widgets.length === 1
                ? "Your widget isn't reaching shoppers yet"
                : `${notReachingCount} of your ${widgets.length} widgets ${notReachingCount === 1 ? "isn't" : "aren't"} reaching shoppers`
            }
          >
            <s-paragraph>
              A widget only shows on your storefront when it has videos and its block is in your
              theme. Each card below says which step is missing.
            </s-paragraph>
          </s-banner>
        )}

        {/* ══ SAU DOWNGRADE — phải CHỌN cái để giữ ══
            Plan chỉ gate SỐ LƯỢNG, không gate format (Stella chốt 06 Aug 2026). Nên sau khi
            hạ plan, việc cần làm không phải "upgrade lại" mà là **chọn giữ cái nào**.

            Ba thứ giữ cho luồng này không gây ức chế:
             1. KHÔNG tắt gì ngay. Mọi widget chạy tiếp tới hạn — merchant có thời gian.
             2. Có MẶC ĐỊNH. Không chọn thì app giữ cái mới sửa gần nhất, nói trước là cái
                nào, nên không ai bị kẹt hay mất thứ mình không ngờ.
             3. Nói rõ cái mất là CẤU HÌNH widget, video vẫn ở Library. */}
        {overLimit && (
          <s-banner
            tone="critical"
            heading={`${planNameFor(planId)} runs ${limit} ${limit === 1 ? 'widget' : 'widgets'} — choose which stays live`}
          >
            {/* Bọc trong s-stack có gap: hai `s-paragraph` liền nhau trong s-banner render
                sát nhau, đọc ra như một khối. Đoạn 2 là thông tin KHÁC (chuyện gì xảy ra nếu
                không chọn) nên phải tách khỏi đoạn 1 bằng khoảng trắng. */}
            <s-stack direction="block" gap="small">
              <s-paragraph>
                All {widgets.length} keep running until <strong>{KEEP_DEADLINE}</strong>.
                After that {limit} stays live and the rest pause — nothing is deleted, and you
                can swap any time.
              </s-paragraph>
              {/* KHÔNG liệt kê surface ở đây: mỗi thẻ đã có pill surface của chính nó, nói
                  lại thành một danh sách gộp là lặp và làm banner dài gấp đôi. */}
              <s-paragraph color="subdued">
                No choice by then? We keep <strong>{widgets[0]?.name}</strong>, your most recent
                edit. Paused widgets leave a gap where their block sits — remove those in your
                theme editor.
              </s-paragraph>
            </s-stack>
            <s-button slot="secondary-actions" href="/app/billing">
              Keep my plan instead
            </s-button>
          </s-banner>
        )}

        {/* Đụng trần plan — nói CON SỐ và cả hai đường ra.
            Chỉ hiện khi KHÔNG có widget nào đang hỏng: nếu widget hiện tại còn chưa tới
            được shopper thì "bạn không tạo thêm được" không phải việc tiếp theo, và nó
            đẩy việc thật xuống dưới. Bắt được ở state `first-widget`: merchant vừa tạo
            widget đầu tiên thì được báo ngay là đã hết quota, trước cả khi biết widget
            đó chưa có video. */}
        {atLimit && !overLimit && attentionCount === 0 && (
          <s-banner
            tone="warning"
            heading={`You're using all ${limit} ${limit === 1 ? 'widget' : 'widgets'} on ${planNameFor(planId)}`}
          >
            <s-paragraph>
              Upgrade to create more, or delete a widget you&apos;re not using. Deleting one
              doesn&apos;t remove its videos from your Library.
            </s-paragraph>
            <s-button slot="secondary-actions" href="/app/billing">
              Compare plans
            </s-button>
          </s-banner>
        )}

        {themeUnsupported && (
          <s-banner tone="critical" heading="Your current theme doesn't support app blocks">
            <s-paragraph>
              Themes built before Online Store 2.0 can&apos;t use app blocks, so widgets
              can&apos;t be added to your theme. You can still create and fill widgets — they go
              live once you switch to a supported theme.
            </s-paragraph>
            <s-button slot="secondary-actions" href="#" target="_blank">
              View compatible themes
            </s-button>
          </s-banner>
        )}

        {readOnly && (
          <s-banner tone="info" heading="You have view-only access">
            <s-paragraph>
              Creating, editing and deleting widgets needs staff access to this app. Ask the store
              owner to give you access.
            </s-paragraph>
          </s-banner>
        )}

        {/* ══ 0 WIDGET: chọn template ngay tại chỗ, không nấp sau modal ══ */}
        {widgets.length === 0 ? (
          <s-section heading="Create your first widget">
            <s-stack direction="block" gap="base">
              <s-paragraph color="subdued">
                Pick a template for where you want videos to appear. You can rename it, change its
                design, and add videos afterwards.
              </s-paragraph>
              <TemplateGrid
                planId={planId}
                disabled={readOnly}
                onPick={pickTemplate}
                openModal
              />
            </s-stack>
          </s-section>
        ) : (
          <s-section heading="Your widgets">
            <s-stack direction="block" gap="base">
              {/* Cố ý KHÔNG lặp lại "N need attention" ở đây: banner ngay phía trên đã
                  nói đúng con số đó bằng lời mạnh hơn. Dòng này là kiểm kê, banner là
                  báo động — nói hai lần thì merchant học cách bỏ qua cả hai. */}
              <s-text color="subdued">
                {widgets.length} {widgets.length === 1 ? 'widget' : 'widgets'}
                {limit !== null ? ` · ${planNameFor(planId)} includes ${limit}` : ''}
              </s-text>

              {/* Filter chỉ tồn tại khi có gì để lọc — dưới 9 widget thì nó là nhiễu */}
              {showFilters && (
                // `s-stack direction="inline"` KHÔNG dùng được ở đây: s-search-field và
                // s-select đều tự giãn full width nên hai control rơi xuống hai dòng
                // riêng, đẩy grid xuống tận dưới. s-grid ràng được tỉ lệ cột.
                <s-grid gap="small" gridTemplateColumns="minmax(0, 2fr) minmax(0, 1fr)">
                  <s-search-field
                    label="Search widgets"
                    value={search}
                    placeholder="Search by name"
                    onInput={(event) => setSearch(event.currentTarget.value)}
                  />
                  <s-select
                    label="Show"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.currentTarget.value)}
                  >
                    <s-option value="all">All widgets</s-option>
                    <s-option value="attention">Needs attention</s-option>
                    <s-option value="ready">Ready</s-option>
                  </s-select>
                </s-grid>
              )}

              {filtered.length === 0 ? (
                <EmptyState
                  isEmptyState={!isFiltering}
                  heading="No widgets yet"
                  body="Create a widget to start showing videos on your storefront."
                  resourceName="widgets"
                />
              ) : (
                <s-grid gap="base" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))">
                  {filtered.map(({widget, status}) => (
                    <WidgetCard
                      key={widget.id}
                      widget={widget}
                      status={status}
                      readOnly={readOnly}
                      themeUnsupported={themeUnsupported}
                      overLimit={overLimit}
                      running={isRunning(widget)}
                      onKeep={() => setTarget(widget)}
                      onAddToTheme={() => addToTheme(widget)}
                      onDuplicate={() => duplicate(widget)}
                      onRename={() => {
                        setTarget(widget);
                        setRenameValue(widget.name);
                      }}
                      onDelete={() => setTarget(widget)}
                    />
                  ))}
                </s-grid>
              )}

              {/* Nói MỘT lần cho cả grid, không lặp trên từng thẻ.
                  Đây là giới hạn thật của app: không detect được theme block. */}
              <s-text color="subdued">
                “Ready” means the widget has videos and you&apos;ve added it to your theme. Your
                storefront updates on its own whenever you save. We can&apos;t detect theme blocks
                automatically — open your storefront to confirm what shoppers see.
              </s-text>
            </s-stack>
          </s-section>
        )}
      </s-stack>

      {/* ══ MODAL: tạo widget — MỘT modal, hai bước ══
          App thật dùng hai modal rời có nút Back. Gộp lại thì Back là chuyện tự nhiên
          và không phải đồng bộ hai accessibilityLabel. */}
      <s-modal
        id="new-widget"
        heading={step === 'template' ? 'Choose a template' : 'Name your widget'}
        accessibilityLabel={step === 'template' ? 'Choose a template' : 'Name your widget'}
      >
        {step === 'template' ? (
          <s-stack direction="block" gap="base">
            <s-paragraph color="subdued">
              Each template decides where the widget can appear on your storefront.
            </s-paragraph>
            <TemplateGrid planId={planId} disabled={false} onPick={pickTemplate} />
          </s-stack>
        ) : (
          <s-stack direction="block" gap="base">
            {chosenTemplate && (
              <s-box background="subdued" border="base" borderRadius="base" padding="small">
                <s-stack direction="block" gap="small-500">
                  <s-heading>{chosenTemplate.name}</s-heading>
                  <SurfacePills surfaces={chosenTemplate.surfaces} note={chosenTemplate.placementNote} />
                </s-stack>
              </s-box>
            )}
            <s-text-field
              label="Widget name"
              value={newName}
              required
              onInput={(event) => setNewName(event.currentTarget.value)}
              details="Only you see this name. It's how you tell widgets apart when you add videos from Library."
            />
          </s-stack>
        )}

        {step === 'name' && (
          <s-button
            slot="primary-action"
            variant="primary"
            command="--hide"
            commandFor="new-widget"
            onClick={createWidget}
          >
            Create widget
          </s-button>
        )}
        {step === 'name' && (
          <s-button slot="secondary-actions" onClick={() => setStep('template')}>
            Back
          </s-button>
        )}
        <s-button slot="secondary-actions" command="--hide" commandFor="new-widget">
          Cancel
        </s-button>
      </s-modal>

      {/* ══ MODAL: chọn widget nào chạy sau downgrade ══
          KHÔNG phải destructive: không xoá gì, chỉ đổi cái nào đang chạy. Nên tone
          thường, và câu chữ phải nói rõ là đảo ngược được — nếu không merchant sẽ do dự
          đúng ở bước cuối. */}
      <s-modal id="keep-widget" heading="Choose the live widget" accessibilityLabel="Choose which widget stays live">
        <s-stack direction="block" gap="small">
          <s-paragraph>
            Run <strong>{target?.name ?? 'this widget'}</strong> on your storefront?
          </s-paragraph>
          <s-paragraph color="subdued">
            The other {Math.max(0, widgets.length - 1)} pause. They keep their videos and design,
            stay in this list, and you can swap back whenever you like — nothing is deleted.
          </s-paragraph>
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          command="--hide"
          commandFor="keep-widget"
          onClick={() => target && setActiveIds([target.id])}
        >
          Run this one
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="keep-widget">
          Cancel
        </s-button>
      </s-modal>

      {/* ══ MODAL: rename ══ */}
      <s-modal id="rename-widget" heading="Rename widget" accessibilityLabel="Rename widget">
        <s-text-field
          label="Widget name"
          value={renameValue}
          required
          onInput={(event) => setRenameValue(event.currentTarget.value)}
          details="Changing the name doesn't affect your storefront."
        />
        <s-button
          slot="primary-action"
          variant="primary"
          command="--hide"
          commandFor="rename-widget"
          onClick={confirmRename}
        >
          Save
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="rename-widget">
          Cancel
        </s-button>
      </s-modal>

      {/* ══ MODAL: xoá — nói SỐ LƯỢNG + hậu quả ══
          Câu thứ hai là thứ app thật không nói: block vẫn nằm trong theme sau khi xoá
          widget, và chỗ đó sẽ trống. */}
      <s-modal id="delete-widget" heading="Delete widget" accessibilityLabel="Delete widget">
        <s-stack direction="block" gap="small">
          <s-paragraph>
            Delete <strong>{target?.name ?? 'this widget'}</strong>?
          </s-paragraph>
          <s-paragraph color="subdued">
            Its playlist has {target?.videoCount ?? 0}{' '}
            {target?.videoCount === 1 ? 'video' : 'videos'}. The videos stay in your Library.
          </s-paragraph>
          <s-paragraph color="subdued">
            If you already added this widget to your theme, that spot will show nothing until you
            remove the block in the theme editor.
          </s-paragraph>
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          tone="critical"
          command="--hide"
          commandFor="delete-widget"
          onClick={confirmDelete}
        >
          Delete widget
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="delete-widget">
          Cancel
        </s-button>
      </s-modal>
    </s-page>
  );
}

/**
 * Lưới template dùng ở HAI chỗ: empty state (inline) và modal tạo widget.
 *
 * Template ngoài plan KHÔNG bị ẩn — ẩn thì merchant tưởng app không có tính năng đó
 * (`ENTERPRISE-UX-CHECKLIST.md` §2). Hiện đủ mô tả + badge plan + lý do bằng text.
 */
function TemplateGrid({
  planId,
  disabled,
  onPick,
  openModal,
}: {
  planId: string;
  disabled: boolean;
  onPick: (template: WidgetTemplate) => void;
  /** Ở empty state phải mở modal bước "đặt tên"; trong modal thì đã mở sẵn rồi */
  openModal?: boolean;
}) {
  // Chưa có widget nào thì lấy 4 video mới nhất của Library làm ví dụ — merchant vẫn
  // nhận ra nội dung của mình, và hình dạng mới đọc được
  const sampleThumbs = videos.slice(0, 4).map((video) => thumb(video.id, 120));

  return (
    <s-grid gap="small" gridTemplateColumns="repeat(auto-fill, minmax(260px, 1fr))">
      {widgetTemplates.map((template) => (
          <s-box
            key={template.id}
            border="base"
            borderRadius="base"
            padding="small"
            background="base"
          >
            {/* justifyContent space-between + blockSize 100% ghim footer xuống đáy →
                mọi thẻ cao bằng nhau dù mô tả dài ngắn khác nhau */}
            <s-stack direction="block" gap="small-200" blockSize="100%" justifyContent="space-between">
              <s-stack direction="block" gap="small-300">
                {/* Hình dạng đứng TRƯỚC chữ: merchant chọn template bằng mắt ("cái nào
                    trông giống thứ tôi muốn"), không phải bằng cách đọc 3 dòng mô tả */}
                <WidgetShape templateId={template.id} thumbs={sampleThumbs} />
                {/* KHÔNG icon: WidgetShape ngay trên đã nói template này là gì, bằng
                    hình dạng thật. Một icon chung chung đặt dưới đó chỉ nói lại điều vừa
                    nói, mà nói kém hơn. `s-heading` chứ không `s-text type="strong"` —
                    tên format LÀ tiêu đề của thẻ (Stella, 06 Aug 2026). */}
                <s-heading>{template.name}</s-heading>
                <s-paragraph color="subdued">{template.blurb}</s-paragraph>
                <SurfacePills surfaces={template.surfaces} note={template.placementNote} />
              </s-stack>

              <s-button
                disabled={disabled}
                command={openModal ? '--show' : undefined}
                commandFor={openModal ? 'new-widget' : undefined}
                onClick={() => onPick(template)}
              >
                Use this template
              </s-button>
            </s-stack>
          </s-box>
      ))}
    </s-grid>
  );
}

function WidgetCard({
  widget,
  status,
  readOnly,
  themeUnsupported,
  overLimit,
  running,
  onKeep,
  onAddToTheme,
  onDuplicate,
  onRename,
  onDelete,
}: {
  widget: Widget;
  status: WidgetStatus;
  readOnly: boolean;
  themeUnsupported: boolean;
  /** Đang vượt trần plan → thẻ hiện hành động chọn cái nào chạy */
  overLimit: boolean;
  /** Widget này có đang chạy trên storefront không (chỉ có nghĩa khi `overLimit`) */
  running: boolean;
  onKeep: () => void;
  onAddToTheme: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const template = templateFor(widget.templateId);
  const menuId = `menu-${widget.id}`;
  // Tối đa 4 thumbnail — đủ cho mọi hình dạng, và giữ payload nhẹ
  const thumbs = playlistFor(widget.name).slice(0, 4).map((video) => thumb(video.id, 120));

  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack direction="block" gap="small" blockSize="100%" justifyContent="space-between">
        <s-stack direction="block" gap="small-200">
          {/* Hình dạng thật của widget + thumbnail của CHÍNH playlist widget này.
              Bản trước là ô xám + tên template: merchant phải đọc tên rồi tự tưởng tượng,
              trong khi thứ phân biệt 6 template chính là hình dạng (Stella, 06 Aug 2026). */}
          <WidgetShape templateId={widget.templateId} thumbs={thumbs} />

          <s-stack direction="block" gap="small-500">
            {/* lineClamp chỉ có ở s-paragraph/s-heading — s-text không có (§7d) */}
            <s-heading>{widget.name}</s-heading>
            {/* Tên template dời xuống đây vì ô xám không còn chứa nó nữa */}
            <s-text color="subdued">{template.name}</s-text>
            <SurfacePills surfaces={template.surfaces} note={template.placementNote} />
          </s-stack>

          <s-stack direction="inline" gap="small-200" alignItems="center">
            {overLimit ? (
              // Vượt trần thì "đang chạy hay đang dừng" là thông tin duy nhất đáng đọc —
              // badge sức khoẻ (0 video / chưa set up) không giúp gì lúc merchant đang
              // phải chọn giữ cái nào
              <s-badge tone={running ? 'success' : 'neutral'}>
                {running ? 'Live' : 'Paused'}
              </s-badge>
            ) : (
              <s-badge tone={status.tone}>{status.label}</s-badge>
            )}
            <s-text color="subdued">
              {widget.videoCount} {widget.videoCount === 1 ? 'video' : 'videos'}
            </s-text>
          </s-stack>

          {/* Vượt trần thì KHÔNG viết lý do trên thẻ: badge đã nói Live/Paused, banner đã
              nói "nothing is deleted". Lặp câu đó trên cả 5 thẻ paused là nhiễu. */}
          {!overLimit && status.reason !== '' && (
            <s-paragraph color="subdued">{status.reason}</s-paragraph>
          )}
        </s-stack>

        <s-stack direction="block" gap="small-300">
          {/* Action chính = việc widget này ĐANG thiếu, không phải một nút Edit chung */}
          <s-stack direction="inline" gap="small-200" justifyContent="space-between" alignItems="center">
            {overLimit ? (
              // Vượt trần thì việc duy nhất đáng làm trên thẻ này là quyết định giữ hay
              // không — mọi action khác (add video, sync…) đều vô nghĩa nếu nó sắp bị xoá
              <s-button
                variant={running ? 'auto' : 'primary'}
                disabled={readOnly || running}
                command="--show"
                commandFor="keep-widget"
                onClick={onKeep}
              >
                {running ? 'Running now' : 'Run this one instead'}
              </s-button>
            ) : status.key === 'no-videos' ? (
              <s-button variant="primary" href="/app/library" disabled={readOnly}>
                Add videos
              </s-button>
            ) : status.key === 'not-set-up' ? (
              <s-button
                variant="primary"
                disabled={readOnly || themeUnsupported}
                onClick={onAddToTheme}
              >
                Add to theme
              </s-button>
            ) : (
              <s-button href={`/app/widgets/${widget.id}`} disabled={readOnly}>
                Edit design
              </s-button>
            )}

            <s-button
              variant="tertiary"
              icon="menu-horizontal"
              accessibilityLabel={`More actions for ${widget.name}`}
              command="--show"
              commandFor={menuId}
            />
          </s-stack>

          {themeUnsupported && status.key === 'not-set-up' && (
            <s-text color="subdued">
              Your theme doesn&apos;t support app blocks, so this can&apos;t be added yet.
            </s-text>
          )}
          {readOnly && (
            <s-text color="subdued">Only staff with app access can change widgets.</s-text>
          )}
        </s-stack>
      </s-stack>

      {/* s-menu chỉ nhận Button — mọi mục đều nối hành động thật, không có nút chết */}
      <s-menu id={menuId}>
        <s-button href={`/app/widgets/${widget.id}`}>Edit design</s-button>
        <s-button href="/app/library">Add videos</s-button>
        {/* Là LINK chứ không phải onClick: với widget đã set up rồi thì bấm onClick
            không đổi gì cả — một mục menu chết. Trong app thật nút này luôn mở theme
            editor, kể cả khi block đã có, để merchant thêm vào template khác hoặc kiểm
            tra lại. Bắt được lúc verify: bấm mục này trên widget "Ready" không ra gì.
            In real app: /admin/themes/current/editor?context=apps&addAppBlockId=... */}
        <s-button
          href="#theme-editor"
          target="_blank"
          disabled={readOnly || themeUnsupported}
        >
          Add to theme
        </s-button>
        <s-button disabled={readOnly} command="--show" commandFor="rename-widget" onClick={onRename}>
          Rename
        </s-button>
        <s-button disabled={readOnly} onClick={onDuplicate}>
          Duplicate
        </s-button>
        <s-button
          tone="critical"
          disabled={readOnly}
          command="--show"
          commandFor="delete-widget"
          onClick={onDelete}
        >
          Delete
        </s-button>
      </s-menu>
    </s-box>
  );
}
