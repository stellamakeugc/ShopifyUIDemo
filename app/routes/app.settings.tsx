/**
 * MOCKUP — Settings (vẽ lại 06 Aug 2026)
 *
 * 3 tab, theo app THẬT (Stella xác nhận 06 Aug 2026):
 *   Integrations       — app thứ ba tiêu thụ data MakeUGC (Triple Whale + …)
 *   Connections        — nối IG/TikTok để tự kéo video về
 *   Email notifications — email gửi merchant + email gửi customer
 *
 * ⚠️ SỬA MỘT GIẢ ĐỊNH SAI Ở TẦM KIẾN TRÚC: `MAKEUGC-UI-PATTERNS.md` §3 từng ghi
 * "nav KHÔNG có Settings", và cái sai đó lan ra — Home bị BỎ state `tw-disconnected`
 * vì "không biết Triple Whale connect ở đâu". Settings **có** trong nav → chặn đó đóng.
 *
 * Bản trước có 4 section: General · Integrations · Notifications · Staff access.
 * Bỏ `General` và `Staff access` vì:
 *   - `Attribution window` cho merchant tự vặn **north-star metric** của roadmap
 *     (attributed revenue) → sinh ticket "doanh thu tự đổi mà tôi không làm gì"
 *   - `Auto-publish imported videos` mô tả cơ chế app không có mô hình cho: §3d nói
 *     publish = gán TAY vào widget, nên "auto-publish" thì vào widget nào?
 *   - `Staff access` là section đề xuất, không nằm trong 3 tab của app. Câu hỏi
 *     enterprise §6 "ai được tiêu credit" KHÔNG bị xoá — nó chuyển sang `open[]`.
 *
 * Route file thật: app/routes/app.settings.tsx
 */
import {useState} from 'react';

import JobProgress from '../components/JobProgress';
import type {StateOption} from '../components/StateSwitcher';
import StateSwitcher from '../components/StateSwitcher';
import {EmptyState, TabBar} from '../components/primitives';
import type {Integration, SocialConnection} from '../data/sample';
import {PLANS, integrationCategories, integrations, socialConnections} from '../data/sample';

type TabId = 'integrations' | 'connections' | 'email';

const TABS: readonly {id: TabId; label: string}[] = [
  {id: 'integrations', label: 'Integrations'},
  {id: 'connections', label: 'Connections'},
  {id: 'email', label: 'Email notifications'},
];

