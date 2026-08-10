/**
 * MOCKUP — AI Studio (viết lại 05 Aug 2026 theo app THẬT)
 *
 * ═══ MÔ HÌNH THẬT ═══
 * **catalog image → video**: chọn product → chọn ảnh nào của product → mỗi ảnh
 * 1 credit = 1 video → Generate → **nhảy sang Library**, ở đó item hiện "Generating".
 *
 * Bản mockup trước giả định script + AI creator + language + tone (text-to-video).
 * KHÔNG có gì trong đó tồn tại ở app thật → viết lại từ mô hình.
 *
 * ═══ QUYẾT ĐỊNH TRONG SESSION NÀY (Stella, 05 Aug 2026) ═══
 * 1. **Bỏ hẳn image generation** — app thật có "Image ad" bên cạnh "Product video".
 *    Ảnh quảng cáo không vào được vòng giá trị video → widget → tag product →
 *    attributed revenue, nhưng tiêu credit từ CÙNG một pool, tức cạnh tranh trực tiếp
 *    với thứ ra tiền. Không có trong roadmap Phase 0, không có trong listing.
 *    → video-only. Hệ quả: Library phải bỏ filter `Images`.
 * 2. **Prompt là thiết kế MỚI** — app thật chưa có input nào. Cấp batch làm mặc định,
 *    cho ghi đè lẻ từng ảnh.
 * 3. Creator + language: vẽ slot, đánh dấu chưa build. KHÔNG dựng control giả.
 *
 * ⚠️ RỦI RO LAUNCH: listing đã submit claim "1000+ avatars in 50+ languages"
 * (`deliverables/app-listing-v1-submission.md` dòng 39) mà app không có picker nào —
 * chính file đó ghi Shopify reject nếu claim không verify được.
 *
 * Route file thật: app/routes/app.ai-studio.product.tsx (đổi tên 08 Aug 2026 —
 * `/app/ai-studio` giờ là Creator video, xem `components/AiStudioTabs.tsx`)
 */
import {useState} from 'react';

import AiDisclaimer from '../components/AiDisclaimer';
import AiStudioTabs from '../components/AiStudioTabs';
import CreditMeter from '../components/CreditMeter';
import JobProgress, {type JobStatus} from '../components/JobProgress';
import StateSwitcher from '../components/StateSwitcher';
import type {StateOption} from '../components/StateSwitcher';
import {CountdownRing, EmptyState, FilterPills} from '../components/primitives';
import {catalogProducts, productImage, promptPresets} from '../data/sample';
import type {CatalogProduct} from '../data/sample';

/** Ngưỡng coi là batch lớn → phải confirm có SỐ LƯỢNG trước khi đốt credit */
const LARGE_BATCH = 25;
/** ⏳ Tôi tự đặt — cần backend xác nhận giới hạn thật */
const PROMPT_MAX = 500;

