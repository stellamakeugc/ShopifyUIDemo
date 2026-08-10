/**
 * MOCKUP — AI Studio → Avatars
 * (07 Aug 2026 — port từ SCREENSHOT platform "Add Actors", rồi thu hẹp scope)
 *
 * ═══ V1 CHỈ CÓ KHO MAKEUGC (Stella chốt 07 Aug 2026) ═══
 * Đã BỎ luồng "dựng actor từ mặt người thật". Trang này giờ thuần duyệt kho.
 *
 * Hệ quả — và đây là lý do việc bỏ này đáng giá hơn là mất một tính năng:
 *  • Phơi nhiễm **Illinois BIPA về gần 0**. Không còn `scan of face geometry` nào do
 *    merchant upload, mà đó là hạng mục DUY NHẤT trong cả nghiên cứu có **quyền khởi
 *    kiện tư nhân** ($1.000–$5.000/vi phạm, không cần chứng minh thiệt hại, vendor cũng
 *    có thể bị lôi vào theo *Kronos*). Xem `deliverables/research-ai-library-avatars.md` §2.2.
 *  • Tickbox consent biến mất → không còn gì phải chờ legal review trước launch.
 *  • Ma sát merchant về đúng **0 bước**: chọn actor rồi dùng, không popup, không cam kết.
 *
 * ⚠️ MỘT NGHĨA VỤ KHÔNG MẤT ĐI: actor trong kho vẫn có quyền rút likeness bất cứ lúc nào
 * (chuẩn ngành HeyGen), và khi đó video đã publish trên **storefront widget của merchant**
 * phải bị gỡ. Bỏ custom actor không xoá được việc này — nó chỉ chuyển người rút quyền từ
 * "nhân viên của merchant" sang "actor của MakeUGC". UI cho ca đó CHƯA vẽ, đã ghi vào
 * `open[]` của registry.
 *
 * ⛔ 07 Aug 2026 — TRANG NÀY HIỆN KHÔNG CÓ ĐƯỜNG VÀO.
 * Stella bỏ tab `Avatars` khỏi AI Studio: một trang chỉ để ngắm, không có hành động nào,
 * là ngõ cụt trong admin hướng-tác-vụ. Kho actor giờ sống trong modal `Add actors` của
 * trang compose.
 * Giữ file lại vì câu hỏi "merchant xem kho TRƯỚC khi chọn template bằng cách nào" chưa
 * có đáp án — nếu chốt thêm nút `Browse creators` thì nó mở modal, và trang này vẫn thừa;
 * nếu chốt cần một trang duyệt riêng thì đây là bản đã dựng sẵn.
 *
 * Route file thật: app/routes/app.ai-studio.avatars.tsx
 */
import {useState} from 'react';

import StateSwitcher from '../components/StateSwitcher';
import type {StateOption} from '../components/StateSwitcher';
import {EmptyState, FilterPills, TabBar} from '../components/primitives';
import {actorAges, actorGenders, actorPortrait, actorSkinTones, actorStyles, actors} from '../data/sample';

const TABS = [
  {id: 'all', label: 'All'},
  {id: 'realistic', label: 'Realistic'},
  {id: 'styled', label: 'Styled'},
] as const;

type TabId = (typeof TABS)[number]['id'];