const STATES: StateOption[] = [
  {
    value: 'default',
    label: 'Default — Triple Whale connected',
    doc: [
      {
        section: 'Cả trang',
        rule: 'Không có `slot="aside"`. Settings là single column — 3 tab là tab bar ngang, không phải sidebar. Bản cũ để section nav trong aside, ăn ~200px của 1200px cho 3 link.',
      },
      {
        section: 'Integrations',
        rule: 'Mỗi row phải nói DATA GÌ rời khỏi store trước khi merchant bấm Connect. Enterprise sẽ hỏi câu này, và hỏi trước khi connect chứ không phải sau.',
      },
    ],
  },
  {
    value: 'tw-not-connected',
    label: 'Triple Whale chưa connect (mặc định lúc launch)',
    doc: [
      {
        section: 'Integrations',
        rule: 'Đây là state MẶC ĐỊNH của mọi store mới. Roadmap dòng 17 ghi Triple Whale là **launch dependency** ("MVP has no native analytics"), và listing đã submit claim "connect Triple Whale for deeper attribution" → không có luồng connect chạy được thì claim đó không verify được.',
      },
    ],
  },
  {
    value: 'tw-error',
    label: 'Triple Whale — token hết hạn',
    doc: [
      {
        section: 'Integrations',
        rule: 'Nói NGÀY ngừng gửi event, không nói "có lỗi". Kèm backfill 30 ngày để biến "mất data" thành "lấy lại được" — merchant cần biết có cứu được hay không.',
      },
    ],
  },
  {
    value: 'plan-gated',
    label: '🔴 Integrations — Free Forever: Triple Whale bị plan gate',
    doc: [
      {
        section: 'Vì sao state này không phải ca biên',
        rule: 'Free Forever là plan MẶC ĐỊNH khi install, và `PLANS.starter.adds` có ĐÚNG MỘT dòng: "Triple Whale attribution integration". Nghĩa là plan mặc định KHÔNG connect được Triple Whale — trong khi TW là attribution dependency của launch (roadmap dòng 17). Đường attribution của merchant mới install bắt đầu bằng $29.',
      },
      {
        section: 'Row',
        rule: 'KHÔNG ẩn nút Connect — ẩn thì merchant tưởng app không có tính năng, thay vì hiểu plan mình chưa có. Disable + lý do bằng text hiện sẵn (§7a) + đường upgrade thật (/app/billing, giờ Plans đã có trong nav).',
      },
      {
        section: 'Thứ tự kiểm status',
        rule: '`planned` kiểm TRƯỚC `plan-gated`: Okendo/Yotpo chưa build nên không được hiện "upgrade để có" — mời merchant trả tiền cho thứ không tồn tại là tệ hơn cả không nói gì.',
      },
    ],
  },
  {
    value: 'int-syncing',
    label: 'Integrations — vừa connect, đang gửi lô event đầu',
    doc: [
      {
        section: 'Row',
        rule: 'Connect xong KHÔNG nhảy thẳng sang "Connected": lô event đầu (30 ngày) mất vài phút. Nhảy thẳng sang Connected rồi Triple Whale chưa có số là merchant tưởng integration hỏng.',
      },
    ],
  },
  {
    value: 'no-connection',
    label: 'Connections — chưa nối account nào',
    doc: [
      {
        section: 'Empty state',
        rule: 'Dùng `EmptyState` dual pattern (no-data ≠ no-search-result). CTA là OAuth chứ không phải link route → dùng `onAction`, không dùng `href`.',
      },
      {
        section: 'Copy',
        rule: 'Câu "Nothing goes on your storefront until you add it to a widget" phải có NGAY ở empty state, không đợi sau khi connect. Nó set kỳ vọng trước khi merchant lo video tự lên store.',
      },
    ],
  },
  {value: 'connected', label: 'Connections — 1 account (TikTok), up to date'},
  {
    value: 'two-accounts',
    label: 'Connections — 2 account (TikTok + Instagram)',
    doc: [
      {
        section: 'Account row',
        rule: 'Hai account cố ý cấu hình KHÁC nhau (all posts vs hashtag) để thấy layout khi có text field lồng và để lộ chuyện scope là per-account, không phải global.',
      },
    ],
  },
  {
    value: 'connecting',
    label: 'Connections — đang chờ OAuth (redirect ra rồi về)',
    doc: [
      {
        section: 'Connecting card',
        rule: 'OAuth là REDIRECT RA NGOÀI rồi quay lại, không phải spinner trong app. Copy phải nói rõ merchant cần làm gì ở cửa sổ kia, nếu không họ sẽ bấm Connect lần thứ hai.',
      },
    ],
  },
  {
    value: 'sync-running',
    label: 'Connections — đang import post cũ (backfill)',
    doc: [
      {
        section: 'JobProgress',
        rule: 'Dùng lại `JobProgress` với `pastVerb="imported"`. Để mặc định "generated" thì UI nói dối — merchant đọc "143 videos generated" và tưởng vừa tiêu 143 credit. Import KHÔNG tiêu credit nên `creditNote` bỏ trống.',
      },
      {
        section: 'Backfill',
        rule: 'Backfill là job MỘT LẦN cho post cũ, TÁCH khỏi auto-sync (liên tục, post mới). Gộp hai thứ là lý do merchant bấm Connect rồi bị 143 video ngập Library mà không hiểu vì sao.',
      },
    ],
  },
  {
    value: 'sync-failed',
    label: 'Connections — import xong một phần (138/143)',
    doc: [
      {
        section: 'JobProgress',
        rule: 'Kết quả TỪNG PHẦN: 138 cái xong hiện ngay, 5 cái lỗi nói rõ là 5 và xem được. Không báo "Something went wrong" cho cả lô.',
      },
    ],
  },
  {
    value: 'reconnect-needed',
    label: '🔴 Connections — token hết hạn, auto-sync dừng IM LẶNG',
    doc: [
      {
        section: 'Vì sao state này quan trọng nhất trang',
        rule: 'Token IG/TikTok hết hạn thì auto-sync dừng mà merchant KHÔNG mất gì thấy được — chỉ đơn giản là hết video mới. Cùng lớp lỗi im lặng với "video live nhưng chưa tag product". Đây là lý do có thêm email "A connected account needs reconnecting" ở tab Email.',
      },
      {
        section: 'Copy',
        rule: 'KHÔNG hứa tự động kéo bù post đã miss — mockup không biết backend làm được không. Thay vào đó chỉ sang chính cơ chế backfill đã có ("Import earlier posts"). Hứa một capability chưa xác nhận là chỗ mockup dễ nói dối nhất.',
      },
    ],
  },
  {
    value: 'paused',
    label: 'Connections — merchant tự tắt auto-sync',
    doc: [
      {
        section: 'Phân biệt với reconnect-needed',
        rule: 'Hai state này nhìn giống nhau (không có video mới) nhưng đường thoát khác hẳn: paused là merchant tự tắt → bật lại; expired là Shopify/TikTok cắt → phải reconnect. Tone cũng khác: paused là neutral, expired là critical. Gộp chung là dẫn merchant đi sai.',
      },
    ],
  },
  {
    value: 'dirty',
    label: 'Email — có thay đổi chưa lưu',
    doc: [
      {
        section: 'Save',
        rule: 'App THẬT dùng App Bridge contextual save bar (`shopify.saveBar.show`), render NGOÀI iframe nên mockup không hiện được → banner này là bản thay thế của harness, KHÔNG phải UI đề xuất. Built for Shopify yêu cầu save bar, không phải nút Save tự do giữa page.',
      },
      {
        section: 'Phạm vi',
        rule: 'Chỉ switch email là form state cần lưu. Connect/Disconnect/Sync now có hiệu lực NGAY — hai loại hành vi khác nhau trên cùng một trang thì phải nhất quán từng chỗ.',
      },
    ],
  },
  {
    value: 'read-only',
    label: 'Read-only — staff không đủ quyền',
    doc: [
      {
        section: 'Permission',
        rule: 'Lý do nằm ở BANNER đầu trang, KHÔNG phải tooltip: `interestFor` không mở trên control `disabled` (verified 05 Aug 2026, §7a). Cũng không lặp lý do cạnh từng control — một trang có ~10 control disabled thì lặp 10 lần là nhiễu.',
      },
      {
        section: 'Không ẩn',
        rule: 'Disable + giải thích, KHÔNG ẩn control. Ẩn thì staff không hiểu vì sao mình không thấy nút và sẽ mở support ticket.',
      },
    ],
  },
];