const STATES: StateOption[] = [
  {
    value: 'disclaimer-first-run',
    label: 'Disclaimer lần đầu — chặn generate tới khi tick',
    doc: [
      {section: 'Action zone', rule: 'Gate là MỘT LẦN CHO MỖI SHOP, không phải mỗi tab — nên nó phải chặn ở CẢ HAI surface sinh video (tab này và Creator video), tuỳ merchant chạm cái nào trước. Bản đầu tôi chỉ gắn ở Creator video, tab này chỉ có dòng gọn → thủng.'},
      {section: 'Action zone', rule: 'Nút "Continue" disabled tới khi tick — nút trần thì merchant bấm qua theo phản xạ và ghi nhận thu được không đáng tin.'},
      {section: '⚠️ Giới hạn pháp lý', rule: 'Disclaimer chuyển được nghĩa vụ DEPLOYER (EU AI Act 50(4), NY 396-b) sang merchant. KHÔNG chuyển được nghĩa vụ PROVIDER (Art 50(2) — dấu machine-readable), và KHÔNG chuyển được FTC 16 CFR 465 vì điều khoản đó phạt cả bên PHÁT TÁN — app này chính là bên đẩy video lên storefront.'},
    ],
  },
  {
    value: 'empty',
    label: 'Empty — chưa chọn product nào',
    doc: [
      {section: 'Page action', rule: 'Generate disabled. Lý do là TEXT trong aside dưới CreditMeter, không phải tooltip — tooltip không mở được trên control disabled, và nút nằm trong slot header nên không đặt text cạnh nó được.'},
      {section: 'Products & images', rule: 'EmptyState + "Browse products". In real app mở shopify.resourcePicker chứ không phải trang riêng.'},
      {section: 'Prompt', rule: 'Vẫn cho nhập trước khi chọn ảnh — merchant hay nghĩ ra ý tưởng trước, đừng chặn.'},
    ],
  },
  {
    value: 'selected',
    label: 'Selected — 1 product / 1 ảnh (khớp screenshot app)',
    doc: [
      {section: 'Aside', rule: 'Cost preview phải so với credit CÒN LẠI, không chỉ nói "1 credit mỗi ảnh": "This uses 1 of your 2,498 credits. 2,497 left after."'},
      {section: 'Page action', rule: 'Nhãn nút đếm đúng số ảnh và đúng số nhiều: "Generate 1 video" / "Generate 12 videos".'},
    ],
  },
  {
    value: 'prompt-custom',
    label: 'Prompt custom — batch prompt + 3 ảnh ghi đè',
    doc: [
      {section: 'Products & images', rule: 'Ảnh có prompt riêng mang badge "Custom" ngay trên dòng trạng thái, và dòng tóm tắt đếm "3 with a custom prompt" — nhìn một cái là biết ảnh nào khác, không phải mở từng cái để kiểm.'},
      {section: 'Prompt', rule: 'Ghi đè lẻ dùng MỘT modal dùng chung, không render một textarea cho mỗi ảnh. Modal prefill bằng batch prompt + có nút reset.'},
    ],
  },
  {
    value: 'batch-large',
    label: 'Batch lớn — 6 product / 30 ảnh (cần confirm)',
    doc: [
      {section: 'Page action', rule: 'Generate KHÔNG chạy ngay: mở confirm modal có SỐ LƯỢNG cụ thể. Plan Scale có 2.500 credit nên một cú "Select all images" trên nhiều product đốt được hàng trăm credit trong một click.'},
      {section: 'Aside', rule: 'Banner warning ở ngưỡng 25 ảnh. Ngưỡng này tôi tự đặt — cần Duong chốt.'},
      {section: 'Products & images', rule: 'Cố ý để các block product xếp dọc và dài: đó là sự thật của batch lớn, đừng che bằng master-detail.'},
    ],
  },
  {
    value: 'no-images',
    label: 'No images — product được chọn nhưng không có ảnh',
    doc: [
      {section: 'Products & images', rule: 'Product 0 ảnh phải nói ra + link mở product trong admin để merchant đi thêm ảnh. Không có state này thì đây là dead-end im lặng: chọn xong mà Generate vẫn disabled, không hiểu vì sao.'},
      {section: 'Aside', rule: '0 ảnh → 0 credit → Generate disabled, lý do nói đúng nguyên nhân (product thiếu ảnh), không nói chung "chưa chọn gì".'},
    ],
  },
  {
    value: 'low-credit',
    label: 'Low credit — còn 420/2500 (≤20%)',
    doc: [
      {section: 'Aside', rule: 'CreditMeter tự bật warning ở ≤20% — nói TRƯỚC khi hết, không chờ chặn mới nói. Vẫn generate được: đây là cảnh báo, không phải chặn.'},
    ],
  },
  {
    value: 'cannot-afford',
    label: 'Cannot afford — batch 12 ảnh, còn 8 credit',
    doc: [
      {section: 'Aside', rule: 'Banner critical nói CẢ HAI con số (cần 12, còn 8) + hai đường ra: bỏ chọn bớt hoặc upgrade. CreditMeter nhận `pendingCost` nên cũng tự hiện "This needs 12 credits but you only have 8 left". Generate disabled.'},
      {section: 'Khác gì quota-blocked', rule: 'Còn credit nhưng KHÔNG ĐỦ cho batch này → sửa được bằng cách bỏ chọn. quota-blocked là hết hẳn, chỉ chờ reset hoặc upgrade.'},
    ],
  },
  {
    value: 'quota-blocked',
    label: 'Quota blocked — hết credit, hard stop',
    doc: [
      {section: 'Action zone', rule: 'Banner critical có NGÀY RESET + đường upgrade. Roadmap: hard stop, không overage — nên phải chặn, và chặn thì phải giải thích trước.'},
      {section: 'Cả trang', rule: 'KHÔNG ẩn tính năng. Merchant vẫn chọn ảnh và viết prompt được để sẵn sàng cho kỳ sau — ẩn đi thì họ tưởng mất tính năng đã trả tiền.'},
    ],
  },
  {
    value: 'plan-gated',
    label: 'Plan gated — Free Forever HOẶC Starter, không có AI Studio',
    doc: [
      {section: 'Cả trang', rule: 'Thay toàn bộ nội dung bằng EmptyState bán giá trị + "Upgrade". KHÔNG ẩn khỏi nav (checklist §6) và KHÔNG dùng copy của quota-blocked — hai đường thoát khác nhau.'},
      {section: 'Page action', rule: 'Primary đổi thành "Upgrade to Growth", không phải Generate disabled.'},
    ],
  },
  {
    value: 'job-queued',
    label: 'Job queued — chờ slot',
    doc: [
      {section: 'Action zone', rule: 'KHÔNG vẽ progress bar giả khi chưa biết %. Chỉ nói đang chờ và thường bắt đầu trong bao lâu.'},
    ],
  },
  {
    value: 'job-processing',
    label: 'Job processing — có ETA + Cancel',
    doc: [
      {section: 'Action zone', rule: 'Card chi tiết có ETA + Cancel. AI Studio là NƠI BẤM nên là nơi được huỷ; các trang khác chỉ có banner gọn (GlobalJobProgress).'},
      {section: 'Products & images', rule: 'Selection đã xoá sau khi generate → tránh bấm lại lần hai tiêu credit hai lần.'},
      {section: 'Page action', rule: 'Generate disabled trong lúc batch chạy, lý do bằng text.'},
    ],
  },
  {
    value: 'partial-fail',
    label: 'Partial fail — 9 xong, 3 lỗi',
    doc: [
      {section: 'Action zone', rule: 'Hiện kết quả TỪNG PHẦN ngay, không chờ đủ batch. Nói rõ số credit đã hoàn cho phần lỗi.'},
    ],
  },
  {
    value: 'job-failed',
    label: 'Job failed — provider từ chối nội dung',
    doc: [
      {section: 'Action zone', rule: 'Lý do CỤ THỂ (provider từ chối gì) + Retry + số credit đã hoàn. "Something went wrong" là vô dụng — enterprise sẽ đối chiếu hoá đơn.'},
    ],
  },
  {
    value: 'no-permission',
    label: 'No permission — staff không được tiêu credit',
    doc: [
      {section: 'Action zone', rule: 'Banner warning nói ai làm được việc này.'},
      {section: 'Cả trang', rule: 'Control disabled nhưng KHÔNG ẩn, và lý do là text hiện sẵn. Vẫn xem được catalog.'},
    ],
  },
  {
    value: 'loading',
    label: 'Loading — đang load catalog',
    doc: [
      {section: 'Products & images', rule: 's-spinner có accessibilityLabel. Polaris web components KHÔNG có skeleton.'},
    ],
  },
  {
    value: 'error',
    label: 'Error — không load được catalog',
    doc: [
      {section: 'Action zone', rule: 'Banner critical + Retry, và nói rõ cái gì KHÔNG bị ảnh hưởng (video đã tạo vẫn nằm trong Library).'},
      {section: 'Products & images', rule: 'KHÔNG render. Hiện grid rỗng lúc lỗi làm merchant tưởng catalog trống.'},
    ],
  },
];