const STATES: StateOption[] = [
  {
    value: 'default',
    label: 'Default — kho 24 actor, chưa lọc',
    doc: [
      {section: 'Cả trang', rule: 'KHÔNG có aside → 966px cho lưới. Trang không tiêu credit nên aside sẽ trống.'},
      {section: 'Cả trang', rule: 'KHÔNG có primary action. V1 bỏ custom actor nên merchant không TẠO gì ở đây — trang thuần duyệt. Một nút "Add actor" disabled treo sẵn là hứa hẹn tính năng không tồn tại.'},
      {section: 'Grid', rule: 'Không tickbox, không popup, không cảnh báo. MakeUGC đã lo consent với actor một lần từ trước — ma sát merchant đúng bằng 0.'},
    ],
  },
  {
    value: 'filters',
    label: 'Lọc — Female · 30-40 · tone Light',
    doc: [
      {section: 'Filters', rule: 'Platform để filter ở rail TRÁI của một modal rất rộng. Trong page 966px, rail trái ăn hết chỗ lưới → xếp ngang thành hàng filter.'},
      {section: 'Filters', rule: 'Đếm cả hai số ("3 of 24") — chỉ nói "3 actors" thì không biết filter đã cắt bao nhiêu.'},
      {section: 'Skin tone', rule: 'Mỗi swatch có nhãn CHỮ + accessibilityLabel; 4 ô màu trần như platform vi phạm "không truyền tải thông tin chỉ bằng màu" (§9). Dùng s-grid 4 cột — s-clickable là block nên trong div flex nó giãn thành 4 hàng.'},
    ],
  },
  {
    value: 'styles-open',
    label: 'Mở bộ lọc Style (30 chip)',
    doc: [
      {section: 'Filters', rule: '~30 chip style THU GỌN mặc định — bung hết thì dài hơn cả lưới actor và đẩy nội dung chính xuống dưới màn hình.'},
    ],
  },
  {
    value: 'no-result',
    label: 'Lọc không ra kết quả',
    doc: [
      {section: 'Grid', rule: 'EmptyState isEmptyState={false} — không dạy lại, không CTA tạo mới. Nút Clear filters nằm cạnh chỗ gây ra vấn đề, không giấu cuối trang.'},
    ],
  },
  {
    value: 'loading',
    label: 'Loading — đang load kho',
    doc: [
      {section: 'Cả trang', rule: 's-spinner có accessibilityLabel. Polaris web components KHÔNG có skeleton.'},
    ],
  },
  {
    value: 'plan-gated',
    label: 'Plan gated — Starter, không có AI Studio',
    doc: [
      {section: 'Cả trang', rule: 'EmptyState bán giá trị + Upgrade. Gói KHÔNG CÓ tính năng — khác hẳn quota-blocked (hết credit, chờ reset).'},
    ],
  },
];

type Scenario = {
  tab?: TabId;
  gender?: string;
  age?: string;
  tone?: string;
  showStyles?: boolean;
};

const SCENARIOS: Record<string, Scenario> = {
  default: {},
  filters: {gender: 'Female', age: '30-40', tone: 'tone-1'},
  'styles-open': {showStyles: true},
  'no-result': {gender: 'Male', age: '60+', tone: 'tone-3'},
  loading: {},
  'plan-gated': {},
};