/**
 * Trạng thái của MỘT integration row. Năm cái, và bốn cái đầu là bốn ĐƯỜNG THOÁT
 * khác nhau — gộp bất kỳ hai cái là dẫn merchant đi sai:
 *
 *   planned      — có trong roadmap, chưa build. Không có gì bấm được
 *   plan-gated   — app có, PLAN không có. Đường ra: upgrade
 *   available    — connect được ngay. Đường ra: bấm Connect
 *   syncing      — vừa connect, đang gửi lô event đầu
 *   connected    — đang chạy
 *   error        — token hết hạn. Đường ra: reconnect (KHÁC upgrade)
 */
type IntegrationStatus =
  | 'planned'
  | 'plan-gated'
  | 'available'
  | 'syncing'
  | 'connected'
  | 'error';

const PLAN_NAME = (id: string) => PLANS.find((plan) => plan.id === id)?.name ?? id;

/** State nào thì mở tab nào — reviewer đổi state là thấy ngay chỗ liên quan */
const STATE_TAB: Record<string, TabId> = {
  default: 'integrations',
  'tw-not-connected': 'integrations',
  'tw-error': 'integrations',
  'plan-gated': 'integrations',
  'int-syncing': 'integrations',
  'no-connection': 'connections',
  connected: 'connections',
  'two-accounts': 'connections',
  connecting: 'connections',
  'sync-running': 'connections',
  'sync-failed': 'connections',
  'reconnect-needed': 'connections',
  paused: 'connections',
  dirty: 'email',
  'read-only': 'connections',
};

/**
 * Ô logo — dùng cho CẢ integration (Triple Whale…) và mạng social (TikTok/Instagram).
 *
 * `alt` là **quyết định a11y, không phải chuyện điền cho đủ**:
 *   - Integrations: tên app đã là text đậm ngay cạnh → `alt=""`, ảnh là trang trí.
 *     Để alt="Triple Whale logo" là screen reader đọc tên hai lần.
 *   - Connections: pill `TikTok` đã BỎ (Stella, 06 Aug 2026) → tên mạng không còn ở
 *     dạng text nào, nên `alt` PHẢI là tên mạng. Bỏ pill là chuyển thông tin vào alt.
 *
 * `s-box` bọc để khoá đúng ô vuông: `s-image inlineSize` chỉ nhận `fill|auto`, không
 * nhận px, nên kích thước phải do container quyết.
 */
/** Lấy type thẳng từ intrinsic — `inlineSize` là union literal `SizeUnits`, KHÔNG phải string */
type BoxSize = NonNullable<React.JSX.IntrinsicElements['s-box']['inlineSize']>;

function BrandLogo({src, alt, size = '44px'}: {src: string; alt: string; size?: BoxSize}) {
  return (
    <s-box
      inlineSize={size}
      blockSize={size}
      borderRadius="base"
      overflow="hidden"
      background="base"
      border="base"
    >
      <s-image src={src} alt={alt} inlineSize="fill" aspectRatio="1" objectFit="contain" />
    </s-box>
  );
}

/**
 * Một row trong directory Integrations.
 *
 * Để LOCAL trong route, chưa tách vào `primitives.tsx`: mới dùng ở một chỗ, mà luật
 * `mockup-app/CLAUDE.md` §4 là lặp 3 lần mới tách. Tách sớm thì API component bị
 * đóng khung theo một ca dùng duy nhất.
 */