/** Kịch bản của từng state — đổi state là reset về đúng kịch bản đó */
type Scenario = {
  products: string[];
  images: Record<string, number[]>;
  used: number;
  batchPrompt?: string;
  imagePrompts?: Record<string, string>;
};

const TOTAL_CREDITS = 2500;
const DEMO_PROMPT =
  'Show the product from several angles in natural daylight. Slow, steady camera movement.';

const SCENARIOS: Record<string, Scenario> = {
  empty: {products: [], images: {}, used: 2},
  'disclaimer-first-run': {products: ['p-1'], images: {'p-1': [0]}, used: 2},
  // Khớp screenshot app thật: The 3p Fulfilled Snowboard, 1 ảnh
  selected: {products: ['p-1'], images: {'p-1': [0]}, used: 2},
  'prompt-custom': {
    products: ['p-3', 'p-5', 'p-8'],
    images: {'p-3': [0, 1, 2, 3, 4], 'p-5': [0, 1, 2, 3], 'p-8': [0, 1, 2]},
    used: 2,
    batchPrompt: DEMO_PROMPT,
    imagePrompts: {
      'p-3:1': 'Close on the waistband and pocket depth. Hands showing how deep the pockets are.',
      'p-5:0': 'Tote worn over the shoulder while walking, city background, late afternoon.',
      'p-8:2': 'Jacket buttoned then unbuttoned to show the lining.',
    },
  },
  'batch-large': {
    products: ['p-3', 'p-5', 'p-11', 'p-19', 'p-22', 'p-13'],
    images: {
      'p-3': [0, 1, 2, 3, 4, 5],
      'p-5': [0, 1, 2, 3, 4],
      'p-11': [0, 1, 2, 3, 4],
      'p-19': [0, 1, 2, 3, 4, 5],
      'p-22': [0, 1, 2, 3, 4],
      'p-13': [0, 1, 2],
    },
    used: 2,
    batchPrompt: DEMO_PROMPT,
  },
  // p-7 = Merino wool scarf, imageCount 0
  'no-images': {products: ['p-7'], images: {}, used: 2},
  'low-credit': {products: ['p-3'], images: {'p-3': [0, 1]}, used: TOTAL_CREDITS - 420},
  'cannot-afford': {
    products: ['p-3', 'p-5'],
    images: {'p-3': [0, 1, 2, 3, 4, 5], 'p-5': [0, 1, 2, 3, 4, 5]},
    used: TOTAL_CREDITS - 8,
  },
  'quota-blocked': {products: ['p-3'], images: {'p-3': [0]}, used: TOTAL_CREDITS},
  'plan-gated': {products: [], images: {}, used: 0},
  // Sau khi generate: selection ĐÃ XOÁ, job lên đầu trang
  'job-queued': {products: [], images: {}, used: 14},
  'job-processing': {products: [], images: {}, used: 14},
  'partial-fail': {products: [], images: {}, used: 14},
  'job-failed': {products: [], images: {}, used: 14},
  'no-permission': {products: ['p-3'], images: {'p-3': [0, 1]}, used: 2},
  loading: {products: [], images: {}, used: 2},
  error: {products: [], images: {}, used: 2},
};

const imageKey = (productId: string, index: number) => `${productId}:${index}`;

