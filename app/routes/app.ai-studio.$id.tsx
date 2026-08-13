/**
 * MOCKUP — AI Studio → Creator video · COMPOSE
 * (viết lại 07 Aug 2026 vòng 2 theo review của Stella + luồng platform)
 *
 * ═══ BỐN SECTION ═══
 *   0. Template đã chọn — thumb TRÁI, chữ PHẢI
 *   1. Product        — modal danh sách có search · description có nút AI tóm tắt
 *   2. Dialog         — MỘT card, AI script writer là chế độ bên trong, không phải ô thứ hai
 *   3. Creator        — **Optional**, mặc định TRỐNG · đổi creator thì ĐẮT HƠN và phải chọn model
 *   aside             — CreditMeter + lý do Generate disabled + What happens next
 *
 * ═══ ĐỔI CREATOR = TIÊU THÊM CREDIT (Stella 13 Aug 2026) ═══
 *
 * Giữ creator của template: 150 credits (`VIDEO_CREDITS`), không phải chọn gì.
 * Đổi creator: dựng lại người trên khung hình → phải chọn model, giá theo model
 * (Seedance 2.0 = 250 · Seedance 2.5 = 400, xem `creatorModels`).
 *
 * Ba thứ ràng buộc lẫn nhau ở đây, làm hụt một cái là UI nói dối về tiền:
 *   1. Section Creator cảnh báo TRƯỚC khi bấm — không phải sau khi đã vào modal.
 *   2. Nút Generate ở header là NGUỒN DUY NHẤT của con số cuối. Đổi model là nó đổi theo.
 *   3. Không đủ credit cho model rẻ nhất → tính năng Creator khoá hẳn, nhưng video VẪN
 *      generate được với creator có sẵn. "Hết credit cho Creator" ≠ "hết credit cho video";
 *      gộp hai câu đó là đẩy merchant đi upgrade khi họ không cần.
 *
 * Modal model KHÔNG commit gì cho tới khi bấm "Use this model": bỏ ngang ở bước chọn
 * model mà creator đã dính vào form là giá nhảy sau lưng merchant.
 *
 * ═══ NĂM THỨ SỬA SO VỚI VÒNG 1 ═══
 *
 * • **Creator là TUỲ CHỌN và mặc định TRỐNG.** Vòng 1 tôi hiểu sai: creator trong template
 *   KHÔNG nằm trong kho avatar, nên không có gì để hiện sẵn. Không đụng vào thì video giữ
 *   nguyên người có sẵn trong template. Chỉ khi bấm "Change creator" mới mở modal.
 *
 * • **Dialog gộp một card.** Vòng 1 có hai ô nhập (brief + dialog) cạnh nhau → merchant
 *   thấy hai chỗ viết lời thoại, không biết cái nào thật. Platform làm đúng: MỘT vùng, bấm
 *   "AI script writer" thì chính vùng đó đổi sang nhập ý tưởng + góc kể + Generate/Cancel.
 *
 * • **Add speech emotion chèn thẳng thẻ `[excited]` vào script** tại vị trí con trỏ, đúng
 *   platform — không phải một nút trang trí.
 *
 * • **Chọn product qua modal có search.** Store có thể có hàng nghìn sản phẩm; lưới phẳng
 *   không dùng được.
 *
 * • **Bỏ hẳn section Quality/Mode.** Mặc định Nova 2.0 cho tiết kiệm. Danh sách model thật
 *   vẫn chờ Duong — vẽ bộ radio toàn placeholder là mời người ta quyết trên số bịa.
 *
 * Route file thật: app/routes/app.ai-studio.$id.tsx
 */