export default function AiStudioAvatars() {
  const [state, setState] = useState('default');
  const [tab, setTab] = useState<TabId>('all');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [tone, setTone] = useState('');
  const [style, setStyle] = useState('');
  const [search, setSearch] = useState('');
  const [showStyles, setShowStyles] = useState(false);

  const is = (...names: string[]) => names.includes(state);

  const applyState = (value: string) => {
    const scenario = SCENARIOS[value] ?? SCENARIOS.default;
    setState(value);
    setTab(scenario.tab ?? 'all');
    setGender(scenario.gender ?? '');
    setAge(scenario.age ?? '');
    setTone(scenario.tone ?? '');
    setStyle('');
    setSearch('');
    setShowStyles(Boolean(scenario.showStyles));
  };

  const planGated = is('plan-gated');
  const loading = is('loading');
  const hasFilter = Boolean(gender || age || tone || style || search);

  const filtered = actors.filter((item) => {
    if (tab === 'realistic' && item.kind !== 'Realistic') return false;
    if (tab === 'styled' && item.kind !== 'Styled') return false;
    if (gender && item.gender !== gender) return false;
    if (age && item.age !== age) return false;
    if (tone && item.skinTone !== tone) return false;
    if (style && item.style !== style) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <s-page heading="AI Studio">
      {/* KHÔNG có primary action: V1 bỏ custom actor nên merchant không tạo gì ở đây.
          Trang thuần duyệt. Nút "Add actor" disabled treo sẵn trên header là hứa hẹn một
          tính năng không tồn tại. */}
      {planGated && (
        <s-button slot="primary-action" variant="primary" href="/app/billing">
          Upgrade to Growth
        </s-button>
      )}

      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={applyState}
          states={STATES}
          globalNote={<AvatarsPageNotes />}
        />

        {/* ĐÃ BỎ AiStudioTabs (Stella chốt 07 Aug 2026): trang này không còn nằm trong
            bộ tab của AI Studio. Hiện KHÔNG CÓ đường vào từ app — giữ lại trong harness
            để review, chờ chốt có thêm "Browse creators" trên trang gallery hay không. */}

        {planGated ? (
          <s-section>
            <EmptyState
              isEmptyState
              heading="Put a face to your product videos"
              body="Browse MakeUGC creators and drop any of them into a template. Available on Growth and above."
              actionLabel="Upgrade to Growth"
              actionHref="/app/billing"
            />
          </s-section>
        ) : loading ? (
          <s-section>
            <s-box padding="large-200">
              <s-stack direction="block" gap="small-100" alignItems="center">
                <s-spinner size="large" accessibilityLabel="Loading actors" />
                <s-text color="subdued">Loading actors</s-text>
              </s-stack>
            </s-box>
          </s-section>
        ) : (
          <>
            <TabBar tabs={TABS} active={tab} onChange={setTab} />

            <s-section heading="MakeUGC library">
              <s-stack direction="block" gap="base">
                <s-paragraph color="subdued">
                  Ready to use in any template. Nothing to set up — these creators have already
                  agreed to appear in merchant ads.
                </s-paragraph>

                <s-search-field
                  label="Search actors"
                  labelAccessibilityVisibility="exclusive"
                  placeholder="Search actors"
                  value={search}
                  onInput={(event) => setSearch(event.currentTarget.value)}
                />

                <s-grid gap="small-200" gridTemplateColumns="minmax(0, 1fr) minmax(0, 1fr)">
                  <s-select
                    label="Gender"
                    value={gender}
                    onChange={(event) => setGender(event.currentTarget.value)}
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
                    value={age}
                    onChange={(event) => setAge(event.currentTarget.value)}
                  >
                    <s-option value="">Any age</s-option>
                    {actorAges.map((item) => (
                      <s-option key={item} value={item}>
                        {item}
                      </s-option>
                    ))}
                  </s-select>
                </s-grid>

                {/* Swatch màu da — platform dùng 4 ô màu TRẦN. Ô màu trần không đọc được
                    bằng screen reader và vi phạm "không truyền tải thông tin chỉ bằng màu"
                    (§9), nên mỗi ô có nhãn chữ + accessibilityLabel. Hex là màu da thật,
                    không phải màu brand → không phá §6.
                    `s-grid` chứ không div flex: `s-clickable` là block nên trong flex nó
                    vẫn giãn hết ngang, 4 swatch thành 4 hàng. */}
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
                        onClick={() => setTone(tone === item.id ? '' : item.id)}
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
                          {tone === item.id && <s-icon type="check" size="small" tone="success" />}
                        </s-stack>
                      </s-clickable>
                    ))}
                  </s-grid>
                </s-stack>

                {/* ~30 chip style — thu gọn mặc định. Bung hết thì dài hơn cả lưới actor
                    và đẩy nội dung chính xuống dưới màn hình. */}
                <s-stack direction="block" gap="small-400">
                  <s-stack direction="inline" gap="small-200" alignItems="center">
                    <s-button variant="tertiary" onClick={() => setShowStyles((v) => !v)}>
                      {showStyles ? 'Hide styles' : `Filter by style (${actorStyles.length})`}
                    </s-button>
                    {style && <s-badge tone="info">{style}</s-badge>}
                  </s-stack>
                  {showStyles && (
                    <FilterPills
                      ariaLabel="Filter actors by style"
                      options={actorStyles}
                      active={style || null}
                      onPick={(item) => setStyle(style === item ? '' : item)}
                    />
                  )}
                </s-stack>

                <s-stack direction="inline" gap="small-200" alignItems="center">
                  {/* Nói cả hai số — "3 actors" không cho biết filter đã cắt bao nhiêu */}
                  <s-text color="subdued">
                    {filtered.length} of {actors.length} actors
                  </s-text>
                  {hasFilter && (
                    <s-button
                      variant="tertiary"
                      onClick={() => {
                        setGender('');
                        setAge('');
                        setTone('');
                        setStyle('');
                        setSearch('');
                      }}
                    >
                      Clear filters
                    </s-button>
                  )}
                </s-stack>

                {filtered.length === 0 ? (
                  <EmptyState
                    isEmptyState={false}
                    resourceName="actors"
                    heading="No actors found"
                    body="Try changing the filters or search term."
                  />
                ) : (
                  <s-grid gap="small" gridTemplateColumns="repeat(auto-fill, minmax(130px, 1fr))">
                    {filtered.map((item) => (
                      <s-box key={item.id} border="base" borderRadius="base" padding="small-400">
                        <s-stack direction="block" gap="small-400">
                          {/* Chân dung thật, sinh bằng agy 07 Aug 2026. Người trong ảnh
                              KHÔNG có thật — xem ghi chú ở `actorPortrait`. */}
                          <s-image
                            src={actorPortrait(item.id)}
                            alt={item.name}
                            aspectRatio="3/4"
                            objectFit="cover"
                            borderRadius="base"
                            loading="lazy"
                          />
                          <s-stack direction="inline" gap="small-400" alignItems="center">
                            <s-text type="strong">{item.name}</s-text>
                            {item.hd && <s-badge>HD</s-badge>}
                          </s-stack>
                          <s-text color="subdued">
                            {item.gender} · {item.age}
                          </s-text>
                          <s-text color="subdued">{item.style}</s-text>
                          {/* Dòng badge luôn có nội dung: thẻ có "New" và thẻ không có phải
                              cao bằng nhau, không thì hàng so le. */}
                          {item.isNew ? (
                            <s-badge tone="info">New</s-badge>
                          ) : (
                            <s-text color="subdued">{item.kind}</s-text>
                          )}
                        </s-stack>
                      </s-box>
                    ))}
                  </s-grid>
                )}
              </s-stack>
            </s-section>
          </>
        )}
      </s-stack>
    </s-page>
  );
}