export default function AiStudio() {
  const [state, setState] = useState('empty');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<Record<string, number[]>>({});
  const [batchPrompt, setBatchPrompt] = useState('');
  const [imagePrompts, setImagePrompts] = useState<Record<string, string>>({});
  /** Ảnh đang mở modal ghi đè prompt — một modal dùng chung cho mọi ảnh */
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftPrompt, setDraftPrompt] = useState('');

  const is = (...names: string[]) => names.includes(state);

  /** Đổi state = reset về đúng kịch bản, không để state cũ dính sang */
  const applyState = (value: string) => {
    const scenario = SCENARIOS[value] ?? SCENARIOS.empty;
    setState(value);
    setSelectedProducts(scenario.products);
    setSelectedImages(scenario.images);
    setBatchPrompt(scenario.batchPrompt ?? '');
    setImagePrompts(scenario.imagePrompts ?? {});
    setGateStep('pending');
  };

  const scenario = SCENARIOS[state] ?? SCENARIOS.empty;
  const used = scenario.used;
  const remaining = Math.max(0, TOTAL_CREDITS - used);

  /**
   * Ba bước của gate disclaimer (Stella 08 Aug 2026): pending → thanks (đếm ngược 3s) →
   * done. Nút Generate ẩn ở hai bước đầu. Gate là MỘT LẦN CHO MỖI SHOP nên có ở cả hai
   * tab sinh video. Chi tiết: `app.ai-studio.$id.tsx`.
   */
  const [gateStep, setGateStep] = useState<'pending' | 'thanks' | 'done'>('pending');
  const gateActive = is('disclaimer-first-run') && gateStep !== 'done';
  const planGated = is('plan-gated');
  const readOnly = is('no-permission');
  const loading = is('loading');
  const hasError = is('error');
  const jobRunning = is('job-queued', 'job-processing');

  const products = selectedProducts
    .map((id) => catalogProducts.find((product) => product.id === id))
    .filter((product): product is CatalogProduct => Boolean(product));

  const imageCount = Object.values(selectedImages).reduce((sum, list) => sum + list.length, 0);
  const customPromptCount = Object.keys(imagePrompts).filter((key) => {
    const [productId, index] = key.split(':');
    return selectedImages[productId]?.includes(Number(index));
  }).length;

  const cost = imageCount;
  const cannotAfford = cost > remaining;
  const quotaBlocked = remaining <= 0;
  const largeBatch = imageCount >= LARGE_BATCH;
  const productsWithoutImages = products.filter((product) => product.imageCount === 0);

  /** Vì sao Generate không bấm được — thứ tự = nguyên nhân cụ thể trước, chung sau */
  const blockedReason = planGated
    ? null
    : gateActive
      ? 'Confirm you understand how AI videos differ from customer reviews before generating.'
      : readOnly
      ? 'Only staff with access to this app can spend AI credits. Ask your store owner for access.'
      : jobRunning
        ? 'A batch is already generating. Wait for it to finish so you don’t spend credits twice.'
        : quotaBlocked
          ? 'You have 0 credits left. Credits reset on 1 September.'
          : cannotAfford
            ? `This batch needs ${cost} credits but you only have ${remaining} left.`
            : productsWithoutImages.length > 0 && imageCount === 0
              ? `${productsWithoutImages[0].title} has no images yet. Add a product image in your catalog first.`
              : imageCount === 0
                ? 'Select at least one product image to generate from.'
                : null;

  const jobStatus: JobStatus | null = is('job-queued')
    ? 'queued'
    : is('job-processing')
      ? 'processing'
      : is('partial-fail')
        ? 'done'
        : is('job-failed')
          ? 'failed'
          : null;

  const toggleImage = (productId: string, index: number) => {
    setSelectedImages((current) => {
      const list = current[productId] ?? [];
      return {
        ...current,
        [productId]: list.includes(index)
          ? list.filter((value) => value !== index)
          : [...list, index],
      };
    });
  };

  const selectAllImages = (productId: string, count: number) => {
    setSelectedImages((current) => ({
      ...current,
      [productId]: Array.from({length: count}, (_, index) => index),
    }));
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts((current) => current.filter((id) => id !== productId));
    setSelectedImages((current) => {
      const next = {...current};
      delete next[productId];
      return next;
    });
  };

  const openPromptModal = (key: string) => {
    setEditingKey(key);
    setDraftPrompt(imagePrompts[key] ?? batchPrompt);
  };

  const savePrompt = () => {
    if (!editingKey) return;
    setImagePrompts((current) => ({...current, [editingKey]: draftPrompt}));
  };

  const resetPrompt = () => {
    if (!editingKey) return;
    setImagePrompts((current) => {
      const next = {...current};
      delete next[editingKey];
      return next;
    });
    setDraftPrompt(batchPrompt);
  };

  return (
    <s-page heading="AI Studio">
      {/* Nút Generate ĐẶT TRONG slot="primary-action" — app thật để nó ngoài slot nên
          bị cắt mất chữ ở lề phải ("Generate image…"). Batch lớn thì nút mở confirm
          modal thay vì generate luôn. */}
      {/* Gate disclaimer còn hoạt động thì ẨN nút Generate — banner đang chặn cả trang và
          tự giải thích, thêm một nút xám cạnh nó là nhiễu. Cùng cách với tab Creator video. */}
      {gateActive ? null : planGated ? (
        <s-button slot="primary-action" variant="primary" href="/app/billing">
          Upgrade to Growth
        </s-button>
      ) : (
        <s-button
          slot="primary-action"
          variant="primary"
          disabled={Boolean(blockedReason)}
          {...(largeBatch && !blockedReason
            ? {command: '--show' as const, commandFor: 'confirm-batch'}
            : {})}
        >
          {/* Chưa chọn gì thì KHÔNG viết "Generate 0 videos" — số 0 trong nhãn nút
              đọc như lỗi. Bỏ số đi, lý do disable đã nằm ở aside. */}
          {cost === 0 ? 'Generate videos' : `Generate ${cost} ${cost === 1 ? 'video' : 'videos'}`}
        </s-button>
      )}

      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={applyState}
          states={STATES}
          globalNote={<AiStudioPageNotes />}
        />

        {/* Thêm 07 Aug 2026 — AI Studio thành 3 luồng dưới MỘT mục nav.
            Nội dung tab này (catalog) KHÔNG đổi; chỉ thêm thanh điều hướng.
            Lý do chọn 3 tab thay vì 3 mục nav: xem `components/AiStudioTabs.tsx`. */}
        <AiStudioTabs active="/app/ai-studio/product" />

        {gateActive && gateStep === 'pending' ? (
          <AiDisclaimer onAcknowledge={() => setGateStep('thanks')} />
        ) : gateStep === 'thanks' ? (
          /* Banner cảm ơn TỰ TẮT sau 3s, vòng tròn đếm ngược bên trái.
             Không có nút đóng: nó tự đi, thêm nút là mời merchant làm một việc vô nghĩa. */
          <s-banner tone="success" heading="Thank you, enjoy generating!">
            <s-grid
              gap="small-200"
              alignItems="center"
              gridTemplateColumns="max-content minmax(0, 1fr)"
            >
              <CountdownRing seconds={3} onDone={() => setGateStep('done')} />
              <s-text color="subdued">This closes on its own.</s-text>
            </s-grid>
          </s-banner>
        ) : (
          <ActionZone state={state} total={TOTAL_CREDITS} />
        )}

        {planGated ? (
          // Plan-gated: bán giá trị + đường lên. KHÔNG ẩn tính năng.
          <s-section>
            <EmptyState
              isEmptyState
              heading="Turn your product photos into videos"
              body="Pick products from your catalog, choose which photos to use, and get a shoppable video for each one. Available on Growth and above."
              actionLabel="Upgrade to Growth"
              actionHref="/app/billing"
              secondaryLabel="How credits work"
              secondaryHref="#"
            />
          </s-section>
        ) : hasError ? null : (
          <>
            {/* ══ 1. PRODUCTS & IMAGES — bước đầu, cụ thể nhất ══ */}
            <s-section heading="Products & images">
              <s-stack direction="block" gap="base">
                {loading ? (
                  <s-box padding="large-200">
                    <s-stack direction="block" gap="small-100" alignItems="center">
                      <s-spinner size="large" accessibilityLabel="Loading your catalog" />
                      <s-text color="subdued">Loading your catalog</s-text>
                    </s-stack>
                  </s-box>
                ) : products.length === 0 ? (
                  <EmptyState
                    isEmptyState
                    heading="Start with your catalog"
                    body="Select one or more products, then pick which photos become videos. Each photo you pick becomes one video."
                    actionLabel="Browse products"
                    actionHref="#"
                  />
                ) : (
                  <>
                    <s-stack direction="inline" gap="small-200" alignItems="center">
                      {/* In real app: shopify.resourcePicker({type: 'product', multiple: true}) */}
                      <s-button disabled={readOnly}>Add products</s-button>
                      <s-button
                        variant="tertiary"
                        disabled={readOnly}
                        onClick={() => {
                          setSelectedProducts([]);
                          setSelectedImages({});
                        }}
                      >
                        Clear
                      </s-button>
                      {/* Số ảnh có prompt riêng ở đây vì nút Generate không nói được,
                          và Review batch (chỗ cũ) đã bỏ. */}
                      <s-text color="subdued">
                        {products.length} {products.length === 1 ? 'product' : 'products'} ·{' '}
                        {imageCount} {imageCount === 1 ? 'photo' : 'photos'} selected
                        {customPromptCount > 0
                          ? ` · ${customPromptCount} with a custom prompt`
                          : ''}
                      </s-text>
                    </s-stack>

                    {products.map((product) => {
                      const picked = selectedImages[product.id] ?? [];

                      return (
                        <s-box
                          key={product.id}
                          border="base"
                          borderRadius="base"
                          padding="base"
                        >
                          <s-stack direction="block" gap="small">
                            <s-stack
                              direction="inline"
                              gap="small-200"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <s-stack direction="block" gap="small-500">
                                <s-text type="strong">{product.title}</s-text>
                                <s-text color="subdued">
                                  {picked.length} of {product.imageCount} photos selected
                                </s-text>
                              </s-stack>
                              <s-stack direction="inline" gap="small-200" alignItems="center">
                                {product.imageCount > 0 && (
                                  <s-button
                                    variant="tertiary"
                                    disabled={readOnly}
                                    onClick={() =>
                                      selectAllImages(product.id, product.imageCount)
                                    }
                                  >
                                    Select all {product.imageCount}
                                  </s-button>
                                )}
                                <s-button
                                  variant="tertiary"
                                  icon="x"
                                  accessibilityLabel={`Remove ${product.title} from this batch`}
                                  disabled={readOnly}
                                  onClick={() => removeProduct(product.id)}
                                />
                              </s-stack>
                            </s-stack>

                            {product.imageCount === 0 ? (
                              // Dead-end im lặng nếu không nói ra: chọn xong mà Generate
                              // vẫn disabled và merchant không hiểu vì sao.
                              <s-banner tone="warning" heading="This product has no photos">
                                <s-paragraph>
                                  AI Studio starts from a product photo. Add at least one image to
                                  this product in your catalog, then come back.
                                </s-paragraph>
                                <s-button slot="secondary-actions" href="#" target="_blank">
                                  Open product
                                </s-button>
                              </s-banner>
                            ) : (
                              <s-grid
                                gap="small"
                                gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))"
                              >
                                {Array.from({length: product.imageCount}, (_, index) => {
                                  const key = imageKey(product.id, index);
                                  const selected = picked.includes(index);
                                  const hasCustom = Boolean(imagePrompts[key]);

                                  return (
                                    <s-stack key={key} direction="block" gap="small-400">
                                      {/* Đây LÀ chỗ hover xám của `s-clickable` đúng mong
                                          muốn: tile chọn được thì phải có phản hồi hover.
                                          (Ở setup guide của Home thì ngược lại — xem
                                          MAKEUGC-UI-PATTERNS §7c.) */}
                                      <s-clickable
                                        borderRadius="base"
                                        border="base"
                                        padding="small-400"
                                        disabled={readOnly}
                                        accessibilityLabel={`${selected ? 'Deselect' : 'Select'} photo ${index + 1} of ${product.title}`}
                                        onClick={() => toggleImage(product.id, index)}
                                      >
                                        <s-stack direction="block" gap="small-400">
                                          <s-image
                                            src={productImage(product.id, index)}
                                            alt={`${product.title} — photo ${index + 1}`}
                                            aspectRatio="1"
                                            objectFit="cover"
                                            borderRadius="base"
                                            loading="lazy"
                                          />
                                          {/* Trạng thái có ICON + TEXT, không chỉ màu.
                                              Badge "Custom" nằm CÙNG dòng này để mọi tile
                                              cao bằng nhau — badge trên một dòng riêng làm
                                              grid lệch dòng. */}
                                          {selected ? (
                                            <s-stack
                                              direction="inline"
                                              gap="small-400"
                                              alignItems="center"
                                            >
                                              <s-icon
                                                type="check-circle"
                                                tone="success"
                                                size="small"
                                              />
                                              <s-text>Selected</s-text>
                                              {hasCustom && <s-badge tone="info">Custom</s-badge>}
                                            </s-stack>
                                          ) : (
                                            <s-text color="subdued">Not selected</s-text>
                                          )}
                                        </s-stack>
                                      </s-clickable>

                                      {/* Footer LUÔN có nội dung: tile chọn/chưa chọn cao
                                          bằng nhau thì grid không lệch dòng. Tile chưa chọn
                                          nói lý do thay vì để một nút disabled. */}
                                      {selected ? (
                                        <s-button
                                          variant="tertiary"
                                          icon="edit"
                                          disabled={readOnly}
                                          command="--show"
                                          commandFor="prompt-modal"
                                          onClick={() => openPromptModal(key)}
                                        >
                                          {hasCustom ? 'Edit prompt' : 'Add prompt'}
                                        </s-button>
                                      ) : (
                                        <s-text color="subdued">Select to add a prompt</s-text>
                                      )}
                                    </s-stack>
                                  );
                                })}
                              </s-grid>
                            )}
                          </s-stack>
                        </s-box>
                      );
                    })}
                  </>
                )}
              </s-stack>
            </s-section>

            {/* ══ 2. PROMPT — THIẾT KẾ MỚI, app thật chưa có ══ */}
            <s-section heading="Prompt">
              <s-stack direction="block" gap="base">
                <s-paragraph color="subdued">
                  Applies to every photo in this batch. Leave it empty for a plain product
                  showcase.
                </s-paragraph>

                {/* Preset ĐIỀN vào textarea rồi sửa tiếp được — không phải mode ẩn.
                    Merchant phải thấy đúng chuỗi được gửi đi, và đọc preset là học
                    được cách viết prompt. */}
                {/* Đổi sang FilterPills 07 Aug 2026 để hai tab của AI Studio không có hai
                    kiểu chip khác nhau. Nội dung preset KHÔNG đổi. */}
                <FilterPills
                  ariaLabel="Prompt presets"
                  options={promptPresets.map((preset) => preset.label)}
                  active={null}
                  onPick={(label) => {
                    const preset = promptPresets.find((item) => item.label === label);
                    if (preset) setBatchPrompt(preset.text);
                  }}
                />

                <s-text-area
                  label="What should the video show?"
                  value={batchPrompt}
                  onInput={(event) => setBatchPrompt(event.currentTarget.value)}
                  maxLength={PROMPT_MAX}
                  rows={4}
                  disabled={readOnly}
                  details="Describe the shot, not the product — we already know what it is from the photo."
                />

              </s-stack>
            </s-section>

            {/* Đã BỎ (Stella, 05 Aug 2026):
                - khối "What gets rejected": nội dung là phỏng đoán, và lời hứa hoàn
                  credit vẫn xuất hiện ĐÚNG LÚC cần — trong `JobProgress` khi job fail
                  ("12 credits refunded"). Enterprise §1 yêu cầu nói ở state fail, không
                  yêu cầu nói trước.
                - section "Creator & language": rủi ro listing claim avatar/language
                  không còn được đánh dấu TRÊN UI, nhưng vẫn nằm ở `open[]` của registry,
                  Notion Decisions Log và MAKEUGC-UI-PATTERNS §3b. */}

            {/* Đã BỎ section "Review batch" (Stella, 05 Aug 2026).
                Cost preview không mất — `CreditMeter` ở aside đã nói ("This will use 12
                of your 2,498 remaining credits"), nên section này là nói lại lần hai.
                Hai thứ nó đang giữ đã dọn xuống aside: lý do Generate bị disable, và
                banner cannot-afford / batch lớn. Số ảnh có prompt riêng dọn lên dòng
                tóm tắt của Products & images. */}
          </>
        )}
      </s-stack>

      {/* ══ ASIDE ══ */}
      <s-stack slot="aside" direction="block" gap="base">
        {/* Thay CẢ pill "Credits: 2,500" ở header LẪN card Credits ở rail của app thật —
            credit nói đúng một lần. Đoạn 4 dòng cơ chế credit không nằm ở đây.
            planGated thì KHÔNG render: cả trang đã là một lời mời upgrade, thêm
            banner "available on Growth and above" ở aside là nói lại y nguyên. */}
        {!planGated && (
          <CreditMeter
            used={used}
            total={TOTAL_CREDITS}
            resetDate="1 September"
            planName="Scale"
            pendingCost={cost === 0 ? undefined : cost}
            compact
          />
        )}

        {/* Chuyển từ section "Review batch" xuống đây.
            Nút Generate nằm trong `slot="primary-action"` nên KHÔNG đặt được text cạnh
            nó, và tooltip thì không mở trên control disabled → lý do phải hiện thành
            text ở một chỗ merchant nhìn trước khi bấm. Đặt ngay dưới CreditMeter vì đó
            là chỗ đã nói về credit. */}
        {!planGated && (cannotAfford || largeBatch || blockedReason) && (
          <s-stack direction="block" gap="small-200">
            {cannotAfford && !quotaBlocked && (
              <s-banner
                tone="critical"
                heading={`Not enough credits for ${cost} ${cost === 1 ? 'video' : 'videos'}`}
              >
                <s-paragraph>
                  Deselect {cost - remaining} {cost - remaining === 1 ? 'photo' : 'photos'} to fit
                  your remaining {remaining}, or upgrade for more credits this month.
                </s-paragraph>
                <s-button slot="secondary-actions" href="/app/billing">
                  Compare plans
                </s-button>
              </s-banner>
            )}

            {largeBatch && !cannotAfford && (
              <s-banner tone="warning" heading={`${imageCount} videos in one batch`}>
                <s-paragraph>
                  This spends {cost} credits at once. We&apos;ll ask you to confirm before
                  starting.
                </s-paragraph>
              </s-banner>
            )}

            {/* Bọc trong box: text trần nằm giữa hai card trông như bị rơi ra ngoài */}
            {blockedReason && (
              <s-box background="subdued" borderRadius="base" padding="small">
                <s-text color="subdued">{blockedReason}</s-text>
              </s-box>
            )}
          </s-stack>
        )}

        {!planGated && (
          <s-section heading="What happens next">
            <s-stack direction="block" gap="small-200">
              {[
                ['1', 'We generate your videos', 'You land in Library while they run'],
                ['2', 'You review each one', 'Nothing publishes automatically'],
                ['3', 'Tag products, then publish', 'Untagged videos can’t be bought from'],
              ].map(([step, label, detail]) => (
                <s-stack key={step} direction="inline" gap="small-200" alignItems="start">
                  <s-badge tone="neutral">{step}</s-badge>
                  <s-stack direction="block" gap="small-500">
                    <s-text>{label}</s-text>
                    <s-text color="subdued">{detail}</s-text>
                  </s-stack>
                </s-stack>
              ))}
              {/* Đã BỎ đoạn "Credits are a hard limit…" (Stella, 05 Aug 2026).
                  Chuyện hết credit vẫn được nói ĐÚNG LÚC: banner critical ở action zone
                  khi hết, và cost preview trong CreditMeter trước khi bấm. */}
            </s-stack>
          </s-section>
        )}
      </s-stack>

      {/* ══ MODAL: ghi đè prompt cho MỘT ảnh ══
          Một modal dùng chung cho mọi ảnh. Render 28 textarea cho batch 28 ảnh là
          không dùng được. `s-modal` KHÔNG có prop `open` → mở bằng
          command="--show" commandFor trên nút, đóng bằng command="--hide". */}
      {/* `accessibilityLabel` là BẮT BUỘC trên s-modal, không phải chỉ `heading`:
          Polaris warn ra console "accessibilityLabel is recommended when scroll-box is
          provided" vì phần thân modal là scroll-box. */}
      <s-modal
        id="prompt-modal"
        heading="Custom prompt for this photo"
        accessibilityLabel="Custom prompt for this photo"
      >
        <s-stack direction="block" gap="base">
          <s-paragraph color="subdued">
            This replaces the batch prompt for this one photo. Everything else in the batch keeps
            the prompt above.
          </s-paragraph>
          <s-text-area
            label="Prompt for this photo"
            value={draftPrompt}
            onInput={(event) => setDraftPrompt(event.currentTarget.value)}
            maxLength={PROMPT_MAX}
            rows={4}
          />
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          command="--hide"
          commandFor="prompt-modal"
          onClick={savePrompt}
        >
          Save
        </s-button>
        <s-button
          slot="secondary-actions"
          command="--hide"
          commandFor="prompt-modal"
          onClick={resetPrompt}
        >
          Reset to batch prompt
        </s-button>
      </s-modal>

      {/* ══ MODAL: confirm batch lớn ══
          Confirm PHẢI có số lượng cụ thể — "Generate selected?" là vô dụng khi
          một click đốt được hàng trăm credit. */}
      <s-modal
        id="confirm-batch"
        heading={`Generate ${imageCount} videos?`}
        accessibilityLabel={`Confirm generating ${imageCount} videos`}
      >
        <s-stack direction="block" gap="small">
          <s-paragraph>
            This spends <s-text type="strong">{cost} credits</s-text> and leaves{' '}
            {(remaining - cost).toLocaleString()}. Generation runs in the background — you can keep
            working.
          </s-paragraph>
          <s-paragraph color="subdued">
            You can cancel from the job card while it runs. Anything that fails is refunded.
          </s-paragraph>
        </s-stack>
        {/* In real app: tạo job → navigate('/app/library') client-side */}
        <s-button
          slot="primary-action"
          variant="primary"
          command="--hide"
          commandFor="confirm-batch"
        >
          Generate {imageCount} videos
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="confirm-batch">
          Cancel
        </s-button>
      </s-modal>
    </s-page>
  );
}

