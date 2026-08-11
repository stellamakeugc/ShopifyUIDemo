/**
 * MOCKUP — AI Studio → Creator video · GALLERY
 * (viết lại 07 Aug 2026 theo SCREENSHOT platform "Content Library")
 *
 * ═══ BA THỨ SCREENSHOT SỬA SO VỚI BẢN ĐOÁN ═══
 *
 * 1. **Filter là MỘT dải chip phẳng ~35 tag**, không phải 3 dropdown niche/style/format.
 *    Taxonomy trộn lẫn ngành + format + style trong cùng một trục: `Accessories` nằm
 *    cạnh `Avatar Swap` nằm cạnh `Cinematic` nằm cạnh `Hook` nằm cạnh `Viral`. Không có
 *    thứ bậc nào. Giữ nguyên vì đó là taxonomy merchant đã quen trên platform — dựng
 *    lại cho "gọn" nghĩa là hai sản phẩm dạy hai cách tìm khác nhau.
 *
 * 2. **Card không có chữ nào** — chỉ video dọc. Tên + mô tả nằm trong modal Details.
 *    Đây là lựa chọn đúng cho surface này: merchant duyệt bằng MẮT, không đọc tên. Nhồi
 *    tiêu đề vào card làm lưới rối mà không giúp quyết định nhanh hơn.
 *
 * 3. **150 credits** — đọc thẳng từ nút "Recreate (150 credits)".
 *
 * ═══ HAI CHỖ TÔI CỐ Ý KHÁC PLATFORM ═══
 *
 * • **Không có `slot="aside"`.** Credit thuộc chỗ TIÊU tiền, không thuộc chỗ duyệt hàng.
 *   Bỏ aside cũng trả lại đủ 966px cho lưới → 5 cột thay vì 3.
 * • **Bấm "Use this template" thì SANG TRANG**, không mở form trong modal như platform.
 *   Platform nhồi cả form vào modal Details và đã phải cuộn (screenshot 4). App
 *   Shopify thêm ba khối nữa (AI script writer · actor picker · audio settings) thì modal
 *   vỡ, và actor picker sẽ thành modal-trong-modal — Polaris không làm sạch được.
 *
 * Route file thật: app/routes/app.ai-studio._index.tsx — đây là TRANG ĐÍCH của nav
 * "AI Studio" (Stella chốt 08 Aug 2026)
 */
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';

import AiStudioTabs from '../components/AiStudioTabs';
import StateSwitcher from '../components/StateSwitcher';
import type {StateOption} from '../components/StateSwitcher';
import {EmptyState, FilterPills, VideoPreview} from '../components/primitives';
import {
  VIDEO_CREDITS,
  TOTAL_TEMPLATES,
  shotAlt,
  templateTags,
  templateThumb,
  videoTemplates,
} from '../data/sample';
import type {VideoTemplate} from '../data/sample';