import {Fragment, useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';

import AiDisclaimer from '../components/AiDisclaimer';
import AiStudioTabs from '../components/AiStudioTabs';
import AudioSettings, {type VoiceSettings} from '../components/AudioSettings';
import CreditMeter from '../components/CreditMeter';
import JobProgress from '../components/JobProgress';
import StateSwitcher from '../components/StateSwitcher';
import type {StateOption} from '../components/StateSwitcher';
import {CountdownRing, FilterPills, MediaPlaceholder} from '../components/primitives';
import {
  CHARS_PER_SECOND,
  CREATOR_MODEL_MIN_CREDITS,
  DIALOG_MAX,
  PRODUCT_DESC_MAX,
  actorAges,
  actorGenders,
  actorPortrait,
  actorSkinTones,
  actorStyles,
  actors,
  catalogProducts,
  creatorModelById,
  creatorModels,
  planCredits,
  productImage,
  scriptAngles,
  shotAlt,
  speechEmotions,
  templateById,
  templateThumb,
  VIDEO_CREDITS,
  voiceDefaults,
} from '../data/sample';
import type {Actor} from '../data/sample';

/** Mockup giả định shop ở plan Scale — lấy số từ `PLANS`, đừng gõ tay (xem `planCredits`) */
const TOTAL_CREDITS = planCredits('scale');

const DEMO_DIALOG =
  'I kept losing my keys in my old bag. This one has a pocket right at the top, so they are always there. Three weeks in, still perfect.';
const AI_DIALOG =
  '[thoughtful] I kept losing my keys in my old bag. This one has a pocket right at the top. [excited] Three weeks in, still perfect.';

const STATES: StateOption[] = [
  {
    value: 'disclaimer-first-run',
    label: 'Disclaimer lần đầu — chặn generate tới khi tick',
    doc: [
      {section: 'Action zone', rule: 'Banner CHẶN generate tới khi merchant tick. Nút "Continue" disabled khi chưa tick — nút trần thì merchant bấm qua theo phản xạ và không có ghi nhận nào đáng tin.'},
      {section: 'Action zone', rule: 'Chỉ hiện MỘT lần cho mỗi shop. Dòng gọn ở aside thì sống mãi — hộp thoại một lần không ai đọc lần thứ hai, mà quyết định sai lại xảy ra ở lần thứ hai.'},
      {section: '⚠️ Giới hạn pháp lý', rule: 'Disclaimer chuyển được nghĩa vụ DEPLOYER (EU AI Act 50(4), NY 396-b) sang merchant. KHÔNG chuyển được nghĩa vụ PROVIDER (Art 50(2) — dấu machine-readable), và KHÔNG chuyển được FTC 16 CFR 465 vì điều khoản đó phạt cả bên PHÁT TÁN — mà app này chính là bên đẩy video lên storefront.'},
    ],
  },
  {
    value: 'empty',
    label: 'Empty — vừa vào từ gallery, chưa nhập gì',
    doc: [
      {section: 'Creator', rule: 'Mặc định TRỐNG và ghi rõ "Optional". Creator của template KHÔNG nằm trong kho avatar — không đụng vào thì video giữ nguyên người có sẵn trong template.'},
      {section: 'Page action', rule: 'Generate disabled. Lý do là TEXT trong aside dưới CreditMeter — tooltip không mở được trên control disabled, và nút nằm trong slot header nên không đặt text cạnh được.'},
      {section: 'Dialog', rule: 'Đồng hồ giây hiện ngay từ 0. Đợi merchant gõ xong mới hiện thì họ đã viết đoạn dài mới biết bị giới hạn.'},
      {section: 'Product', rule: 'Nút AI "Summarise from product details" disabled kèm lý do bằng text khi chưa chọn product — không dùng tooltip.'},
    ],
  },
  {
    value: 'filled',
    label: 'Đã nhập đủ — sẵn sàng generate',
    doc: [
      {section: 'Aside', rule: 'Cost preview so với credit CÒN LẠI, không chỉ nói "150 credits".'},
      {section: 'Creator', rule: 'Vẫn để trống — merchant không bắt buộc chọn creator. Đây là đường 90% sẽ đi.'},
    ],
  },
  {
    value: 'ai-writer',
    label: 'AI script writer — đang ở chế độ nhập ý tưởng',
    doc: [
      {section: 'Dialog', rule: 'MỘT card, ĐỔI CHẾ ĐỘ chứ không đẻ ô thứ hai. Đúng luồng platform: Cancel AI writer + Generate ở trên, ô ý tưởng, rồi hàng góc kể.'},
      {section: 'Dialog', rule: 'Cancel quay lại dialog cũ KHÔNG mất chữ đã gõ. Ghi đè bản merchant sửa tay là lỗi không tha thứ được.'},
      {section: 'Dialog', rule: 'Generate disabled tới khi có ý tưởng — nút sinh ra từ ô trống là nút hỏng.'},
    ],
  },
  {
    value: 'ai-written',
    label: 'AI vừa sinh script — có thẻ cảm xúc [ ]',
    doc: [
      {section: 'Dialog', rule: 'Thẻ [thoughtful] / [excited] nằm THẲNG trong lời thoại, đúng platform — không phải metadata bên ngoài.'},
      {section: 'Dialog', rule: '"Add speech emotion" chèn thẻ vào đúng vị trí con trỏ, không nối vào cuối.'},
    ],
  },
  {
    value: 'dialog-too-long',
    label: 'Dialog vượt 15 giây',
    doc: [
      {section: 'Dialog', rule: 'Cảnh báo TRƯỚC khi tiêu credit — backend cắt hoặc tua nhanh thì merchant chỉ biết sau khi đã trả tiền.'},
      {section: 'Page action', rule: 'Generate VẪN bấm được: đây là cảnh báo chất lượng, không phải lỗi dữ liệu.'},
    ],
  },
  {
    value: 'creator-swapped',
    label: 'Đã đổi creator + chọn Seedance 2.0 + chỉnh giọng',
    doc: [
      {section: 'Creator', rule: 'Chọn rồi thì hiện thẻ actor + Change / Remove. Remove đưa về mặc định = dùng creator có sẵn của template, giá về 150.'},
      {section: 'Creator', rule: 'Hàng model nằm TRONG thẻ creator, không phải section riêng: model chỉ tồn tại vì đã đổi creator. Có model = có giá, nên hai thứ đó phải đọc được cùng một chỗ.'},
      {section: 'Creator', rule: 'Ghi rõ chênh bao nhiêu so với 150 của template. "250 credits" một mình không trả lời được câu merchant đang hỏi: đổi creator thì tôi mất thêm bao nhiêu.'},
      {section: 'Page action', rule: 'Nút Generate hiện 250, không phải 150. Đây là nguồn duy nhất của con số cuối.'},
      {section: 'Creator', rule: 'Chỉ số giọng đã đổi thì có badge "Custom voice" — không thì merchant không biết mình đã chỉnh gì.'},
    ],
  },
  {
    value: 'creator-model-2-5',
    label: 'Đã đổi creator + chọn Seedance 2.5 (400 credits)',
    doc: [
      {section: 'Page action', rule: 'Cùng một creator, đổi model là nút Generate nhảy 250 → 400. Nếu số ở nút không đổi theo model thì bỏ luôn tính năng chọn model đi.'},
      {section: 'Aside', rule: 'Cost preview của CreditMeter ăn theo cùng một biến `cost` — hai chỗ nói hai số là mất tin vào bảng giá.'},
    ],
  },
  {
    value: 'creator-2-5-unaffordable',
    label: 'Đủ credit cho Seedance 2.0, KHÔNG đủ cho 2.5 (còn 300)',
    doc: [
      {section: 'Modal model', rule: 'Radio 2.5 disabled + lý do bằng TEXT trong `slot="details"` ("Needs 400, you have 300"). KHÔNG dùng tooltip: `interestFor` không mở được trên control disabled.'},
      {section: 'Modal model', rule: 'KHÔNG ẩn model không đủ tiền. Ẩn thì merchant không biết tồn tại một bản chất lượng cao hơn — mà đó chính là lý do họ sẽ upgrade.'},
      {section: 'Creator', rule: 'Nút "Change creator" vẫn bấm được: còn 300 > 250 nên tính năng Creator vẫn dùng được, chỉ hụt bản cao cấp.'},
    ],
  },
  {
    value: 'creator-locked',
    label: 'Không đủ cho CẢ HAI model — Creator khoá, video vẫn generate được',
    doc: [
      {section: 'Creator', rule: 'Nút "Change creator" disabled + lý do bằng text: cần ít nhất 250, còn 200. Vẫn nói ra là video generate được bình thường với 150 — đây là chỗ dễ làm merchant tưởng cả trang chết.'},
      {section: 'Page action', rule: 'Generate VẪN bấm được (150 ≤ 200). Chặn generate ở state này là chặn sai chỗ.'},
      {section: 'Creator', rule: 'Đường ra là Compare plans, nhưng KHÔNG phải banner critical — merchant không bị chặn làm việc, chỉ hụt một tính năng tuỳ chọn.'},
      {section: 'Creator', rule: 'Đây là state DUY NHẤT mà banner khoá Creator được phép hiện: 150 ≤ còn lại < 250 là vùng KHÔNG chỗ nào khác trên trang nói tới. Dưới 150 thì aside đã có banner credit nên chỗ này hạ xuống một dòng text.'},
    ],
  },
  {
    value: 'creator-cost-over-budget',
    label: 'Creator đã chọn nhưng credit tụt dưới giá model (còn 300, model 2.5)',
    doc: [
      {section: 'Aside', rule: 'Banner cannot-afford thêm đường ra THỨ HAI: bỏ creator để về 150. Chỉ chìa "Compare plans" khi vẫn còn cách generate trong số credit hiện có là đẩy merchant mua thứ họ chưa cần.'},
      {section: 'Creator', rule: 'Hàng model đổi tone caution + nói rõ model đang chọn vượt số credit còn lại.'},
    ],
  },
  {
    value: 'cannot-afford',
    label: 'Không đủ credit cho cả video cơ bản (còn 100)',
    doc: [
      {section: 'Aside', rule: 'Banner critical nói CẢ HAI số (cần 150, còn 100). Ở đây đường ra chỉ còn upgrade — dưới 150 thì không model nào, không cấu hình nào chạy được.'},
      {section: 'Creator', rule: 'Creator khoá, lý do là MỘT DÒNG TEXT mờ ("needs at least 250 credits"), KHÔNG phải banner. Aside đã có banner critical về credit rồi; thêm banner thứ hai ở đây là hai banner nói cùng một câu — đúng lỗi mà `CreditMeter compact` được sinh ra để tránh.'},
    ],
  },
  {
    value: 'quota-blocked',
    label: 'Quota blocked — hết sạch credit',
    doc: [
      {section: 'Action zone', rule: 'Banner critical có NGÀY RESET. Vẫn soạn được để sẵn sàng cho kỳ sau — KHÔNG ẩn form.'},
    ],
  },
  {
    value: 'job-processing',
    label: 'Job processing — có ETA + Cancel',
    doc: [
      {section: 'Action zone', rule: 'ETA ~2 phút cho video 15s (research §1.4). ⏳ Phải verify p50/p95 thật trước khi in số này lên UI.'},
      {section: 'Cả trang', rule: 'Form khoá trong lúc job chạy — tránh bấm lại lần hai tiêu credit hai lần.'},
    ],
  },
  {
    value: 'job-failed',
    label: 'Job failed — provider từ chối Dialog',
    doc: [
      {section: 'Action zone', rule: 'Lý do CỤ THỂ + Retry + số credit đã hoàn. "Something went wrong" là vô dụng — enterprise sẽ đối chiếu hoá đơn.'},
    ],
  },
  {
    value: 'no-permission',
    label: 'No permission — staff không được tiêu credit',
    doc: [
      {section: 'Cả trang', rule: 'Mọi control disabled nhưng KHÔNG ẩn, lý do là banner text.'},
    ],
  },
];

type Scenario = {
  productId?: string;
  imageIndex?: number;
  description?: string;
  dialog?: string;
  aiMode?: boolean;
  brief?: string;
  actorId?: string;
  /** Chỉ có nghĩa khi `actorId` có mặt — model là hệ quả của việc đổi creator */
  modelId?: string;
  voiceId?: string;
  voice?: VoiceSettings;
  used?: number;
};

const FILLED: Scenario = {
  productId: 'p-5',
  imageIndex: 0,
  description: 'Full-grain leather tote with a top pocket for keys and a padded laptop sleeve.',
  dialog: DEMO_DIALOG,
};

const SCENARIOS: Record<string, Scenario> = {
  empty: {used: 240},
  'disclaimer-first-run': {...FILLED, used: 240},
  filled: {...FILLED, used: 240},
  'ai-writer': {
    ...FILLED,
    dialog: '',
    aiMode: true,
    brief: 'People keep losing keys in a big tote. Friendly, not salesy.',
    used: 240,
  },
  'ai-written': {...FILLED, dialog: AI_DIALOG, used: 240},
  'dialog-too-long': {
    ...FILLED,
    dialog: `${DEMO_DIALOG} It also fits a fifteen inch laptop in the padded sleeve, and the strap adjusts long enough to wear across the body when my hands are full of shopping.`,
    used: 240,
  },
  'creator-swapped': {
    ...FILLED,
    actorId: 'ac-4',
    modelId: 'seedance-2-0',
    voiceId: 'ac-13',
    voice: {clarity: 0.9, tone: 0.35, emotion: 0.4, speed: 1.1},
    used: 240,
  },
  'creator-model-2-5': {
    ...FILLED,
    actorId: 'ac-4',
    modelId: 'seedance-2-5',
    used: 240,
  },
  // còn 300: đủ cho 2.0 (250), hụt 2.5 (400)
  'creator-2-5-unaffordable': {...FILLED, used: TOTAL_CREDITS - 300},
  // còn 200: hụt cả hai model (250/400) nhưng vẫn đủ cho video cơ bản (150)
  'creator-locked': {...FILLED, used: TOTAL_CREDITS - 200},
  // creator + 2.5 đã chọn từ trước, credit tụt còn 300 < 400 → có đường ra thứ hai: bỏ creator
  'creator-cost-over-budget': {
    ...FILLED,
    actorId: 'ac-4',
    modelId: 'seedance-2-5',
    used: TOTAL_CREDITS - 300,
  },
  // còn 100 credit < 150 → không đủ cho một video
  'cannot-afford': {...FILLED, used: TOTAL_CREDITS - 100},
  'quota-blocked': {...FILLED, used: TOTAL_CREDITS},
  'job-processing': {used: 390},
  'job-failed': {used: 390},
  'no-permission': {...FILLED, used: 240},
};

export default function TemplateCompose() {
  const params = useParams();
  const navigate = useNavigate();
  const template = templateById(params.id ?? 't-1');

  const [state, setState] = useState('empty');
  const [productId, setProductId] = useState<string | undefined>();
  const [imageIndex, setImageIndex] = useState(0);
  const [description, setDescription] = useState('');
  const [dialog, setDialog] = useState('');
  /** Card Dialog có HAI CHẾ ĐỘ, không phải hai ô nhập — xem ghi chú đầu file */
  const [aiMode, setAiMode] = useState(false);
  const [brief, setBrief] = useState('');
  const [angle, setAngle] = useState('');
  const [actorId, setActorId] = useState<string | undefined>();
  /** Model chỉ áp dụng khi đã đổi creator. `undefined` = đang giữ creator của template */
  const [modelId, setModelId] = useState<string | undefined>();
  /**
   * Creator vừa chọn ở modal actor nhưng CHƯA commit — chờ bước chọn model.
   * Không commit sớm: bỏ ngang ở bước model mà creator đã dính vào form thì giá nhảy
   * sau lưng merchant.
   */
  const [pendingActor, setPendingActor] = useState<string | undefined>();
  const [draftModel, setDraftModel] = useState('');
  const [voiceId, setVoiceId] = useState('ac-1');
  const [voice, setVoice] = useState<VoiceSettings>({...voiceDefaults});
  const [picked, setPicked] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [draftProduct, setDraftProduct] = useState<string | undefined>();
  const [actorTab, setActorTab] = useState<'All' | 'Realistic' | 'Styled'>('All');
  const [actorGender, setActorGender] = useState('');
  const [actorAge, setActorAge] = useState('');
  const [actorTone, setActorTone] = useState('');
  const [actorStyle, setActorStyle] = useState('');
  const [actorSearch, setActorSearch] = useState('');
  const [showActorStyles, setShowActorStyles] = useState(false);
  /**
   * Chèn thẻ cảm xúc vào ĐÚNG vị trí con trỏ.
   *
   * 🔴 `<textarea>` thật nằm trong **shadow DOM** của `s-text-area` — đặt ref lên chính
   * `s-text-area` thì `selectionStart` là `undefined` và mọi thẻ rơi hết xuống cuối
   * chuỗi (bug Stella bắt được 08 Aug 2026). Phải chui vào `shadowRoot` mà lấy.
   *
   * Và phải NHỚ vị trí con trỏ: bấm pill làm textarea mất focus, nên đọc lúc bấm là
   * quá muộn ở một số browser. `caretRef` cập nhật mỗi lần gõ hoặc click trong ô.
   */
  const dialogRef = useRef<HTMLElement | null>(null);
  const caretRef = useRef<number | null>(null);
  /**
   * Cờ chuyển tiếp giữa hai modal. Ref chứ không state: `onAfterHide` chạy ngoài chu kỳ
   * render của React, đọc state ở đó là đọc bản cũ. Và `onAfterHide` bắn ở MỌI lần đóng
   * (Cancel, X, Esc) nên bắt buộc phải có cờ — không thì bấm Cancel cũng nhảy sang model.
   */
  const chainToModel = useRef(false);
  const chainToActor = useRef(false);

  const is = (...names: string[]) => names.includes(state);

  const applyState = (value: string) => {
    const scenario = SCENARIOS[value] ?? SCENARIOS.empty;
    setState(value);
    setProductId(scenario.productId);
    setImageIndex(scenario.imageIndex ?? 0);
    setDescription(scenario.description ?? '');
    setDialog(scenario.dialog ?? '');
    setAiMode(Boolean(scenario.aiMode));
    setBrief(scenario.brief ?? '');
    setAngle('');
    setActorId(scenario.actorId);
    setModelId(scenario.actorId ? (scenario.modelId ?? 'seedance-2-0') : undefined);
    setPendingActor(undefined);
    setDraftModel(scenario.actorId ? (scenario.modelId ?? 'seedance-2-0') : '');
    setVoiceId(scenario.voiceId ?? 'ac-1');
    setVoice(scenario.voice ?? {...voiceDefaults});
    setPicked(scenario.actorId ? [scenario.actorId] : []);
    setDraftProduct(scenario.productId);
    setProductSearch('');
    setGateStep('pending');
  };

  const scenario = SCENARIOS[state] ?? SCENARIOS.empty;
  const used = scenario.used ?? 0;
  const remaining = Math.max(0, TOTAL_CREDITS - used);

  /**
   * Ba bước của gate disclaimer (Stella 08 Aug 2026):
   *   pending → banner disclaimer, KHÔNG có nút Generate
   *   thanks  → banner cảm ơn + vòng tròn đếm ngược 3s
   *   done    → banner biến mất, nút Generate hiện ra
   *
   * Nút Generate bị ẨN chứ không disable ở hai bước đầu — khác rule chung của app (§6:
   * disable + nói lý do, đừng ẩn). Ở đây banner ĐANG chặn cả trang và tự giải thích, nên
   * để thêm một nút xám cạnh nó là nhiễu chứ không phải thông tin.
   */
  const [gateStep, setGateStep] = useState<'pending' | 'thanks' | 'done'>('pending');
  const gateActive = is('disclaimer-first-run') && gateStep !== 'done';
  const readOnly = is('no-permission');
  const jobRunning = is('job-processing');
  const quotaBlocked = remaining <= 0;
  const locked = readOnly || jobRunning;

  const product = catalogProducts.find((item) => item.id === productId);
  const actor: Actor | undefined = actors.find((item) => item.id === actorId);
  /**
   * Creator sẽ được commit khi bấm "Use this model" — người vừa chọn ở bước 1, hoặc người
   * đang dùng nếu merchant vào modal chỉ để đổi model.
   */
  const nextActor: Actor | undefined = actors.find(
    (item) => item.id === (pendingActor ?? actorId),
  );

  /**
   * ═══ GIÁ ═══ Giữ creator của template = 150. Đổi creator = giá của model đã chọn.
   *
   * Một biến duy nhất chảy vào CẢ BA chỗ nói về tiền: nút Generate ở header, cost
   * preview của CreditMeter, và banner cannot-afford. Ba chỗ tính riêng là ba số lệch
   * nhau — cách nhanh nhất để merchant mất tin vào bảng giá.
   */
  const model = actor && modelId ? creatorModelById(modelId) : null;
  const cost = model ? model.credits : VIDEO_CREDITS;
  const cannotAfford = remaining > 0 && cost > remaining;

  /**
   * Tính năng Creator có dùng được không — tách HẲN khỏi `cannotAfford`.
   *
   * `creatorLocked` = không đủ cho model rẻ nhất. Merchant vẫn generate được video
   * bình thường với creator có sẵn của template, nên đây KHÔNG phải trạng thái chặn
   * trang. Gộp nó vào `cannotAfford` là đẩy người ta đi upgrade khi họ không cần.
   */
  const creatorLocked = remaining < CREATOR_MODEL_MIN_CREDITS;
  /** Đã chọn creator + model nhưng model đó vượt credit còn lại → có đường ra bằng cách bỏ creator */
  const creatorOverBudget = cannotAfford && Boolean(model) && VIDEO_CREDITS <= remaining;

  /**
   * Lý do "Change creator" bị disable — TEXT hiện sẵn, không tooltip (verified 05 Aug
   * 2026: `interestFor` không mở trên control disabled). Hai câu khác nhau vì hai đường
   * ra khác nhau: dưới 150 thì không video nào chạy được, còn 150–249 thì video chạy
   * được, chỉ Creator là không.
   */
  const creatorLockReason = !creatorLocked
    ? null
    : remaining < VIDEO_CREDITS
      ? // Dưới 150 thì banner credit ở action zone / aside ĐÃ kể câu chuyện hết credit + ngày
        // reset. Ở đây chỉ cần đúng phần về Creator, không lặp lại.
        `Changing the creator needs at least ${CREATOR_MODEL_MIN_CREDITS} credits.`
      : `Changing the creator starts at ${CREATOR_MODEL_MIN_CREDITS} credits and you have ${remaining.toLocaleString()} left. You can still generate this video with the creator already in the template for ${VIDEO_CREDITS} credits.`;

  const voiceActor = actors.find((item) => item.id === voiceId);
  const voiceChanged = (Object.keys(voiceDefaults) as (keyof VoiceSettings)[]).some(
    (key) => voice[key] !== voiceDefaults[key],
  );

  const dialogSeconds = Math.round(dialog.length / CHARS_PER_SECOND);
  const dialogTooLong = dialogSeconds > template.durationSec;

  const blockedReason = gateActive
    ? 'Confirm you understand how AI videos differ from customer reviews before generating.'
    : readOnly
      ? 'Only staff with access to this app can spend AI credits. Ask your store owner for access.'
    : jobRunning
      ? 'A video is already generating. Wait for it to finish so you don’t spend credits twice.'
      : quotaBlocked
        ? 'You have 0 credits left. Credits reset on 1 September.'
        : cannotAfford
          ? `This video needs ${cost.toLocaleString()} credits but you only have ${remaining.toLocaleString()} left.`
          : !productId
            ? 'Pick the product so we know what goes in the creator’s hands.'
            : !dialog.trim()
              ? 'Write the dialog. This is what the creator says out loud.'
              : null;

  const filteredProducts = catalogProducts.filter((item) =>
    productSearch ? item.title.toLowerCase().includes(productSearch.toLowerCase()) : true,
  );

  const filteredActors = actors.filter((item) => {
    if (actorTab === 'Realistic' && item.kind !== 'Realistic') return false;
    if (actorTab === 'Styled' && item.kind !== 'Styled') return false;
    if (actorGender && item.gender !== actorGender) return false;
    if (actorAge && item.age !== actorAge) return false;
    if (actorTone && item.skinTone !== actorTone) return false;
    if (actorStyle && item.style !== actorStyle) return false;
    if (actorSearch && !item.name.toLowerCase().includes(actorSearch.toLowerCase())) return false;
    return true;
  });

  const innerTextarea = () =>
    (dialogRef.current?.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement | null) ??
    null;

  const rememberCaret = () => {
    const node = innerTextarea();
    if (node) caretRef.current = node.selectionStart;
  };

  /** Thẻ ngắn nhất còn nhét vừa không — `maxLength` của textarea KHÔNG chặn setState */
  const shortestTag = Math.min(...speechEmotions.map((tag) => tag.length + 3));
  const roomForTag = DIALOG_MAX - dialog.length >= shortestTag;

  /**
   * `s-text-area` KHÔNG nhận `onKeyUp` / `onClick` qua prop (typecheck bắt được) — chỉ có
   * `onInput`/`onChange`/`onBlur`/`onFocus`. Nhưng chỉ theo dõi `onInput` là hụt: di
   * chuyển con trỏ bằng phím mũi tên hay click chuột KHÔNG phát `input`.
   *
   * → gắn listener thẳng lên host element. `keyup` và `click` là composed event nên
   * chúng nổi từ shadow DOM ra tới host. Phụ thuộc `aiMode` vì đổi chế độ là textarea
   * bị unmount rồi mount lại.
   */
  useEffect(() => {
    const host = dialogRef.current;
    if (!host || aiMode) return;
    host.addEventListener('keyup', rememberCaret);
    host.addEventListener('click', rememberCaret);
    return () => {
      host.removeEventListener('keyup', rememberCaret);
      host.removeEventListener('click', rememberCaret);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiMode]);

  /**
   * Chèn thẻ bằng `setRangeText` của chính textarea — API native làm ĐÚNG MỘT thao tác:
   * chèn chuỗi rồi đặt con trỏ ngay sau nó (`'end'`).
   *
   * 🔴 Vì sao không tự dựng bằng `setDialog` + `setSelectionRange`: `s-text-area` ghi lại
   * `value` vào textarea sau khi React commit, và thao tác đó đẩy con trỏ về CUỐI chuỗi.
   * Đã thử rAF rồi double rAF, đo được vẫn nhảy (đặt 113, nhận 143). Ghi thẳng vào DOM
   * trước rồi `setDialog(node.value)` thì giá trị mới TRÙNG cái đang có, component không
   * phải ghi đè, con trỏ đứng yên.
   */
  const insertEmotion = (tag: string) => {
    const token = `[${tag}] `;
    if (dialog.length + token.length > DIALOG_MAX) return;
    const node = innerTextarea();
    const at = caretRef.current ?? dialog.length;

    if (!node) {
      setDialog(`${dialog.slice(0, at)}${token}${dialog.slice(at)}`);
      caretRef.current = at + token.length;
      return;
    }

    node.focus();
    node.setRangeText(token, at, at, 'end');
    caretRef.current = node.selectionStart;
    setDialog(node.value);
  };

  /**
   * Mở modal bằng method của chính element (`showOverlay()`).
   *
   * Vì sao không dùng `command="--show" commandFor`: cặp đó trỏ được ĐÚNG MỘT modal, mà
   * chuỗi actor → model cần một cú bấm đóng modal này rồi mở modal kia. Nút giữ
   * `command="--hide"` cho bước đóng (khỏi cần ref), bước mở gọi tay ở `onAfterHide` —
   * mở trước khi modal cũ đóng hẳn thì hai dialog tranh nhau top layer.
   */
  const showModal = (id: string) => {
    const node = document.getElementById(id) as (HTMLElement & {showOverlay?: () => void}) | null;
    node?.showOverlay?.();
  };

  /** Mở modal model, mang theo lựa chọn hiện tại (lần đầu thì để trống — xem modal) */
  const openModelPicker = (nextActor?: string) => {
    setPendingActor(nextActor);
    setDraftModel(modelId ?? '');
    showModal('pick-model');
  };

  return (
    <s-page heading="AI Studio">
      <s-link slot="breadcrumb-actions" href="/app/ai-studio">
        Templates
      </s-link>

      {!gateActive && (
        <s-button slot="primary-action" variant="primary" disabled={Boolean(blockedReason)}>
          Generate video · {cost} credits
        </s-button>
      )}

      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={applyState}
          states={STATES}
          globalNote={<ComposePageNotes />}
        />

        <AiStudioTabs active="/app/ai-studio" />

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
        ) : jobRunning ? (
          <JobProgress
            status="processing"
            title="Generating 1 video"
            done={0}
            total={1}
            etaLabel="~2 min left"
            onCancel={() => {}}
            resultHref="/app/library"
          />
        ) : is('job-failed') ? (
          <JobProgress
            status="failed"
            title="Generating 1 video"
            total={1}
            errorMessage="The provider rejected the dialog — it claims a health benefit, which their content policy blocks."
            creditNote={`${cost.toLocaleString()} credits refunded`}
            onRetry={() => {}}
          />
        ) : readOnly ? (
          <s-banner tone="warning" heading="You can't spend AI credits">
            <s-paragraph>
              Generating videos uses your store&apos;s credits, so it needs staff access to this
              app. You can still open templates and read them.
            </s-paragraph>
          </s-banner>
        ) : quotaBlocked ? (
          <s-banner
            tone="critical"
            heading={`You've used all ${TOTAL_CREDITS.toLocaleString('en-US')} AI credits`}
          >
            <s-paragraph>
              Credits reset on 1 September. Keep writing — your work stays here and the video will
              be ready to run then.
            </s-paragraph>
            <s-button slot="secondary-actions" href="/app/billing">
              Upgrade for more credits
            </s-button>
          </s-banner>
        ) : null}

        {/* ══ 0. TEMPLATE ĐÃ CHỌN — thumb TRÁI, chữ PHẢI ══
            `s-grid` chứ không `s-stack direction="inline"`: inline làm cột chữ tự giãn rồi
            rớt xuống DƯỚI ảnh (Stella bắt được 07 Aug 2026). `max-content` giữ ảnh đúng bề
            ngang, `minmax(0,1fr)` cho chữ ăn hết phần còn lại. */}
        <s-section>
          <s-grid gap="base" gridTemplateColumns="max-content minmax(0, 1fr)" alignItems="start">
            <div style={{width: 104}}>
              <s-image
                src={templateThumb(template.id)}
                alt={`${template.title} — ${shotAlt[template.shot]}`}
                aspectRatio="9/16"
                objectFit="cover"
                borderRadius="base"
                loading="lazy"
              />
            </div>
            <s-stack direction="block" gap="small-300">
              <s-heading>{template.title}</s-heading>
              <s-text color="subdued">
                {template.durationSec}s · vertical · {template.tags.slice(0, 3).join(' · ')}
              </s-text>
              <s-paragraph color="subdued">
                Your product and your dialog replace what&apos;s in this template. The shots, the
                pacing and the setting stay the same.
              </s-paragraph>
              <s-stack direction="inline" gap="small-200" alignItems="center">
                <s-button variant="tertiary" onClick={() => navigate('/app/ai-studio')}>
                  Change template
                </s-button>
              </s-stack>
            </s-stack>
          </s-grid>
        </s-section>

        {/* ══ 1. PRODUCT ══ */}
        <s-section heading="Product">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="small-200" alignItems="center">
              {/* In real app: shopify.resourcePicker({type: 'product'}). Modal bên dưới là
                  bản mô phỏng — store có thể có hàng nghìn product nên bắt buộc search +
                  danh sách, không thể là lưới phẳng (Stella 07 Aug 2026). */}
              <s-button
                disabled={locked}
                command="--show"
                commandFor="pick-product"
                onClick={() => setDraftProduct(productId)}
              >
                {product ? 'Change product' : 'Choose product'}
              </s-button>
              <s-text color="subdued">
                {product
                  ? `${product.title} · ${product.imageCount} ${product.imageCount === 1 ? 'photo' : 'photos'}`
                  : 'The creator holds this product on screen.'}
              </s-text>
            </s-stack>

            {product && product.imageCount > 0 && (
              <s-grid gap="small" gridTemplateColumns="repeat(auto-fill, minmax(110px, 1fr))">
                {Array.from({length: product.imageCount}, (_, index) => {
                  const selected = index === imageIndex;
                  return (
                    <s-clickable
                      key={index}
                      borderRadius="base"
                      border="base"
                      padding="small-400"
                      disabled={locked}
                      accessibilityLabel={`${selected ? 'Using this' : 'Not used'} — photo ${index + 1} of ${product.title}`}
                      onClick={() => setImageIndex(index)}
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
                        {selected ? (
                          <s-stack direction="inline" gap="small-400" alignItems="center">
                            <s-icon type="check-circle" tone="success" size="small" />
                            <s-text>Using this</s-text>
                          </s-stack>
                        ) : (
                          <s-text color="subdued">Not used</s-text>
                        )}
                      </s-stack>
                    </s-clickable>
                  );
                })}
              </s-grid>
            )}

            <s-text-area
              label="Product description"
              value={description}
              onInput={(event) => setDescription(event.currentTarget.value)}
              maxLength={PRODUCT_DESC_MAX}
              rows={2}
              disabled={locked}
              details="Keeps the visuals accurate. Not read out loud — that's the dialog below."
            />

            {/* Merchant đã viết mô tả sản phẩm trong Shopify rồi — bắt viết lại lần nữa là
                bước thừa. Nút này rút gọn từ dữ liệu đã có (Stella 07 Aug 2026).
                Icon `wand` là ký hiệu AI của Polaris — KHÔNG dùng icon Sidekick hay màu
                magic purple, đó là vi phạm BFS 4.3.5. */}
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <s-button
                variant="tertiary"
                icon="wand"
                disabled={locked || !productId}
                onClick={() =>
                  setDescription(
                    'Full-grain leather tote with a top pocket for keys and a padded laptop sleeve.',
                  )
                }
              >
                Summarise from product details
              </s-button>
              {!productId && <s-text color="subdued">Pick a product first.</s-text>}
            </s-stack>
          </s-stack>
        </s-section>

        {/* ══ 2. DIALOG — MỘT card, hai chế độ ══ */}
        <s-section heading="Dialog">
          <s-stack direction="block" gap="base">
            {aiMode ? (
              <>
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  {/* Generate disabled tới khi có ý tưởng — nút sinh ra từ ô trống là nút hỏng */}
                  <s-button
                    variant="primary"
                    disabled={locked || !brief.trim()}
                    onClick={() => {
                      setDialog(AI_DIALOG);
                      setAiMode(false);
                    }}
                  >
                    Generate
                  </s-button>
                  {/* Cancel KHÔNG xoá dialog đã có — ghi đè bản merchant sửa tay là lỗi
                      không tha thứ được. */}
                  <s-button variant="tertiary" onClick={() => setAiMode(false)}>
                    Cancel AI writer
                  </s-button>
                  {!brief.trim() && (
                    <s-text color="subdued">Describe your idea to generate.</s-text>
                  )}
                </s-stack>

                <s-text-area
                  label="Tell us about your idea"
                  labelAccessibilityVisibility="exclusive"
                  placeholder="Tell us about your idea…"
                  value={brief}
                  onInput={(event) => setBrief(event.currentTarget.value)}
                  rows={3}
                  disabled={locked}
                />

                <s-stack direction="block" gap="small-400">
                  <s-text color="subdued">Angle</s-text>
                  <FilterPills
                    ariaLabel="Script angle"
                    options={scriptAngles}
                    active={angle || null}
                    onPick={(item) => setAngle(angle === item ? '' : item)}
                  />
                </s-stack>
              </>
            ) : (
              <>
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-button
                    variant="tertiary"
                    icon="wand"
                    disabled={locked}
                    onClick={() => setAiMode(true)}
                  >
                    AI script writer
                  </s-button>
                  <s-text color="subdued">Or write it yourself below.</s-text>
                </s-stack>

                <s-text-area
                  ref={dialogRef as never}
                  label="What the creator says"
                  labelAccessibilityVisibility="exclusive"
                  value={dialog}
                  onInput={(event) => {
                    setDialog(event.currentTarget.value);
                    rememberCaret();
                  }}
                  maxLength={DIALOG_MAX}
                  rows={5}
                  disabled={locked}
                  details="Write it the way a real person would say it out loud."
                />

                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-icon
                    type={dialogTooLong ? 'alert-triangle' : 'clock'}
                    tone={dialogTooLong ? 'caution' : 'neutral'}
                    size="small"
                  />
                  <s-text color={dialogTooLong ? 'base' : 'subdued'}>
                    ≈ {dialogSeconds}s of {template.durationSec}s
                  </s-text>
                </s-stack>

                {dialogTooLong && (
                  <s-banner tone="warning" heading="This runs past 15 seconds">
                    <s-paragraph>
                      Anything past {template.durationSec} seconds gets cut, or the voice speeds up
                      to fit. Trim about{' '}
                      {Math.ceil(((dialogSeconds - template.durationSec) * CHARS_PER_SECOND) / 5)}{' '}
                      words to stay inside the template.
                    </s-paragraph>
                  </s-banner>
                )}

                {/* Chèn THẲNG thẻ vào lời thoại, đúng platform — không phải metadata rời.
                    Chèn tại vị trí con trỏ chứ không nối vào cuối: merchant muốn đặt cảm
                    xúc ở giữa câu, mà đó chính là điểm của tính năng này. */}
                <s-stack direction="block" gap="small-400">
                  <s-text color="subdued">
                    {roomForTag
                      ? 'Add speech emotion — inserts a tag where your cursor is'
                      : `Add speech emotion — no room left, trim the dialog under ${DIALOG_MAX} characters first`}
                  </s-text>
                  <FilterPills
                    ariaLabel="Insert a speech emotion tag"
                    options={speechEmotions}
                    active={null}
                    onPick={insertEmotion}
                  />
                </s-stack>
              </>
            )}
          </s-stack>
        </s-section>

        {/* ══ 3. CREATOR — TUỲ CHỌN, mặc định TRỐNG, và ĐỔI LÀ TIÊU THÊM CREDIT ══
            Creator của template KHÔNG nằm trong kho avatar, nên không có gì để hiện sẵn.
            Không đụng vào thì video giữ nguyên người có sẵn (Stella 07 Aug 2026). */}
        <s-section heading="Creator">
          <s-stack direction="block" gap="base">
            {actor ? (
              <s-box border="base" borderRadius="base" padding="base">
                <s-stack direction="block" gap="base">
                  {/* `s-grid` chứ không `s-stack inline` + `space-between`: inline làm cột chữ
                      tự giãn nên khi có badge "Custom voice" + tên giọng khác, hàng nút rớt
                      xuống dòng riêng (đo 13 Aug 2026). Đúng bẫy CLAUDE.md §3 đã ghi. */}
                  <s-grid
                    gap="base"
                    alignItems="center"
                    gridTemplateColumns="minmax(0, 1fr) max-content"
                  >
                    {/* Lồng thêm một `s-grid` cho ô bên trái: `s-stack inline` ở đây bị ô
                        `minmax(0,1fr)` bóp lại và đẩy avatar lên TRÊN chữ. `max-content`
                        giữ avatar đúng bề ngang, `minmax(0,1fr)` cho chữ ăn phần còn lại. */}
                    <s-grid
                      gap="small-200"
                      alignItems="center"
                      gridTemplateColumns="max-content minmax(0, 1fr)"
                    >
                      <s-thumbnail src={actorPortrait(actor.id)} alt="" size="base" />
                      <s-stack direction="block" gap="small-500">
                        <s-stack direction="inline" gap="small-400" alignItems="center">
                          <s-text type="strong">{actor.name}</s-text>
                          {actor.hd && <s-badge>HD</s-badge>}
                          {voiceChanged && <s-badge tone="info">Custom voice</s-badge>}
                        </s-stack>
                        <s-text color="subdued">
                          Replaces the creator in this template
                          {voiceActor && voiceActor.id !== actor.id
                            ? ` · speaks with ${voiceActor.name}'s voice`
                            : ''}
                        </s-text>
                      </s-stack>
                    </s-grid>
                    <s-stack direction="inline" gap="small-200" alignItems="center">
                      <s-button
                        variant="tertiary"
                        icon="adjust"
                        accessibilityLabel="Audio settings"
                        disabled={locked}
                        command="--show"
                        commandFor="audio-settings"
                      />
                      <s-button
                        variant="tertiary"
                        disabled={locked}
                        command="--show"
                        commandFor="add-actors"
                      >
                        Change
                      </s-button>
                      {/* Remove đưa về mặc định: creator có sẵn của template + giá 150.
                          Phải xoá LUÔN model — model chỉ tồn tại vì đã đổi creator, để
                          lại là giá còn treo ở mức của model sau khi bỏ creator. */}
                      <s-button
                        variant="tertiary"
                        disabled={locked}
                        onClick={() => {
                          setActorId(undefined);
                          setModelId(undefined);
                          setPicked([]);
                          setDraftModel('');
                        }}
                      >
                        Remove
                      </s-button>
                    </s-stack>
                  </s-grid>

                  <s-divider />

                  {/* Hàng MODEL — nằm TRONG thẻ creator, không phải section riêng: model chỉ
                      tồn tại vì đã đổi creator, và nó là thứ quyết định giá. Tách ra thành
                      section riêng thì merchant đọc "Model" như một tuỳ chọn chất lượng
                      độc lập và không nối được với con số ở nút Generate. */}
                  <s-grid
                    gap="base"
                    alignItems="center"
                    gridTemplateColumns="minmax(0, 1fr) max-content"
                  >
                    <s-stack direction="block" gap="small-500">
                      <s-stack direction="inline" gap="small-400" alignItems="center">
                        <s-text type="strong">{model ? model.name : 'No model picked'}</s-text>
                        {model?.badge && <s-badge tone="neutral">{model.badge}</s-badge>}
                        {creatorOverBudget && <s-badge tone="critical">Over budget</s-badge>}
                      </s-stack>
                      <s-text color={creatorOverBudget ? 'base' : 'subdued'}>
                        {creatorOverBudget
                          ? `${cost.toLocaleString()} credits — that's more than the ${remaining.toLocaleString()} you have left.`
                          : `${cost.toLocaleString()} credits · ${(cost - VIDEO_CREDITS).toLocaleString()} more than keeping the creator in the template.`}
                      </s-text>
                    </s-stack>
                    <s-button variant="tertiary" disabled={locked} onClick={() => openModelPicker()}>
                      Change model
                    </s-button>
                  </s-grid>
                </s-stack>
              </s-box>
            ) : (
              // Chữ TRÁI, nút đen PHẢI. `s-grid` chứ không `s-stack inline`: inline làm cả
              // hai tự giãn nên nút không bám được mép phải. `minmax(0,1fr)` cho chữ ăn
              // phần còn lại, `max-content` giữ nút đúng bề ngang nội dung.
              <s-grid
                gap="base"
                alignItems="center"
                gridTemplateColumns="minmax(0, 1fr) max-content"
              >
                <s-text color="subdued">
                  Optional — the video keeps the creator already in the template.
                </s-text>
                <s-button
                  variant="primary"
                  disabled={locked || creatorLocked}
                  command="--show"
                  commandFor="add-actors"
                >
                  Change creator
                </s-button>
              </s-grid>
            )}

            {/* ⚠️ CẢNH BÁO GIÁ — nói TRƯỚC khi bấm, không phải sau khi đã vào modal.
                Merchant đọc "Optional" ở dòng trên rồi bấm thử cho biết; biết giá đổi
                sau khi đã chọn xong người là biết quá muộn.

                `tone="warning"` chứ không `info`: đây là tiêu thêm tiền thật, cùng hạng
                với banner "dialog vượt 15 giây" — app này cảnh báo TRƯỚC mọi lần credit
                tăng. Chỉ hiện ở state chưa chọn creator; chọn rồi thì hàng model phía
                trên đã in đúng số nên nhắc lại là nhiễu.

                Ba lần TẮT hẳn, vì cảnh báo giá cho một hành động không bấm được là nhiễu:
                `locked` (job đang chạy / không có quyền) và `gateActive` (disclaimer đang
                chặn cả trang) — ở cả ba, action zone đã có banner nói rõ lý do.

                📝 Copy rút ngắn còn HAI dòng (Stella 13 Aug 2026). Bản đầu kể cả 150 và
                250 ngay trong banner: dài, và nói chắc chắn về một con số mà chính nó
                không kiểm soát. "may cost more" + trỏ về nút Generate là đủ — nút đó là
                nguồn duy nhất của giá, nhắc lại số ở đây là hai chỗ có thể lệch nhau. */}
            {!actor &&
              !locked &&
              !gateActive &&
              (creatorLockReason ? (
                remaining >= VIDEO_CREDITS ? (
                  <s-banner tone="warning" heading="You can't change the creator right now">
                    <s-paragraph>{creatorLockReason}</s-paragraph>
                    <s-button slot="secondary-actions" href="/app/billing">
                      Compare plans
                    </s-button>
                  </s-banner>
                ) : (
                  // Dưới 150: action zone/aside đã có banner critical về credit. Thêm banner
                  // critical thứ hai ở đây là hai banner nói cùng một câu — đúng lỗi
                  // CreditMeter `compact` được sinh ra để tránh. Giữ lý do disable dạng
                  // TEXT (checklist §2 vẫn phải thoả), không tooltip, không banner.
                  <s-text color="subdued">{creatorLockReason}</s-text>
                )
              ) : (
                <s-banner tone="warning" heading="Changing the creator may cost more credits">
                  <s-paragraph>
                    The Generate button at the top always shows what this video will actually cost.
                  </s-paragraph>
                </s-banner>
              ))}
          </s-stack>
        </s-section>
      </s-stack>

      {/* ══ ASIDE ══ */}
      <s-stack slot="aside" direction="block" gap="base">
        <CreditMeter
          used={used}
          total={TOTAL_CREDITS}
          resetDate="1 September"
          planName="Scale"
          pendingCost={cost}
          compact
        />

        {(cannotAfford || blockedReason) && (
          <s-stack direction="block" gap="small-200">
            {cannotAfford && !quotaBlocked && (
              <s-banner tone="critical" heading="Not enough credits for this video">
                <s-paragraph>
                  This video costs {cost.toLocaleString()} credits and you have{' '}
                  {remaining.toLocaleString()} left.
                  {/* Đường ra THỨ HAI khi cái đẩy giá lên là creator: bỏ creator là về 150
                      và generate được ngay. Chỉ chìa "Compare plans" trong khi merchant vẫn
                      còn cách làm xong việc trong số credit hiện có là bán hàng, không phải
                      giúp — và đó là loại chi tiết enterprise nhớ rất lâu. */}
                  {creatorOverBudget
                    ? ` Removing the creator brings it back to ${VIDEO_CREDITS} credits, which you can afford.`
                    : ''}
                </s-paragraph>
                {creatorOverBudget && (
                  <s-button
                    slot="secondary-actions"
                    onClick={() => {
                      setActorId(undefined);
                      setModelId(undefined);
                      setPicked([]);
                      setDraftModel('');
                    }}
                  >
                    Remove creator
                  </s-button>
                )}
                <s-button slot="secondary-actions" href="/app/billing">
                  Compare plans
                </s-button>
              </s-banner>
            )}
            {blockedReason && (
              <s-box background="subdued" borderRadius="base" padding="small">
                <s-text color="subdued">{blockedReason}</s-text>
              </s-box>
            )}
          </s-stack>
        )}

        <s-section heading="What happens next">
          {/* `s-grid` chứ không `s-stack direction="inline"`: bước 1 có chữ dài nhất và
              inline làm badge số rớt xuống dòng riêng (Stella bắt được 07 Aug 2026).
              `max-content` giữ số đúng bề ngang, `minmax(0,1fr)` cho chữ ăn phần còn lại. */}
          <s-grid gap="small-200" gridTemplateColumns="max-content minmax(0, 1fr)">
            {[
              ['1', 'We generate your video', 'Usually 2–3 minutes. You can leave this page'],
              ['2', 'You review it', 'Nothing publishes automatically'],
              ['3', 'Tag products, then publish', 'Untagged videos can’t be bought from'],
            ].map(([step, label, detail]) => (
              <Fragment key={step}>
                <s-badge tone="neutral">{step}</s-badge>
                <s-stack direction="block" gap="small-500">
                  <s-text>{label}</s-text>
                  <s-text color="subdued">{detail}</s-text>
                </s-stack>
              </Fragment>
            ))}
          </s-grid>
        </s-section>
      </s-stack>

      {/* ══ MODAL: chọn product ══
          Store có thể có hàng nghìn product → search + danh sách, không phải lưới phẳng.
          Chọn MỘT: một video nói về một sản phẩm. */}
      <s-modal id="pick-product" heading="Choose product" accessibilityLabel="Choose product">
        <s-stack direction="block" gap="base">
          <s-search-field
            label="Search products"
            labelAccessibilityVisibility="exclusive"
            placeholder="Search products"
            value={productSearch}
            onInput={(event) => setProductSearch(event.currentTarget.value)}
          />
          <s-text color="subdued">
            {filteredProducts.length} of {catalogProducts.length} products
          </s-text>
          <s-stack direction="block" gap="small-400">
            {filteredProducts.map((item) => {
              const chosen = item.id === draftProduct;
              return (
                <s-clickable
                  key={item.id}
                  borderRadius="base"
                  border="base"
                  padding="small"
                  accessibilityLabel={`${chosen ? 'Selected' : 'Select'} ${item.title}`}
                  onClick={() => setDraftProduct(item.id)}
                >
                  <s-grid
                    gap="small-200"
                    alignItems="center"
                    gridTemplateColumns="max-content minmax(0, 1fr) max-content"
                  >
                    {item.imageCount > 0 ? (
                      <s-thumbnail src={productImage(item.id, 0, 80)} alt="" size="base" />
                    ) : (
                      <div style={{width: 40}}>
                        <MediaPlaceholder aspectRatio="1" label="—" />
                      </div>
                    )}
                    <s-stack direction="block" gap="small-500">
                      <s-text type="strong">{item.title}</s-text>
                      {/* Product 0 ảnh phải nói ra ngay đây: chọn xong mà không generate
                          được là dead-end im lặng — cùng lỗi tab catalog đã xử lý. */}
                      <s-text color="subdued">
                        {item.imageCount === 0
                          ? 'No photos — add one in your catalog first'
                          : `${item.imageCount} ${item.imageCount === 1 ? 'photo' : 'photos'}`}
                      </s-text>
                    </s-stack>
                    {chosen ? <s-icon type="check-circle" tone="success" /> : <s-text> </s-text>}
                  </s-grid>
                </s-clickable>
              );
            })}
          </s-stack>
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          disabled={!draftProduct}
          command="--hide"
          commandFor="pick-product"
          onClick={() => {
            setProductId(draftProduct);
            setImageIndex(0);
          }}
        >
          Use this product
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="pick-product">
          Cancel
        </s-button>
      </s-modal>

      {/* ══ MODAL: đổi creator — BƯỚC 1/2, bước 2 là chọn model ══
          `onAfterHide` chứ không mở modal model ngay trong `onClick`: hai `<dialog>` cùng
          giành top layer thì cái mở sau bị đóng theo cái đóng trước. */}
      <s-modal
        id="add-actors"
        heading="Change creator"
        accessibilityLabel="Change creator"
        onAfterHide={() => {
          if (!chainToModel.current) return;
          chainToModel.current = false;
          openModelPicker(picked[0]);
        }}
      >
        <s-stack direction="block" gap="base">
          <s-paragraph color="subdued">
            Pick someone from the MakeUGC library to replace the creator in this template.
          </s-paragraph>

          {/* Nhắc giá NGAY trong modal, không chỉ ở section ngoài: merchant có thể vào đây
              từ nút "Change" của thẻ creator và không đọc lại banner ngoài kia. */}
          <s-box background="subdued" borderRadius="base" padding="small">
            <s-text color="subdued">
              Costs more than the {VIDEO_CREDITS} credits for keeping the creator in this template.
              You&apos;ll pick the video model next — that&apos;s what sets the final price.
            </s-text>
          </s-box>

          <s-search-field
            label="Search actors"
            labelAccessibilityVisibility="exclusive"
            placeholder="Search actors"
            value={actorSearch}
            onInput={(event) => setActorSearch(event.currentTarget.value)}
          />

          <FilterPills
            ariaLabel="Filter actors by kind"
            options={['All', 'Realistic', 'Styled'] as const}
            active={actorTab}
            onPick={setActorTab}
          />

          <s-grid gap="small-200" gridTemplateColumns="minmax(0, 1fr) minmax(0, 1fr)">
            <s-select
              label="Gender"
              value={actorGender}
              onChange={(event) => setActorGender(event.currentTarget.value)}
            >
              <s-option value="">Any gender</s-option>
              {actorGenders.map((item) => (
                <s-option key={item} value={item}>
                  {item}
                </s-option>
              ))}
            </s-select>
            <s-select
              label="Age"
              value={actorAge}
              onChange={(event) => setActorAge(event.currentTarget.value)}
            >
              <s-option value="">Any age</s-option>
              {actorAges.map((item) => (
                <s-option key={item} value={item}>
                  {item}
                </s-option>
              ))}
            </s-select>
          </s-grid>

          <s-stack direction="block" gap="small-400">
            <s-text color="subdued">Skin tone</s-text>
            <s-grid gap="small-400" gridTemplateColumns="repeat(4, minmax(0, 1fr))">
              {actorSkinTones.map((item) => (
                <s-clickable
                  key={item.id}
                  borderRadius="base"
                  border="base"
                  padding="small-400"
                  accessibilityLabel={`Filter by ${item.label} skin tone`}
                  onClick={() => setActorTone(actorTone === item.id ? '' : item.id)}
                >
                  <s-stack direction="inline" gap="small-400" alignItems="center">
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 999,
                        background: item.hex,
                        border: '1px solid rgba(0,0,0,0.15)',
                      }}
                    />
                    <s-text>{item.label}</s-text>
                    {actorTone === item.id && <s-icon type="check" size="small" tone="success" />}
                  </s-stack>
                </s-clickable>
              ))}
            </s-grid>
          </s-stack>

          <s-stack direction="block" gap="small-400">
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <s-button variant="tertiary" onClick={() => setShowActorStyles((v) => !v)}>
                {showActorStyles ? 'Hide styles' : `Filter by style (${actorStyles.length})`}
              </s-button>
              {actorStyle && <s-badge tone="info">{actorStyle}</s-badge>}
            </s-stack>
            {showActorStyles && (
              <FilterPills
                ariaLabel="Filter actors by style"
                options={actorStyles}
                active={actorStyle || null}
                onPick={(item) => setActorStyle(actorStyle === item ? '' : item)}
              />
            )}
          </s-stack>

          <s-stack direction="inline" gap="small-200" alignItems="center">
            <s-text color="subdued">
              {filteredActors.length} of {actors.length} actors
            </s-text>
            {(actorGender || actorAge || actorTone || actorStyle || actorSearch) && (
              <s-button
                variant="tertiary"
                onClick={() => {
                  setActorGender('');
                  setActorAge('');
                  setActorTone('');
                  setActorStyle('');
                  setActorSearch('');
                }}
              >
                Clear filters
              </s-button>
            )}
          </s-stack>

          <s-grid gap="small" gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))">
            {filteredActors.map((item) => {
              const isPicked = picked.includes(item.id);
              return (
                <s-clickable
                  key={item.id}
                  borderRadius="base"
                  border="base"
                  padding="small-400"
                  accessibilityLabel={`${isPicked ? 'Selected' : 'Select'} ${item.name}`}
                  onClick={() => setPicked(isPicked ? [] : [item.id])}
                >
                  <s-stack direction="block" gap="small-400">
                    <s-image
                      src={actorPortrait(item.id)}
                      alt={item.name}
                      aspectRatio="3/4"
                      objectFit="cover"
                      borderRadius="base"
                      loading="lazy"
                    />
                    <s-stack direction="inline" gap="small-400" alignItems="center">
                      <s-text>{item.name}</s-text>
                      {item.hd && <s-badge>HD</s-badge>}
                    </s-stack>
                    {isPicked ? (
                      <s-stack direction="inline" gap="small-400" alignItems="center">
                        <s-icon type="check-circle" tone="success" size="small" />
                        <s-text>Selected</s-text>
                      </s-stack>
                    ) : item.isNew ? (
                      <s-badge tone="info">New</s-badge>
                    ) : (
                      <s-text color="subdued">{item.kind}</s-text>
                    )}
                  </s-stack>
                </s-clickable>
              );
            })}
          </s-grid>
        </s-stack>
        {/* "Continue" chứ không "Use this creator" nữa (Stella 13 Aug 2026): còn một bước
            chọn model phía sau và bước đó đổi giá. Nút hứa "xong" rồi lại đẩy sang một
            màn hình nữa là nút nói dối. */}
        <s-button
          slot="primary-action"
          variant="primary"
          disabled={picked.length === 0}
          command="--hide"
          commandFor="add-actors"
          onClick={() => {
            chainToModel.current = true;
          }}
        >
          Continue
        </s-button>
        <s-button slot="secondary-actions" onClick={() => setPicked([])}>
          Clear
        </s-button>
      </s-modal>

      {/* ══ MODAL: chọn model — BƯỚC 2/2 ══
          Chỉ tồn tại trong luồng đổi creator. Giữ creator của template thì merchant không
          bao giờ thấy màn này và trả đúng 150.

          Radio (`s-choice-list`) chứ không lưới thẻ bấm: `s-choice-list` chỉ nhận `Choice`
          làm con nên bọc từng lựa chọn trong `s-box` để làm thẻ là phá cấu trúc và mất
          semantics radio (CLAUDE.md §3). Hai lựa chọn thì radio là đúng hình thức.

          🔴 `slot="details"` CHỈ giữ TEXT — mọi markup bị bỏ, nhét `s-badge` vào ra chuỗi
          dính liền. Nên badge/giá phải nằm trong nhãn dạng chữ, và toàn bộ details là
          MỘT câu có dấu phân cách. */}
      <s-modal
        id="pick-model"
        heading="Choose a video model"
        accessibilityLabel="Choose a video model"
        onAfterHide={() => {
          if (!chainToActor.current) return;
          chainToActor.current = false;
          showModal('add-actors');
        }}
      >
        <s-stack direction="block" gap="base">
          {/* Tên actor bằng `<strong>` chứ không `s-text type="strong"` — cái sau chỉ ra
              font-weight 450, bằng đoạn văn, không đậm (CLAUDE.md §3).
              Đã bỏ câu "Keeping the creator in the template costs 150 credits" (Stella
              13 Aug 2026): giá của đường KHÔNG đổi creator không thuộc màn này, và mỗi
              lựa chọn dưới đây đã in giá của chính nó. */}
          <s-paragraph color="subdued">
            {nextActor ? (
              <>
                <strong>{nextActor.name}</strong> replaces the creator in this template.
              </>
            ) : (
              'Changing the creator rebuilds the person on camera.'
            )}{' '}
            The model decides how that render looks — and what this video costs.
          </s-paragraph>

          {/* KHÔNG đủ cho model rẻ nhất → nói thẳng là tính năng Creator không dùng được,
              kèm đường ra KHÔNG PHẢI upgrade: video vẫn generate được với 150. Chỉ chìa
              "Compare plans" là bán hàng, không phải giúp. */}
          {creatorLocked && (
            <s-banner
              tone="critical"
              heading={`You can't change the creator with ${remaining.toLocaleString()} credits left`}
            >
              <s-paragraph>
                The cheapest model is {creatorModels[0].name} at{' '}
                {CREATOR_MODEL_MIN_CREDITS.toLocaleString()} credits.
                {remaining >= VIDEO_CREDITS
                  ? ` Close this and generate with the creator already in the template instead — that video costs ${VIDEO_CREDITS} credits and you have enough for it.`
                  : ' You also don’t have enough for a basic video. Credits reset on 1 September.'}
              </s-paragraph>
              <s-button slot="secondary-actions" href="/app/billing">
                Compare plans
              </s-button>
            </s-banner>
          )}

          {/* 🔴 `onInput`, KHÔNG phải `onChange` (đo 13 Aug 2026). `s-choice-list` bắn `change`
              với `composed: false` — event dừng ở biên shadow DOM, mà React 18 gắn listener ở
              root container nên handler KHÔNG BAO GIỜ chạy: radio tự tick, `element.values`
              tự đúng, còn state React đứng im → nút "Use this model" xám vĩnh viễn. Event
              `input` của chính component đó thì `composed: true` nên ra tới root.
              Bẫy im lặng loại tệ nhất: typecheck xanh, console sạch, radio nhìn như ăn. */}
          <s-choice-list
            label="Video model"
            labelAccessibilityVisibility="exclusive"
            values={draftModel ? [draftModel] : []}
            onInput={(event) => setDraftModel(event.currentTarget.values[0] ?? '')}
          >
            {creatorModels.map((item) => {
              const affordable = remaining >= item.credits;
              return (
                <s-choice key={item.id} value={item.id} disabled={!affordable}>
                  {item.name} · {item.credits.toLocaleString()} credits
                  {item.badge ? ` · ${item.badge}` : ''}
                  {/* MỘT câu khi đủ tiền (Stella 13 Aug 2026) — đã bỏ "Leaves you X of Y
                      credits", CreditMeter bên aside đã nói số còn lại rồi.

                      Model không đủ tiền vẫn HIỆN, chỉ khoá: ẩn đi thì merchant không biết
                      có bản chất lượng cao hơn tồn tại — mà đó chính là lý do họ upgrade.
                      Riêng nhánh này giữ câu lý do đứng TRƯỚC blurb: lý do khoá bắt buộc
                      phải là text hiện sẵn (tooltip không mở được trên control disabled). */}
                  <s-text slot="details">
                    {affordable
                      ? item.blurb
                      : `Needs ${item.credits.toLocaleString()} credits and you have ${remaining.toLocaleString()} left. ${item.blurb}`}
                  </s-text>
                </s-choice>
              );
            })}
          </s-choice-list>
        </s-stack>
        <s-button
          slot="primary-action"
          variant="primary"
          disabled={!draftModel || remaining < creatorModelById(draftModel).credits}
          command="--hide"
          commandFor="pick-model"
          onClick={() => {
            // Commit CẢ HAI ở đây, không sớm hơn: creator + model là một quyết định về giá.
            if (nextActor) setActorId(nextActor.id);
            setModelId(draftModel);
            setPendingActor(undefined);
          }}
        >
          Use this model
        </s-button>
        <s-button
          slot="secondary-actions"
          command="--hide"
          commandFor="pick-model"
          onClick={() => {
            chainToActor.current = true;
          }}
        >
          Back
        </s-button>
      </s-modal>

      <AudioSettings
        actorId={actorId ?? null}
        value={voice}
        voiceId={voiceId}
        onChange={setVoice}
        onVoiceChange={setVoiceId}
      />
    </s-page>
  );
}