/**
 * Action zone — tối đa MỘT thứ, xếp theo thứ tự thiệt hại.
 * Giống Home: xếp sai thứ tự thì merchant xử lý việc nhỏ trước việc đang mất tiền.
 */
function ActionZone({state, total}: {state: string; total: number}) {
  if (state === 'error') {
    return (
      <s-banner tone="critical" heading="Couldn't load your catalog">
        <s-paragraph>
          We couldn&apos;t reach Shopify to list your products. Videos you already generated are
          safe in your Library — only this page is affected.
        </s-paragraph>
        <s-button slot="secondary-actions">Retry</s-button>
      </s-banner>
    );
  }

  if (state === 'job-queued') {
    return <JobProgress status="queued" title="12 videos queued" total={12} />;
  }

  if (state === 'job-processing') {
    return (
      <JobProgress
        status="processing"
        title="Generating 12 videos"
        done={4}
        total={12}
        etaLabel="~4 min left"
        onCancel={() => {}}
        resultHref="/app/library"
      />
    );
  }

  if (state === 'partial-fail') {
    return (
      <JobProgress
        status="done"
        title="Generating 12 videos"
        done={9}
        total={12}
        failedCount={3}
        creditNote="3 credits refunded"
        onRetry={() => {}}
        resultHref="/app/library"
      />
    );
  }

  if (state === 'job-failed') {
    return (
      <JobProgress
        status="failed"
        title="Generating 12 videos"
        total={12}
        errorMessage="The provider rejected the prompt — it names a competitor brand, which their content policy blocks."
        creditNote="12 credits refunded"
        onRetry={() => {}}
      />
    );
  }

  if (state === 'no-permission') {
    return (
      <s-banner tone="warning" heading="You can't spend AI credits">
        <s-paragraph>
          Generating videos uses your store&apos;s credits, so it needs staff access to this app.
          You can still browse your catalog. Ask your store owner to grant access.
        </s-paragraph>
      </s-banner>
    );
  }

  if (state === 'quota-blocked') {
    return (
      <s-banner tone="critical" heading={`You've used all ${total.toLocaleString()} AI credits`}>
        <s-paragraph>
          Credits reset on 1 September. You can still pick photos and write a prompt now — the
          batch will be ready to run then.
        </s-paragraph>
        <s-button slot="secondary-actions" href="/app/billing">
          Upgrade for more credits
        </s-button>
      </s-banner>
    );
  }

  return null;
}