function IntegrationRow({
  app,
  status,
  readOnly,
  currentPlanName,
  onConnect,
  onResync,
}: {
  app: Integration;
  status: IntegrationStatus;
  readOnly: boolean;
  currentPlanName: string;
  onConnect: () => void;
  onResync: () => void;
}) {
  // Badge phải có TEXT, không chỉ màu (checklist §9)
  const badge = {
    planned: <s-badge tone="neutral">Not available yet</s-badge>,
    'plan-gated': <s-badge tone="neutral">Not on your plan</s-badge>,
    available: <s-badge tone="neutral">Not connected</s-badge>,
    syncing: <s-badge tone="info">Connecting</s-badge>,
    connected: (
      <s-badge tone="success" icon="check">
        Connected
      </s-badge>
    ),
    error: <s-badge tone="critical">Action needed</s-badge>,
  }[status];

  return (
    <s-box border="base" borderRadius="base" padding="base">
      {/* Logo TO, hẳn sang trái · tên + mô tả + mọi thứ khác ở cột phải (Stella,
          06 Aug 2026). Bỏ luôn kiểu header xám / body trắng: với layout logo-trái thì
          một thẻ liền đọc gọn hơn, và cái vạch ngang cũ cắt logo khỏi mô tả của chính nó.
          `s-grid` chứ không `s-stack`: §7e — s-stack không có `wrap`. */}
      <s-grid gridTemplateColumns="max-content minmax(0, 1fr)" gap="base">
        {/* `alt=""` — tên app là text đậm ngay bên phải, ảnh là trang trí */}
        <BrandLogo src={app.logo} alt="" />

        <s-stack direction="block" gap="small">
          <s-stack direction="inline" gap="small-200" alignItems="center">
            {/* Tên app ĐẬM — nó là thứ merchant quét mắt tìm trong list */}
            <s-heading>{app.name}</s-heading>
            {badge}
          </s-stack>
            {status === 'error' && (
              // Nói NGÀY ngừng gửi + có cứu được hay không. "Có lỗi xảy ra" không cho
              // merchant biết mình mất bao nhiêu data.
              <s-banner tone="critical" heading={`Your ${app.name} token expired`}>
                <s-paragraph>
                  We stopped sending {app.dataSent} on 28 July. Reconnect to start again —{' '}
                  {app.name} can backfill up to {app.backfillDays} days, so the gap can still be
                  filled.
                </s-paragraph>
              </s-banner>
            )}

            {/* `summary` đã nói app này gửi data gì → các nhánh dưới KHÔNG nhắc lại */}
            <s-paragraph color="subdued">{app.summary}</s-paragraph>

            {status === 'planned' && <s-text color="subdued">{app.plannedNote}</s-text>}

            {status === 'plan-gated' && (
              <s-stack direction="block" gap="small-200">
                {/* Lý do là TEXT HIỆN SẴN cạnh nút disabled — tooltip KHÔNG mở trên
                    control disabled (§7a). Và KHÔNG ẩn nút: ẩn thì merchant tưởng app
                    không có tính năng, thay vì hiểu là plan của mình chưa có. */}
                <s-text>
                  Available on {app.minPlan ? PLAN_NAME(app.minPlan) : 'every plan'} and up. You are
                  on {currentPlanName}.
                </s-text>
                <s-stack direction="inline" gap="small-200">
                  <s-button disabled>Connect</s-button>
                  <s-button variant="primary" href="/app/billing">
                    Compare plans
                  </s-button>
                </s-stack>
              </s-stack>
            )}

            {status === 'available' && (
              <s-stack direction="inline" gap="small-200">
                <s-button
                  variant="primary"
                  icon="external"
                  disabled={readOnly}
                  onClick={onConnect}
                >
                  Connect
                </s-button>
              </s-stack>
            )}

            {status === 'syncing' && (
              <s-stack direction="inline" gap="small-200" alignItems="center">
                <s-spinner size="base" accessibilityLabel={`Connecting ${app.name}`} />
                <s-text>
                  Sending the last {app.backfillDays} days of events. This usually takes a few
                  minutes — you can leave this page.
                </s-text>
              </s-stack>
            )}

            {status === 'connected' && (
              <s-stack direction="block" gap="small-200">
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-icon type="check-circle" tone="success" size="small" />
                  <s-text>Last event sent 4 minutes ago</s-text>
                </s-stack>
                <s-stack direction="inline" gap="small-200">
                  <s-button icon="refresh" disabled={readOnly} onClick={onResync}>
                    Resync
                  </s-button>
                  <s-button
                    variant="tertiary"
                    tone="critical"
                    disabled={readOnly}
                    command="--show"
                    commandFor={`disconnect-${app.id}`}
                  >
                    Disconnect
                  </s-button>
                </s-stack>
              </s-stack>
            )}

            {status === 'error' && (
              <s-stack direction="inline" gap="small-200">
                <s-button
                  variant="primary"
                  icon="external"
                  disabled={readOnly}
                  onClick={onConnect}
                >
                  Reconnect
                </s-button>
              </s-stack>
            )}
            {/* KHÔNG có nút "How this works": §4.6 — link tới doc chưa tồn tại tệ hơn
                không có link. Giải thích nằm ở `summary`. */}
        </s-stack>
      </s-grid>
    </s-box>
  );
}