/** Note cấp trang — đúng ở mọi state */
function ComposePageNotes() {
  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="block" gap="small-300">
        <s-text type="strong">Sửa theo review của Stella 13 Aug 2026 — đổi creator là tiêu thêm credit</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              <strong>Giá không còn là một số cố định.</strong> Giữ creator của template ={' '}
              <strong>150</strong>. Đổi creator = giá của model: Seedance 2.0{' '}
              <strong>250</strong> · Seedance 2.5 <strong>400</strong>. Nút Generate ở header là{' '}
              <strong>nguồn duy nhất</strong> của con số cuối — CreditMeter và banner
              cannot-afford đều ăn cùng một biến `cost`.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <strong>Cảnh báo giá đứng ở section Creator, TRƯỚC khi bấm</strong> — không phải
              trong modal. Merchant đọc &quot;Optional&quot; rồi bấm thử cho biết; biết giá sau
              khi đã chọn xong người là biết quá muộn. Nhắc lại một dòng gọn trong modal actor
              vì vào đây được từ nút &quot;Change&quot; của thẻ creator.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <strong>Hai bước, hai modal.</strong> Chọn người → <strong>Continue</strong> → chọn
              model → <strong>Use this model</strong>. Nút bước 1 đổi tên vì còn một bước đổi giá
              phía sau; hứa &quot;xong&quot; rồi đẩy sang màn nữa là nút nói dối. Modal model{' '}
              <strong>không commit gì</strong> cho tới khi bấm Use this model — bỏ ngang mà
              creator đã dính vào form là giá nhảy sau lưng merchant. Có <strong>Back</strong>.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <strong>Ba vùng credit, ba câu khác nhau.</strong> ≥400 chọn được cả hai · 250–399
              thì 2.5 khoá kèm lý do (vẫn HIỆN, ẩn đi thì merchant không biết có bản cao hơn) ·
              150–249 thì <strong>tính năng Creator khoá hẳn nhưng video vẫn generate được</strong>{' '}
              với 150. &quot;Hết credit cho Creator&quot; ≠ &quot;hết credit cho video&quot; — gộp
              hai câu đó là đẩy merchant đi upgrade khi họ không cần.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Creator đã chọn mà credit tụt dưới giá model → banner cannot-afford có{' '}
              <strong>đường ra thứ hai: Remove creator</strong> để về 150. Chỉ chìa &quot;Compare
              plans&quot; khi vẫn còn cách làm xong việc trong số credit hiện có là bán hàng, không
              phải giúp.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>

      <s-stack direction="block" gap="small-300">
        <s-text type="strong">Sửa theo review của Stella 07 Aug 2026</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">Creator là TUỲ CHỌN, mặc định trống.</s-text> Vòng 1 tôi hiểu
              sai — creator trong template KHÔNG nằm trong kho avatar nên không có gì để hiện sẵn.
              Không đụng vào thì video giữ nguyên người có sẵn trong template.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">Dialog gộp MỘT card.</s-text> Vòng 1 có hai ô nhập cạnh nhau
              nên merchant thấy hai chỗ viết lời thoại. Giờ theo platform: bấm &quot;AI script
              writer&quot; thì chính vùng đó đổi sang ý tưởng + góc kể + Generate/Cancel. Cancel
              KHÔNG xoá chữ đã gõ.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">Add speech emotion chèn thẻ [ ] tại vị trí con trỏ</s-text>,
              đúng platform — chèn vào cuối thì mất luôn điểm của tính năng (đặt cảm xúc giữa câu).
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">Chọn product qua modal có search.</s-text> Store có thể có hàng
              nghìn sản phẩm; lưới phẳng không dùng được. Product 0 ảnh nói ra ngay trong danh sách.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">ĐÃ BỎ section Quality/Mode cấp trang</s-text> — vẫn bỏ. Model
              quay lại 13 Aug 2026 nhưng <strong>chỉ bên trong luồng đổi creator</strong>, không
              phải một lựa chọn chất lượng độc lập ở đầu trang.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Hai chỗ đổi <s-text type="strong">s-grid thay s-stack inline</s-text>: header template
              (chữ rớt xuống dưới ảnh) và &quot;What happens next&quot; (số bước rớt xuống dòng
              riêng). Đúng bẫy đã ghi ở `CLAUDE.md` §3 mà tôi vẫn dẫm phải hai lần.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>

      <s-stack direction="block" gap="small-300">
        <s-text type="strong">🛑 Cần Duong chốt</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              <strong>Giá thật của Seedance 2.0 và 2.5.</strong> Hai TÊN là thật (Stella 13 Aug
              2026), hai CON SỐ là tôi tự đặt: <strong>250</strong> và <strong>400</strong>. Chọn
              hai số này vì chúng tạo ra đủ ba vùng credit cần review quanh mức 150. Cần thêm:
              2.5 có bị chặn theo plan không (nếu có thì phải thêm state plan-gated cho model, khác
              hẳn state không-đủ-credit), và đổi creator có làm ETA generate dài hơn 2–3 phút không
              — &quot;What happens next&quot; đang hứa con số đó.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">Allowance từng plan.</s-text> Giá một video đã chốt là{' '}
              <s-text type="strong">150 credits</s-text> (Stella 08 Aug 2026) — trên plan Scale
              2.500 credit thì ra <s-text type="strong">≈16 video/tháng</s-text>, dễ thở hơn hẳn
              giả định 750 hồi trước. Còn thiếu: allowance của Starter và Growth.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              &quot;Summarise from product details&quot; lấy từ field nào của Shopify —{' '}
              <s-text type="strong">body_html</s-text>, SEO description hay metafield? Có tiêu
              credit không?
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Modal product cho chọn <s-text type="strong">MỘT</s-text> sản phẩm (một video nói về
              một sản phẩm). Nếu backend đỡ được nhiều sản phẩm thì phải đổi sang multi-select.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Bộ <s-text type="strong">thẻ cảm xúc</s-text> (6 cái) và{' '}
              <s-text type="strong">góc kể</s-text> (6 cái) suy từ screenshot platform — cần xác
              nhận đúng bộ provider nhận.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>
    </s-stack>
  );
}