/** Note cấp trang — đúng ở mọi state */
function AiStudioPageNotes() {
  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="block" gap="small-300">
        <s-text type="strong">Rule cấp trang — đúng ở mọi state</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              Mô hình: <s-text type="strong">1 ảnh product = 1 credit = 1 video</s-text>. Không có
              script, không chọn creator, không chọn ngôn ngữ (chưa build).
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Nút Generate nằm trong <s-text type="strong">slot=&quot;primary-action&quot;</s-text>{' '}
              nên không đặt được text cạnh nó → lý do disable luôn nằm ở aside, ngay dưới CreditMeter.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Action zone chỉ render <s-text type="strong">MỘT</s-text> thứ, ưu tiên theo thiệt
              hại: error → job → no-permission → quota-blocked.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Job đang chạy: card chi tiết (có Cancel) chỉ ở <s-text type="strong">đây</s-text> —
              nơi bấm là nơi được huỷ. Library hiện MỘT banner info; mọi trang khác dùng
              GlobalJobProgress.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>

      <s-stack direction="block" gap="small-300">
        <s-text type="strong">⚠️ Khác app đang chạy — cần chốt</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">Bỏ hẳn &quot;Image ad&quot;</s-text> (Stella chốt 05 Aug 2026):
              ảnh quảng cáo không vào được vòng video → widget → tag product → revenue, nhưng tiêu
              credit cùng pool. Hệ quả: Library bỏ filter <s-text type="strong">Images</s-text>.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">Section Prompt là thiết kế mới</s-text> — app hiện chưa có input
              nào. Prompt cấp batch + ghi đè lẻ từng ảnh.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              🛑 Listing đã submit claim <s-text type="strong">1000+ avatars / 50+ languages</s-text>{' '}
              mà app không có picker nào → rủi ro Shopify reject. Phải chốt: sửa listing, hay ship
              trước review.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Chỉ <s-text type="strong">Scale = 2.500 credit/mo</s-text> là verify được từ app;
              Growth = 50 vẫn là phỏng đoán. <s-text type="strong">Starter không có AI credit</s-text>{' '}
              (Stella chốt 06 Aug 2026 theo roadmap &quot;Growth plan up&quot;) → state{' '}
              <s-text type="strong">plan-gated</s-text> áp cho cả Free Forever lẫn Starter, không
              chỉ Free.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>
    </s-stack>
  );
}