export default function Settings() {
  const [state, setState] = useState('default');
  const [tab, setTab] = useState<TabId>('integrations');
  const is = (...names: string[]) => names.includes(state);
  const readOnly = is('read-only');

  // Đổi state thì nhảy sang tab của state đó — đây là hành vi của REVIEW TOOL,
  // không phải của app thật (app thật không có StateSwitcher).
  const changeState = (next: string) => {
    setState(next);
    setTab(STATE_TAB[next] ?? 'integrations');
  };

  const [emails, setEmails] = useState({
    digest: true,
    creditsLow: true,
    jobDone: false,
    // Mặc định BẬT: đây là email duy nhất chặn được lỗi im lặng của Connections
    reconnect: true,
  });
  const [touched, setTouched] = useState(false);
  const [sender, setSender] = useState({name: 'Northline Studio', replyTo: 'hello@northline.co'});

  // Override cho từng account — để switch/choice thật sự bấm được, không phải UI chết
  const [autoSyncOverride, setAutoSyncOverride] = useState<Record<string, boolean>>({});
  const [scopeOverride, setScopeOverride] = useState<Record<string, string[]>>({});
  /** Thay cho toast của App Bridge (mockup không có admin host để chạy toast thật) */
  const [notice, setNotice] = useState<string | null>(null);

  const setEmail = (key: keyof typeof emails) => (event: {currentTarget: {checked: boolean}}) => {
    setEmails((prev) => ({...prev, [key]: event.currentTarget.checked}));
    setTouched(true);
  };

  const dirty = is('dirty') || touched;

  /**
   * Plan hiện tại. `plan-gated` giả lập merchant đang ở **Free Forever** — và đó là
   * plan MẶC ĐỊNH khi install, nên state này không phải ca biên.
   */
  const currentPlanId = is('plan-gated') ? 'free' : 'growth';
  const currentPlanName = PLAN_NAME(currentPlanId);
  const PLAN_ORDER = ['free', 'starter', 'growth', 'scale'];
  const planAllows = (minPlan: Integration['minPlan']) =>
    !minPlan || PLAN_ORDER.indexOf(currentPlanId) >= PLAN_ORDER.indexOf(minPlan);

  /**
   * Thứ tự kiểm QUAN TRỌNG: `planned` → `plan-gated` → trạng thái connection.
   * Chưa build thì nói chưa build, đừng mời merchant upgrade để lấy một thứ không tồn tại.
   */
  const statusOf = (app: Integration): IntegrationStatus => {
    if (app.availability === 'planned') return 'planned';
    if (!planAllows(app.minPlan)) return 'plan-gated';
    if (is('tw-not-connected')) return 'available';
    if (is('tw-error')) return 'error';
    if (is('int-syncing')) return 'syncing';
    return 'connected';
  };

  /**
   * Account hiện trên tab Connections, dẫn xuất từ state đang chọn.
   * `connecting` cố ý KHÔNG có account nào: nó là luồng nối lần đầu.
   */
  const accounts: SocialConnection[] = is('no-connection', 'connecting')
    ? []
    : is('two-accounts')
      ? socialConnections
      : is('reconnect-needed')
        ? [{...socialConnections[0], status: 'expired', lastSyncedLabel: '12 days ago'}]
        : is('paused')
          ? [{...socialConnections[0], status: 'paused', autoSync: false}]
          : [socialConnections[0]];

  const backfill = socialConnections[0];

  return (
    <s-page heading="Settings">
      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={changeState}
          states={STATES}
          globalNote={
            <s-paragraph>
              Tab <s-text type="strong">Connections</s-text> là mảnh trả lời open question 4c
              (Library đã có import TikTok/Instagram chưa). Hệ quả cần Duong chốt: `setupSteps` bước
              1 của Home đang trỏ <s-text type="strong">/app/library</s-text> nhưng chỗ nối account
              là trang này — bước 1 của setup guide chỉ sai trang, mà đó là bước đầu của activation
              metric (install → first video live dưới 10 phút).
            </s-paragraph>
          }
        />

        {/* Lý do disabled nằm Ở ĐÂY, không phải tooltip: `interestFor` không mở trên
            control disabled (§7a). Một banner cho cả trang, không lặp cạnh từng control. */}
        {readOnly && (
          <s-banner tone="info" heading="You have view-only access">
            <s-paragraph>
              Only the store owner and staff with access to this app can change these settings. Ask
              them to make the change, or to give you access in Shopify admin under Settings → Users
              and permissions.
            </s-paragraph>
          </s-banner>
        )}

        {/* HARNESS — app thật dùng App Bridge contextual save bar (render ngoài iframe,
            mockup không hiện được). BFS yêu cầu save bar, không phải nút Save giữa page.
            In real app: shopify.saveBar.show('settings-save-bar') */}
        {dirty && !readOnly && (
          <s-banner tone="info" heading="You have unsaved changes">
            <s-paragraph>Your email choices are not saved yet.</s-paragraph>
            <s-button slot="secondary-actions" onClick={() => setTouched(false)}>
              Save
            </s-button>
          </s-banner>
        )}

        {notice && (
          // In real app: shopify.toast.show(notice) — toast render ngoài iframe
          <s-banner tone="info" heading={notice} dismissible onDismiss={() => setNotice(null)} />
        )}

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {/* ══════════ TAB 1 · INTEGRATIONS ══════════ */}
        {tab === 'integrations' && (
          <s-section heading="Integrations">
            <s-stack direction="block" gap="large-100">
              <s-paragraph color="subdued">
                MakeUGC tracks the orders and revenue from your videos on its own. Connect these apps
                to see video alongside your other channels.
              </s-paragraph>

              {/* Nhóm theo category vì list SẼ dài ra (Stella, 06 Aug 2026). Nhóm dựng từ
                  data (`integrationCategories`) nên thêm integration là thêm phần tử trong
                  sample.ts, không phải sửa route.
                  ⚠️ KHÔNG bọc mỗi nhóm bằng `s-section`: §7f — s-section lồng s-section mất
                  surface, cả khối phẳng lì. Nhãn nhóm là `s-text`. */}
              {Object.entries(integrationCategories).map(([category, apps]) => (
                <s-stack key={category} direction="block" gap="small">
                  <s-text type="strong" color="subdued">
                    {category}
                  </s-text>
                  {apps.map((app) => (
                    <IntegrationRow
                      key={app.id}
                      app={app}
                      status={statusOf(app)}
                      readOnly={readOnly}
                      currentPlanName={currentPlanName}
                      onConnect={() => changeState('int-syncing')}
                      onResync={() =>
                        setNotice(
                          `Resync started. The last ${app.backfillDays} days of video events will be sent again.`,
                        )
                      }
                    />
                  ))}
                </s-stack>
              ))}

              {/* Không có search/filter ở 3 row: control lọc mà không lọc gì là nhiễu.
                  Ngưỡng nên thêm: ~10 row. Xem `open[]`. */}
            </s-stack>
          </s-section>
        )}

        {/* ══════════ TAB 2 · CONNECTIONS ══════════ */}
        {tab === 'connections' && (
          <s-stack direction="block" gap="base">
            {is('sync-running') && (
              <JobProgress
                status="processing"
                title={`Importing earlier posts from ${backfill.handle}`}
                done={138}
                total={backfill.earlierPosts}
                etaLabel="~1 min left"
                // Import KHÔNG tiêu credit → cố ý không truyền `creditNote`
                pastVerb="imported"
                onCancel={() => changeState('connected')}
              />
            )}
            {is('sync-failed') && (
              <JobProgress
                status="done"
                title={`Imported earlier posts from ${backfill.handle}`}
                done={138}
                total={backfill.earlierPosts}
                failedCount={5}
                pastVerb="imported"
                onRetry={() => changeState('sync-running')}
              />
            )}

            <s-section heading="Connected accounts">
              <s-stack direction="block" gap="base">
                {/* Câu quan trọng nhất tab này — set kỳ vọng TRƯỚC khi merchant lo
                    video tự lên storefront. Khớp §3d: publish = gán tay vào widget. */}
                <s-paragraph>
                  New videos arrive in your Library. They do not appear on your storefront until you
                  add them to a widget.
                </s-paragraph>

                {is('connecting') && (
                  <s-box border="base" borderRadius="base" padding="small">
                    <s-stack direction="inline" gap="small" alignItems="center">
                      <s-spinner size="base" accessibilityLabel="Waiting for TikTok" />
                      <s-stack direction="block" gap="small-500">
                        <s-text type="strong">Waiting for TikTok</s-text>
                        {/* OAuth là redirect RA NGOÀI. Không nói rõ thì merchant bấm
                            Connect lần thứ hai và tạo hai luồng song song. */}
                        <s-text color="subdued">
                          A TikTok window opened. Approve access there, then come back to this page.
                        </s-text>
                      </s-stack>
                      <s-button variant="tertiary" onClick={() => changeState('no-connection')}>
                        Cancel
                      </s-button>
                    </s-stack>
                  </s-box>
                )}

                {accounts.length === 0 && !is('connecting') && (
                  <EmptyState
                    isEmptyState
                    heading="Bring in videos automatically"
                    // Câu "…until you add them to a widget" ĐÃ nói ở paragraph đầu
                    // section ngay trên. Nói lại ở đây là lặp — harness verify bắt được.
                    body="Connect the accounts you post from and new videos arrive in your Library on their own."
                    actionLabel="Connect TikTok"
                    onAction={() => changeState('connecting')}
                    secondaryLabel="Connect Instagram"
                    onSecondaryAction={() => changeState('connecting')}
                    resourceName="accounts"
                  />
                )}

                {accounts.map((account) => {
                  const autoSync = autoSyncOverride[account.id] ?? account.autoSync;
                  const scope = scopeOverride[account.id] ?? [account.scope];
                  const expired = account.status === 'expired';

                  return (
                    <s-box
                      key={account.id}
                      border="base"
                      borderRadius="base"
                      padding="base"
                    >
                      {/* Cùng layout với row Integrations: logo TO hẳn sang trái, mọi
                          thứ khác ở cột phải (Stella, 06 Aug 2026). */}
                      <s-grid gridTemplateColumns="max-content minmax(0, 1fr)" gap="base">
                        {/* Logo THAY pill `TikTok` — logo đã nói mạng nào rồi.
                            ⚠️ Nên `alt` PHẢI là tên mạng: bỏ pill là chuyển thông tin
                            đó vào alt, không phải xoá nó khỏi trang. */}
                        <BrandLogo src={account.logo} alt={account.network} />

                        <s-stack direction="block" gap="small">
                          <s-stack direction="inline" gap="small-200" alignItems="center">
                            {/* Handle ĐẬM — nó là thứ phân biệt account này với account kia */}
                            <s-heading>{account.handle}</s-heading>
                            {expired && <s-badge tone="critical">Reconnect needed</s-badge>}
                            {account.status === 'paused' && (
                              <s-badge tone="neutral">Auto-sync off</s-badge>
                            )}
                            {account.status === 'healthy' && (
                              <s-badge tone="success" icon="check">
                                Up to date
                              </s-badge>
                            )}
                          </s-stack>
                            {expired && (
                              // Lỗi IM LẶNG → phải là banner critical, không phải dòng
                              // chữ xám. Và KHÔNG hứa tự kéo bù post đã miss (chưa xác
                              // nhận backend làm được) — chỉ sang cơ chế backfill đã có.
                              <s-banner
                                tone="critical"
                                heading={`Auto-sync stopped ${account.lastSyncedLabel}`}
                              >
                                <s-paragraph>
                                  {account.network} needs you to reconnect {account.handle}. No new
                                  posts have come in since then. After reconnecting you can bring in
                                  what you missed with Import earlier posts.
                                </s-paragraph>
                                <s-button
                                  slot="secondary-actions"
                                  disabled={readOnly}
                                  onClick={() => changeState('connected')}
                                >
                                  Reconnect
                                </s-button>
                              </s-banner>
                            )}

                            <s-text color="subdued">
                              Last synced {account.lastSyncedLabel} · {account.videosImported} videos
                              brought in
                            </s-text>

                            <s-switch
                              label="Bring in new posts automatically"
                              details="We check this account for new posts every 6 hours."
                              checked={autoSync}
                              disabled={readOnly || expired}
                              onChange={(event) =>
                                setAutoSyncOverride((prev) => ({
                                  ...prev,
                                  [account.id]: event.currentTarget.checked,
                                }))
                              }
                            />

                            {/* Choice list chỉ hiện khi auto-sync BẬT — tắt rồi thì
                                "post nào" là câu hỏi vô nghĩa. Cố ý KHÔNG có lựa chọn
                                thứ ba "nothing automatic": switch tắt ĐÃ là nghĩa đó,
                                để cả hai là nói một thông tin hai lần. */}
                            {autoSync && !expired && (
                              <s-stack direction="block" gap="small-200">
                                <s-choice-list
                                  label="Which posts to bring in"
                                  values={scope}
                                  disabled={readOnly}
                                  onChange={(event) =>
                                    setScopeOverride((prev) => ({
                                      ...prev,
                                      [account.id]: event.currentTarget.values,
                                    }))
                                  }
                                >
                                  <s-choice value="all">
                                    Every new post
                                    <s-paragraph slot="details">
                                      Recommended when this account is mostly product content.
                                    </s-paragraph>
                                  </s-choice>
                                  <s-choice value="hashtag">
                                    Only posts with a hashtag
                                    <s-paragraph slot="details">
                                      Use this if you post more than product content.
                                    </s-paragraph>
                                  </s-choice>
                                </s-choice-list>

                                {scope.includes('hashtag') && (
                                  <s-text-field
                                    label="Hashtag"
                                    value={account.hashtag}
                                    disabled={readOnly}
                                    details="Posts without this hashtag are skipped."
                                  />
                                )}
                              </s-stack>
                            )}

                            {!autoSync && !expired && (
                              <s-text color="subdued">
                                New posts will not come in until you turn this back on. Videos
                                already in your Library are not affected.
                              </s-text>
                            )}

                            <s-stack direction="inline" gap="small-200">
                              <s-button
                                icon="refresh"
                                disabled={readOnly || expired}
                                onClick={() => changeState('sync-running')}
                              >
                                Sync now
                              </s-button>
                              <s-button
                                variant="tertiary"
                                tone="critical"
                                disabled={readOnly}
                                command="--show"
                                commandFor={`disconnect-${account.id}`}
                              >
                                Disconnect
                              </s-button>
                            </s-stack>
                        </s-stack>
                      </s-grid>
                    </s-box>
                  );
                })}

                {/* BACKFILL — job MỘT LẦN cho post CŨ, tách hẳn khỏi auto-sync ở trên.
                    Gộp hai thứ là lý do merchant bấm Connect rồi bị ngập Library. */}
                {accounts.length > 0 && !is('sync-running') && (
                  <s-box background="subdued" borderRadius="base" padding="small">
                    <s-stack
                      direction="inline"
                      gap="small"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <s-stack direction="block" gap="small-500">
                        <s-text type="strong">Earlier posts</s-text>
                        <s-text color="subdued">
                          {accounts[0].handle} has {accounts[0].earlierPosts} posts from before you
                          connected. Auto-sync only brings in new ones.
                        </s-text>
                      </s-stack>
                      <s-button
                        disabled={readOnly || accounts[0].status === 'expired'}
                        onClick={() => changeState('sync-running')}
                      >
                        Import earlier posts
                      </s-button>
                    </s-stack>
                  </s-box>
                )}

                {accounts.length > 0 && (
                  <s-stack direction="inline" gap="small-200">
                    <s-button
                      icon="plus"
                      disabled={readOnly}
                      onClick={() => changeState('connecting')}
                    >
                      Connect TikTok
                    </s-button>
                    <s-button
                      icon="plus"
                      disabled={readOnly}
                      onClick={() => changeState('connecting')}
                    >
                      Connect Instagram
                    </s-button>
                  </s-stack>
                )}
              </s-stack>
            </s-section>
          </s-stack>
        )}

        {/* ══════════ TAB 3 · EMAIL NOTIFICATIONS ══════════ */}
        {tab === 'email' && (
          <s-stack direction="block" gap="base">
            <s-section heading="Emails to you and your staff">
              <s-stack direction="block" gap="base">
                {/* KHÔNG viết "the store owner and staff with access to this app" ở đây:
                    banner read-only đã dùng đúng cụm đó để nói AI ĐƯỢC SỬA, nên ở state
                    read-only hai câu đọc ra như một câu bị lặp. Câu này nói về NGƯỜI NHẬN. */}
                <s-paragraph color="subdued">
                  Sent to everyone who can open MakeUGC in your Shopify admin.
                </s-paragraph>

                <s-switch
                  label="Weekly performance digest"
                  details="Your top videos and the revenue they brought in, every Monday."
                  checked={emails.digest}
                  disabled={readOnly}
                  onChange={setEmail('digest')}
                />
                <s-divider />
                <s-switch
                  label="AI credits running low"
                  details="Sent at 80% used, so generation does not stop unexpectedly."
                  checked={emails.creditsLow}
                  disabled={readOnly}
                  onChange={setEmail('creditsLow')}
                />
                <s-divider />
                <s-switch
                  label="AI generation finished"
                  details="Useful if you leave the tab while videos generate."
                  checked={emails.jobDone}
                  disabled={readOnly}
                  onChange={setEmail('jobDone')}
                />
                <s-divider />
                {/* Email này KHÔNG có trong bản trước — thêm vì nó là thứ duy nhất
                    chặn được lỗi im lặng của Connections: token hết hạn thì auto-sync
                    dừng mà merchant không thấy gì cả, chỉ là hết video mới. */}
                <s-switch
                  label="A connected account needs reconnecting"
                  details="TikTok and Instagram ask you to reconnect from time to time. Without this email, new posts quietly stop arriving."
                  checked={emails.reconnect}
                  disabled={readOnly}
                  onChange={setEmail('reconnect')}
                />
                <s-divider />
                {/* Không cho tắt — hệ quả quá nặng nếu bỏ lỡ. Lý do nằm trong `details`,
                    tức TEXT HIỆN SẴN, không phải tooltip (§7a: tooltip không mở trên
                    control disabled). */}
                <s-switch
                  label="Payment or subscription problems"
                  details="Always on. Missing one of these could pause AI Studio without you knowing."
                  checked
                  disabled
                />
              </s-stack>
            </s-section>

            {/*
              Section này CỐ Ý chỉ có phần sender, không có danh sách email.

              Stella nói tab Email quyết cả email gửi CUSTOMER, nhưng chưa cấp danh
              sách là những email gì → KHÔNG bịa row nào. Bịa ra shopper-facing email
              là loại lỗi tệ nhất ở đây vì:
                1. `deliverables/app-listing-v1-submission.md` KHÔNG khai app gửi mail
                   cho customer của merchant — claim không verify được là bị Shopify
                   reject (chính file listing ghi vậy ở dòng 57)
                2. mail tới shopper kéo theo sender identity + unsubscribe + privacy

              Nên heading gọi đúng cái section này THẬT SỰ cấu hình ("sender"), không
              gọi là "Emails to your customers" rồi để trống — đặt tên theo thứ mình
              chưa có là cách nhanh nhất làm dev build sai.
              ⏳ Có danh sách thì thêm nhóm switch vào đây. Xem `open[]` của registry.
            */}
            <s-section heading="Customer email sender">
              <s-stack direction="block" gap="base">
                <s-paragraph color="subdued">
                  Used as the sender and reply-to address on any email MakeUGC sends to your
                  shoppers.
                </s-paragraph>
                <s-text-field
                  label="Sender name"
                  value={sender.name}
                  disabled={readOnly}
                  details="Shoppers see this as the From name."
                  onChange={(event) => {
                    setSender((prev) => ({...prev, name: event.currentTarget.value}));
                    setTouched(true);
                  }}
                />
                <s-email-field
                  label="Reply-to address"
                  value={sender.replyTo}
                  disabled={readOnly}
                  details="Replies from shoppers go here, not to MakeUGC."
                  onChange={(event) => {
                    setSender((prev) => ({...prev, replyTo: event.currentTarget.value}));
                    setTouched(true);
                  }}
                />
                <s-paragraph color="subdued">
                  Every email to a shopper includes an unsubscribe link.
                </s-paragraph>
              </s-stack>
            </s-section>
          </s-stack>
        )}
      </s-stack>

      {/* ══ MODAL: disconnect integration ══
          Destructive thì confirm phải nói HẬU QUẢ CỤ THỂ, không phải "Are you sure?" */}
      {/* Chỉ integration `live` mới có modal disconnect — `planned` thì không có gì để gỡ */}
      {integrations
        .filter((app) => app.availability === 'live')
        .map((app) => (
        <s-modal
          key={app.id}
          id={`disconnect-${app.id}`}
          heading={`Disconnect ${app.name}?`}
          accessibilityLabel={`Disconnect ${app.name}`}
        >
          <s-paragraph>
            We stop sending {app.dataSent} to {app.name}. Reports there will no longer include video.
            Your MakeUGC data is not affected.
          </s-paragraph>
          <s-button
            slot="primary-action"
            tone="critical"
            command="--hide"
            commandFor={`disconnect-${app.id}`}
            onClick={() => changeState('tw-not-connected')}
          >
            Disconnect
          </s-button>
          <s-button slot="secondary-actions" command="--hide" commandFor={`disconnect-${app.id}`}>
            Cancel
          </s-button>
        </s-modal>
      ))}

      {/* ══ MODAL: disconnect social account ══
          Hậu quả có SỐ LƯỢNG: video đã kéo về không mất, chỉ ngừng kéo tiếp.
          Không nói con số thì merchant tưởng mất cả 47 video. */}
      {accounts.map((account) => (
        <s-modal
          key={account.id}
          id={`disconnect-${account.id}`}
          heading={`Disconnect ${account.handle}?`}
          accessibilityLabel={`Disconnect ${account.network} account ${account.handle}`}
        >
          <s-paragraph>
            The {account.videosImported} videos already in your Library stay, including any that are
            live in a widget. We stop bringing in new posts from {account.handle}.
          </s-paragraph>
          <s-button
            slot="primary-action"
            tone="critical"
            command="--hide"
            commandFor={`disconnect-${account.id}`}
            onClick={() => changeState('no-connection')}
          >
            Disconnect
          </s-button>
          <s-button slot="secondary-actions" command="--hide" commandFor={`disconnect-${account.id}`}>
            Cancel
          </s-button>
        </s-modal>
      ))}
    </s-page>
  );
}