const STATES: StateOption[] = [
  {
    value: 'browse',
    label: 'Browse — chưa lọc, 24 template',
    doc: [
      {section: 'Cả trang', rule: 'KHÔNG render aside. Credit thuộc chỗ tiêu tiền, không thuộc chỗ duyệt hàng — và bỏ aside trả lại 966px cho lưới (5 cột thay vì 3).'},
      {section: 'Tag row', rule: 'Một trục phẳng ~35 chip, đúng thứ tự platform. KHÔNG sắp xếp lại và KHÔNG gom nhóm — merchant quen tay trên platform sẽ mò không ra.'},
      {section: 'Grid', rule: 'Card chỉ có video, không chữ. Tên + mô tả ở modal Details. Merchant duyệt bằng mắt trên surface này.'},
      {section: 'Grid — hover', rule: '🛠️ CHO DEV (Stella chốt 11 Aug 2026): hover vào một thẻ thì video ĐÓ tự chạy, MUTED, và KHÔNG có control nào — không nút play/pause, không time bar, không nút mute, không fullscreen. Rời chuột ra thì dừng. Chỉ MỘT video chạy tại một thời điểm (video đang hover), không phải cả lưới. Player đầy đủ chỉ có trong modal Details. Trên thiết bị cảm ứng không có hover nên thẻ đứng im, tap là mở Details.'},
      {section: 'Grid — hover', rule: '⚠️ Mockup CHƯA demo hành vi này: lưới đang render thumbnail tĩnh (s-image), nên hover không thấy gì. Đây là note spec, không phải mô tả cái đang chạy trước mắt.'},
      {section: 'Page action', rule: 'Không có primary action — chưa chọn template thì chưa có gì để generate. Nút disabled treo sẵn trên header làm merchant tưởng mình thiếu bước.'},
    ],
  },
  {
    value: 'tag-selected',
    label: 'Lọc theo tag "UGC"',
    doc: [
      {section: 'Tag row', rule: 'Chip đang chọn dùng variant primary + text ", selected" cho screen reader — variant chỉ truyền tải bằng màu là vi phạm a11y §9.'},
      {section: 'Grid', rule: 'Đếm cả hai số ("7 of 240") — chỉ nói "7 templates" thì không biết filter đã cắt bao nhiêu.'},
    ],
  },
  {
    value: 'no-result',
    label: 'Lọc + search không ra kết quả',
    doc: [
      {section: 'Grid', rule: 'EmptyState isEmptyState={false} — không dạy lại tính năng, không CTA tạo mới. No-search-result ≠ no-data.'},
      {section: 'Tag row', rule: 'Nút "Clear filters" chỉ hiện khi CÓ filter đang bật — đường thoát phải nằm cạnh chỗ gây ra vấn đề.'},
    ],
  },
  {
    value: 'details',
    label: 'Details modal đang mở',
    doc: [
      {section: 'Modal', rule: 'Preview 9:16 bên trái, tên + mô tả dài bên phải — đúng bố cục platform. Nút nói rõ giá: "Use this template · 150 credits".'},
      {section: 'Modal', rule: 'Video TỰ CHẠY khi mở nên nút mặc định là ⏸ Pause, không phải ▶ Play — hiện Play lúc đang chạy là nói ngược. Thanh điều khiển nằm DƯỚI ảnh, không overlay: overlay cần chữ trắng trên nền tối mà s-text color chỉ có subdued|base.'},
      {section: 'Modal', rule: 'CHỈ có tên + mô tả, đúng platform. Đã bỏ hàng tag, khối "Creator in this template" và dòng thời lượng — cả ba nhắc lại thứ đã có chỗ khác.'},
      {section: '⚠️ Tên creator', rule: 'Stella bỏ dòng tên creator khỏi thẻ ở lưới (11 Aug 2026) → giờ tên creator của template KHÔNG xuất hiện ở đâu trong app. Merchant không biết trước khuôn mặt nào sẽ chạy trong video của mình. Muốn trả lại thì chỗ đúng là modal Details, không phải thẻ ở lưới.'},
    ],
  },
  {
    value: 'quota-blocked',
    label: 'Quota blocked — hết credit',
    doc: [
      {section: 'Action zone', rule: 'Banner critical có NGÀY RESET + đường upgrade. Vẫn DUYỆT được thư viện — chặn tiêu tiền, không chặn xem hàng.'},
      {section: 'Modal', rule: 'Nút "Use this template" disabled kèm lý do bằng text ngay trong modal.'},
    ],
  },
  {
    value: 'plan-gated',
    label: 'Plan gated — Starter, không có AI Studio',
    doc: [
      {section: 'Cả trang', rule: 'EmptyState bán giá trị + Upgrade. KHÁC quota-blocked: hai đường thoát khác nhau (upgrade vs chờ reset).'},
    ],
  },
  {
    value: 'loading',
    label: 'Loading — đang load thư viện',
    doc: [
      {section: 'Grid', rule: 's-spinner có accessibilityLabel. Polaris web components KHÔNG có skeleton.'},
    ],
  },
];

type Scenario = {tag?: string; search?: string; openDetails?: string};

const SCENARIOS: Record<string, Scenario> = {
  browse: {},
  'tag-selected': {tag: 'UGC'},
  'no-result': {tag: 'Billboards', search: 'skincare'},
  details: {openDetails: 't-1'},
  'quota-blocked': {},
  'plan-gated': {},
  loading: {},
};