/** Note cấp trang — đúng ở mọi state */
function AvatarsPageNotes() {
  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="block" gap="small-300">
        <s-text type="strong">⏸️ V1 chỉ có kho — đã bỏ custom actor (Stella chốt 07 Aug 2026)</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              Bỏ luồng dựng actor từ mặt người thật. Phơi nhiễm{' '}
              <s-text type="strong">Illinois BIPA về gần 0</s-text> — không còn scan hình học
              khuôn mặt nào do merchant upload, mà đó là hạng mục duy nhất trong cả nghiên cứu có{' '}
              <s-text type="strong">quyền khởi kiện tư nhân</s-text>.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Tickbox consent biến mất theo →{' '}
              <s-text type="strong">không còn gì phải chờ legal review</s-text> trước launch. Ma
              sát merchant về đúng 0 bước.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Field <s-text type="strong">source · status · consent</s-text> vẫn giữ trong type
              `Actor` dù giờ mọi actor đều là library + ready — bật lại là thêm data, không phải
              thiết kế lại schema rồi migrate.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>

      <s-stack direction="block" gap="small-300">
        <s-text type="strong">🛑 Bỏ custom actor KHÔNG xoá được nghĩa vụ này</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              Actor trong kho vẫn có quyền{' '}
              <s-text type="strong">rút likeness bất cứ lúc nào</s-text> (chuẩn ngành HeyGen), và
              khi đó video đã publish trên{' '}
              <s-text type="strong">storefront widget của merchant</s-text> phải bị gỡ. Bỏ custom
              chỉ đổi người rút quyền từ &quot;nhân viên của merchant&quot; sang &quot;actor của
              MakeUGC&quot; — nghĩa vụ takedown lan truyền vẫn nguyên.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">UI cho ca đó CHƯA vẽ.</s-text> Merchant cần biết video nào vừa
              bị gỡ và vì sao. Cần Duong xác nhận backend làm được trước khi thiết kế.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>

      <s-stack direction="block" gap="small-300">
        <s-text type="strong">Rule cấp trang</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              Trang này <s-text type="strong">thuần duyệt</s-text> — không tạo, không sửa, không
              xoá, không primary action. Chọn actor lúc soạn video thì dùng modal Add actors trong
              trang compose.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              KHÔNG có aside → 966px cho lưới. Trang không tiêu credit nên aside sẽ trống.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Filter parity với platform:{' '}
              <s-text type="strong">gender · age 5 bậc · skin tone · ~30 chip style</s-text> (Stella
              chốt 07 Aug 2026 giữ nguyên cả GENDER lẫn COLOR).
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>

      <s-stack direction="block" gap="small-300">
        <s-text type="strong">⏳ Cần chốt</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              Kho thật có bao nhiêu actor? Listing đã submit claim{' '}
              <s-text type="strong">1000+ avatars</s-text>; mockup có 24 và cố ý KHÔNG bịa số tổng.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Gói Free có bị giới hạn <s-text type="strong">subset của kho</s-text> không, hay duyệt
              hết? Đề xuất duyệt hết — 3/4 đối thủ cho free chạm avatar, khoá lưới là mất luôn lý do
              upgrade.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>
    </s-stack>
  );
}