export default function TemplateGallery() {
  const navigate = useNavigate();
  const [state, setState] = useState('browse');
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const is = (...names: string[]) => names.includes(state);

  const applyState = (value: string) => {
    const scenario = SCENARIOS[value] ?? SCENARIOS.browse;
    setState(value);
    setTag(scenario.tag ?? '');
    setSearch(scenario.search ?? '');
    setDetailsId(scenario.openDetails ?? null);
  };

  const planGated = is('plan-gated');
  const quotaBlocked = is('quota-blocked');
  const loading = is('loading');

  const filtered = videoTemplates.filter((item) => {
    if (tag && !item.tags.includes(tag)) return false;
    if (search && !`${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const hasFilter = Boolean(tag || search);
  const details = detailsId ? videoTemplates.find((item) => item.id === detailsId) : null;

  /** Vì sao không dùng được template — text hiện sẵn trong modal, không tooltip */
  const useBlockedReason = quotaBlocked
    ? 'You have 0 credits left. Credits reset on 1 September.'
    : null;

  return (
    <s-page heading="AI Studio">
      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={applyState}
          states={STATES}
          globalNote={<GalleryPageNotes />}
        />

        <AiStudioTabs active="/app/ai-studio" />

        {quotaBlocked && (
          <s-banner tone="critical" heading="You've used all 2,500 AI credits">
            <s-paragraph>
              Credits reset on 1 September. You can still browse the library and open a template —
              you just can&apos;t generate until then.
            </s-paragraph>
            <s-button slot="secondary-actions" href="/app/billing">
              Upgrade for more credits
            </s-button>
          </s-banner>
        )}

        {planGated ? (
          <s-section>
            <EmptyState
              isEmptyState
              heading="Start from a video that already works"
              body="Browse hundreds of 15-second creator videos, drop in your product and your words, and get your own version back. Available on Growth and above."
              actionLabel="Upgrade to Growth"
              actionHref="/app/billing"
              secondaryLabel="How credits work"
              secondaryHref="#"
            />
          </s-section>
        ) : (
          <s-section>
            <s-stack direction="block" gap="base">
              <s-search-field
                label="Search templates"
                labelAccessibilityVisibility="exclusive"
                placeholder="Search templates"
                value={search}
                onInput={(event) => setSearch(event.currentTarget.value)}
              />

              {/* Dải chip phẳng — một trục duy nhất, đúng thứ tự platform.
                  `s-stack` không có `wrap` nên chip sẽ tràn một dòng; dùng flex-wrap
                  qua `s-grid` không hợp (chip rộng khác nhau). Đây là chỗ `s-box` +
                  display:flex là cách duy nhất — nhưng thử `s-stack` trước, Polaris
                  tự wrap inline content. */}
              <FilterPills
                ariaLabel="Filter templates by tag"
                options={['All', ...templateTags]}
                active={tag || 'All'}
                onPick={(value) => setTag(value === 'All' ? '' : value)}
              />

              <s-stack direction="inline" gap="small-200" alignItems="center">
                {/* Nói cả hai số — "7 templates" không cho biết filter đã cắt bao nhiêu */}
                <s-text color="subdued">
                  {hasFilter
                    ? `${filtered.length} of ${TOTAL_TEMPLATES.toLocaleString()} templates`
                    : `${TOTAL_TEMPLATES.toLocaleString()} templates`}
                </s-text>
                {/* Đường thoát nằm cạnh chỗ gây ra vấn đề, không giấu ở cuối trang */}
                {hasFilter && (
                  <s-button
                    variant="tertiary"
                    onClick={() => {
                      setTag('');
                      setSearch('');
                    }}
                  >
                    Clear filters
                  </s-button>
                )}
              </s-stack>

              {loading ? (
                <s-box padding="large-200">
                  <s-stack direction="block" gap="small-100" alignItems="center">
                    <s-spinner size="large" accessibilityLabel="Loading templates" />
                    <s-text color="subdued">Loading templates</s-text>
                  </s-stack>
                </s-box>
              ) : filtered.length === 0 ? (
                <EmptyState
                  isEmptyState={false}
                  resourceName="templates"
                  heading="No templates found"
                  body="Try another tag or search term."
                />
              ) : (
                <s-grid gap="small" gridTemplateColumns="repeat(auto-fill, minmax(150px, 1fr))">
                  {filtered.map((item) => (
                    <s-clickable
                      key={item.id}
                      borderRadius="base"
                      accessibilityLabel={`Open ${item.title}`}
                      command="--show"
                      commandFor="ad-details"
                      onClick={() => setDetailsId(item.id)}
                    >
                      {/* Card = CHỈ video, không một chữ nào (Stella chốt 11 Aug 2026).
                          Đã bỏ dòng tên creator và dòng `{N}s` / badge `New` — merchant
                          duyệt surface này bằng MẮT, chữ dưới mỗi ô chỉ làm lưới rối mà
                          không giúp quyết định nhanh hơn. Tên + mô tả nằm ở modal Details.

                          Bỏ luôn `s-stack`: một ảnh thì không cần khối xếp.

                          Ảnh phải là thumbnail THẬT của template, không phải ảnh stock
                          random — thẻ không có chữ nên ảnh picsum chụp tường gạch sẽ đọc
                          thẳng ra là "template về tường gạch".

                          ═══ 🛠️ HÀNH VI HOVER — CHO DEV (Stella chốt 11 Aug 2026) ═══
                          Trong app thật đây KHÔNG phải `s-image` mà là một video:
                            • hover vào thẻ → video đó tự chạy, MUTED
                            • KHÔNG có control nào: không play/pause, không time bar,
                              không mute, không fullscreen. Thẻ vẫn là một vùng bấm duy
                              nhất, bấm là mở modal Details.
                            • rời chuột → dừng
                            • chỉ MỘT video chạy tại một thời điểm (cái đang hover), không
                              phải cả lưới — 24 video chạy cùng lúc thì giết máy
                            • thiết bị cảm ứng không có hover → thẻ đứng im, tap mở Details
                          Player đầy đủ (pause · đồng hồ · mute · fullscreen · thanh tiến
                          trình) chỉ có trong modal Details — xem `VideoPreview`.

                          Mockup cố ý giữ `s-image` tĩnh: hover-play cần asset video thật
                          cho 24 template, chưa có. Nên KHÔNG review hành vi hover ở đây. */}
                      <s-image
                        src={templateThumb(item.id)}
                        alt={`${item.title} — ${shotAlt[item.shot]}`}
                        aspectRatio="9/16"
                        objectFit="cover"
                        borderRadius="base"
                        loading="lazy"
                      />
                    </s-clickable>
                  ))}
                </s-grid>
              )}
            </s-stack>
          </s-section>
        )}
      </s-stack>

      {/* ══ MODAL: Details ══
          Bố cục theo platform: preview trái, tên + mô tả phải, footer Close + Use. */}
      {/* "Details", không phải "Ad details" (Stella chốt 07 Aug 2026): platform là công cụ
          làm quảng cáo nên gọi mọi thứ là "ad", còn app này sống trong Shopify admin và
          video đi thẳng lên storefront — gọi là ad thì sai ngữ cảnh merchant đang đứng. */}
      <s-modal
        id="ad-details"
        heading="Details"
        accessibilityLabel={details ? `Details for ${details.title}` : 'Template details'}
      >
        {details && (
          <s-grid gap="base" gridTemplateColumns="minmax(0, 1fr) minmax(0, 1.6fr)">
            {/* Trong Details video TỰ CHẠY khi mở, merchant tạm dừng được → phải là khối
                video có điều khiển, không phải ảnh tĩnh. Lưới ngoài kia thì KHÔNG cần
                (Stella chốt): 24 video tự chạy cùng lúc vừa loạn mắt vừa giết máy.
                `key` để đổi template là đồng hồ về 0. */}
            <VideoPreview
              key={details.id}
              src={templateThumb(details.id)}
              alt={`${details.title} — ${shotAlt[details.shot]}`}
              durationSec={details.durationSec}
            />
            <s-stack direction="block" gap="base">
              <s-heading>{details.title}</s-heading>
              <s-paragraph>{details.description}</s-paragraph>

              {/* ĐÃ BỎ 07 Aug 2026 (Stella): hàng tag, khối "Creator in this template" và
                  dòng "15 seconds · vertical 9:16".

                  Modal giờ đúng platform: chỉ tên + mô tả. Ba khối kia đều nhắc lại thứ
                  đã có chỗ khác — tag chính là bộ lọc merchant vừa bấm để tới đây, thời
                  lượng nằm trong câu mô tả và trên đồng hồ của player.

                  ⚠️ 11 Aug 2026: Stella bỏ luôn dòng tên creator dưới mỗi thẻ ở lưới, nên
                  tên creator giờ KHÔNG còn ở đâu trong app. Yêu cầu disclosure ở
                  `research-ai-library-avatars.md` §2.3 hiện KHÔNG được đáp ứng — merchant
                  không biết trước khuôn mặt nào sẽ chạy trong video của mình. Muốn trả lại
                  thì đây là chỗ đúng (modal Details), không phải thẻ ở lưới. */}

              {useBlockedReason && (
                <s-box background="subdued" borderRadius="base" padding="small">
                  <s-text color="subdued">{useBlockedReason}</s-text>
                </s-box>
              )}
            </s-stack>
          </s-grid>
        )}
        <s-button
          slot="primary-action"
          variant="primary"
          disabled={Boolean(useBlockedReason)}
          command="--hide"
          commandFor="ad-details"
          onClick={() => details && navigate(`/app/ai-studio/${details.id}`)}
        >
          Use this template · {VIDEO_CREDITS} credits
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="ad-details">
          Close
        </s-button>
      </s-modal>
    </s-page>
  );
}

/** Note cấp trang — đúng ở mọi state */
function GalleryPageNotes() {
  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="block" gap="small-300">
        <s-text type="strong">Khớp screenshot platform</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              Filter là <s-text type="strong">một dải chip phẳng ~35 tag</s-text>, trộn ngành +
              format + style trong cùng một trục (Accessories cạnh Avatar Swap cạnh Cinematic cạnh
              Hook cạnh Viral). Giữ đúng thứ tự platform.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Card <s-text type="strong">không có chữ nào</s-text> — chỉ video dọc. Tên + mô tả ở
              modal Details.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">150 credits</s-text> — đọc thẳng từ nút &quot;Recreate (150
              credits)&quot;.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>

      <s-stack direction="block" gap="small-300">
        <s-text type="strong">Cố ý KHÁC platform</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              <s-text type="strong">Không có aside.</s-text> Credit thuộc chỗ tiêu tiền, không thuộc
              chỗ duyệt hàng — và bỏ nó trả lại 966px cho lưới (5 cột thay vì 3).
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Bấm dùng thì <s-text type="strong">sang trang</s-text>, không mở form trong modal.
              Platform nhồi cả form vào modal và đã phải cuộn; mình thêm ba khối nữa (AI script
              writer · actor picker · audio settings) thì modal vỡ, và actor picker thành
              modal-trong-modal.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              ⚠️ <s-text type="strong">Tên creator không còn ở đâu trong app</s-text> (Stella bỏ
              dòng dưới thẻ 11 Aug 2026, khối trong modal đã bỏ 07 Aug). Output giữ nguyên khuôn
              mặt của template — một khuôn mặt sẽ chạy trong quảng cáo của N merchant với N kịch
              bản, nên merchant nên biết trước khi bấm. Muốn trả lại thì chỗ đúng là modal Details.
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>

      <s-stack direction="block" gap="small-300">
        <s-text type="strong">🛑 Cần Duong chốt</s-text>
        <s-unordered-list>
          <s-list-item>
            <s-text color="subdued">
              Giá một video chốt là <s-text type="strong">150 credits</s-text> (Stella 08 Aug
              2026) → plan Scale 2.500 credit ra <s-text type="strong">≈16 video/tháng</s-text>.
              Còn thiếu allowance của Starter và Growth — số đó chặn pricing doc.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Thư viện thật có bao nhiêu template? Mockup để{' '}
              <s-text type="strong">24 mẫu, tổng hiện 240</s-text> — cần số thật.
            </s-text>
          </s-list-item>
          <s-list-item>
            <s-text color="subdued">
              Taxonomy có tag <s-text type="strong">&quot;Avatar Swap&quot;</s-text> như một LOẠI
              template. Nếu swap thành tính năng chung cho mọi template thì tag đó xử lý sao?
            </s-text>
          </s-list-item>
        </s-unordered-list>
      </s-stack>
    </s-stack>
  );
}
