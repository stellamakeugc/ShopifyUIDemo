/**
 * MOCKUP — Plans (vẽ lại 06 Aug 2026)
 *
 * ═══ VÌ SAO TRANG NÀY QUAN TRỌNG HƠN VẺ NGOÀI CỦA NÓ ═══
 * Đây là đích đến của MỌI CTA upgrade trong app (Home credit card, AI Studio
 * quota-blocked/plan-gated, CreditMeter). Roadmap Phase 1 đo *free → paid
 * conversion*, Phase 2 đo *MRR + plan mix* — cả hai đi qua đúng màn này.
 *
 * ═══ QUYẾT ĐỊNH TRONG SESSION NÀY (Stella, 06 Aug 2026) ═══
 * 1. **Không có trial.** Free Forever thay trial → KHÔNG vẽ state trial-active /
 *    trial-ended. Metric "Trial → paid" của roadmap phải đọc là *free → paid*.
 * 2. **Starter KHÔNG có AI credit** — AI Studio bắt đầu từ Growth (roadmap Phase 0).
 *    Xem `sample.ts` → `PLANS` để biết hệ quả pricing chưa giải quyết.
 * 3. **Plans CÓ trong nav app thật** (Stella xác nhận) → gỡ chặn P0 "CTA upgrade
 *    không có đích". Chờ screenshot để lấy nhãn nav thật + tên/giá plan thật.
 *
 * ═══ RÀNG BUỘC ROADMAP PHASE 0 — KHÔNG được vẽ khác ═══
 *  - 4 plan: Free Forever / $29 / $99 / $299
 *  - **subscriptions only** — Shopify App Pricing không có one-time purchase
 *  - **hard stop on credits, no overage charges**
 *  - KHÔNG có trong MVP: credit top-up packs · annual billing · account linking
 * → Trang KHÔNG có nút "buy more credits", KHÔNG có toggle monthly/annual. Cả hai
 *   thứ đó được trả lời trong FAQ ở cuối trang, chỗ merchant thật sự đi hỏi.
 *
 * Route file thật: app/routes/app.billing.tsx
 */
import {Fragment, useEffect, useRef, useState} from 'react';

import StateSwitcher from '../components/StateSwitcher';
import type {StateOption} from '../components/StateSwitcher';
import {ProgressBar} from '../components/primitives';
import {PLANS, PLAN_FEATURES, TOTAL_VIDEOS} from '../data/sample';
import type {Plan} from '../data/sample';

/** Ngưỡng cảnh báo chủ động — checklist §2: nói TRƯỚC khi hết, không chờ chặn mới nói */
const LOW_CREDIT_THRESHOLD = 0.2;

/** ⏳ Chờ Duong: reset theo billing cycle Shopify hay ngày 1 mỗi tháng? */
const RESET_DATE = '1 September';

const STATES: StateOption[] = [
  {
    value: 'growth',
    label: 'Default — đang dùng Growth ($99), còn credit',
    doc: [
      {
        section: 'Cả trang',
        rule: 'Credit chỉ được nói ở ĐÚNG MỘT chỗ dạng số liệu (card "AI videos this cycle"). Plan card nói allowance của từng plan — đó là thông tin khác, không phải nhắc lại.',
      },
    ],
  },
  {
    value: 'starter',
    label: 'Starter ($29) — trả tiền nhưng KHÔNG có AI credit',
    doc: [
      {
        section: 'Your plan',
        rule: 'credits = 0 thì KHÔNG vẽ meter (meter 0/0 đọc như lỗi). Thay bằng câu nói AI Studio bắt đầu từ đâu, không kèm button — Compare plans nằm ngay dưới, thêm CTA nữa là nói hai lần.',
      },
      {
        section: 'Vì sao có state này',
        rule: 'Để đọc thử: merchant trả $29 có hiểu ngay là mình KHÔNG có AI video không? Nếu phải dò mới thấy thì copy sai. Theo Notion, Starter bán "unlimited widget + bỏ branding" — không phải AI.',
      },
    ],
  },
  {
    value: 'free',
    label: 'Free Forever — chưa trả tiền',
    doc: [
      {
        section: 'Khác gì quota-blocked',
        rule: 'Free là "plan không có tính năng" (đường ra: upgrade). quota-blocked là "hết credit" (đường ra: chờ reset HOẶC upgrade). Gộp copy của hai cái là dẫn merchant đi sai.',
      },
    ],
  },
  {
    value: 'low-credit',
    label: 'Low credit — còn 12% allowance (dưới ngưỡng 20%)',
    doc: [
      {
        section: 'Action zone',
        rule: 'Banner warning, KHÔNG phải critical: chưa có gì bị chặn. Tone critical ở đây làm merchant tưởng AI Studio đã dừng.',
      },
    ],
  },
  {
    value: 'quota-blocked',
    label: 'Quota blocked — hết credit giữa cycle',
    doc: [
      {
        section: 'Action zone',
        rule: 'Bắt buộc đủ ba thứ: hết cái gì · NGÀY RESET · đường upgrade. Hard stop mà không giải thích = support ticket, và đó là guardrail metric của roadmap.',
      },
      {
        section: 'Cả trang',
        rule: 'Nói rõ cái gì VẪN chạy (video còn live, sales tracking vẫn đếm). Không nói thì merchant tưởng cả app dừng.',
      },
    ],
  },
  {
    value: 'scale',
    label: 'Scale ($299) — tier cao nhất, không còn gì để upgrade',
    doc: [
      {
        section: 'Plan card',
        rule: 'Không còn nút Upgrade nào — 3 nút còn lại đều là Downgrade/Cancel. State này để bắt lỗi copy mặc định kiểu "Upgrade to unlock more".',
      },
    ],
  },
  {
    value: 'no-permission',
    label: 'No permission — staff không có billing access',
    doc: [
      {
        section: 'Plan card',
        rule: '🔴 Lý do disable là TEXT HIỆN SẴN dưới lưới, KHÔNG phải tooltip. Verified 05 Aug 2026: `interestFor` không mở trên control `disabled` — browser không dispatch pointer event lên đó và keyboard cũng không tab tới được.',
      },
      {
        section: 'Cả trang',
        rule: 'Disable chứ KHÔNG ẩn (checklist §6). Ẩn thì staff không hiểu vì sao mình không thấy nút, và không biết đi hỏi ai.',
      },
    ],
  },
  {
    value: 'payment-failed',
    label: 'Payment failed — Shopify không charge được',
    doc: [
      {
        section: 'Your plan',
        rule: 'Card current plan phải MANG DẤU HIỆU (badge critical + dòng nói credit đang pause). Bản trước chỉ có banner ở trên, còn card dưới hiện "Growth — current plan" bình thường như không có chuyện gì.',
      },
    ],
  },
  {
    value: 'loading',
    label: 'Loading — chưa có dữ liệu plan',
    doc: [
      {
        section: 'Cả trang',
        rule: 'KHÔNG hiện tên plan/số credit nào khi chưa load xong. Nhãn nói dối lúc loading là lỗi đã bắt ở Library ("Showing 20 of 24" trong khi còn spinner).',
      },
    ],
  },
];

/** Plan nào đang dùng, theo state của review tool */
const CURRENT_BY_STATE: Record<string, string> = {
  growth: 'growth',
  starter: 'starter',
  free: 'free',
  'low-credit': 'growth',
  'quota-blocked': 'growth',
  scale: 'scale',
  'no-permission': 'growth',
  'payment-failed': 'growth',
  loading: 'growth',
};

/**
 * Credit đã tiêu trong cycle, theo state.
 *
 * Tính theo TỈ LỆ chứ không hardcode con số: allowance của Growth vừa đổi 50 → 500
 * (khớp Notion), và mọi con số cứng viết cho 50 lập tức sai nghĩa — "38 đã dùng" trên
 * nền 500 là meter gần rỗng, còn "còn 8" thành 1,6% tức đã là gần-hết chứ không phải
 * cảnh báo sớm. State định nghĩa bằng tỉ lệ thì đổi allowance bao nhiêu cũng đúng.
 */
function usedCreditsFor(state: string, plan: Plan) {
  if (plan.credits === 0) return 0;
  if (state === 'quota-blocked') return plan.credits;
  // Còn 12% → nằm dưới ngưỡng cảnh báo 20% nhưng chưa bị chặn
  if (state === 'low-credit') return Math.round(plan.credits * 0.88);
  return Math.round(plan.credits * 0.76);
}

type Intent = 'upgrade' | 'downgrade' | 'cancel';

function intentFor(target: Plan, current: Plan): Intent {
  if (target.price === 0) return 'cancel';
  return target.price > current.price ? 'upgrade' : 'downgrade';
}

export default function Plans() {
  const [state, setState] = useState('growth');
  const [targetId, setTargetId] = useState<string | null>(null);
  /** Câu FAQ đang mở. `0` = mở sẵn câu đầu, `null` = đóng hết */
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  /** Bảng so sánh đầy đủ — THU GỌN mặc định (Stella, 06 Aug 2026) */
  const [tableOpen, setTableOpen] = useState(false);

  const is = (...names: string[]) => names.includes(state);
  const readOnly = is('no-permission');
  const loading = is('loading');

  const current = PLANS.find((plan) => plan.id === CURRENT_BY_STATE[state])!;
  const target = PLANS.find((plan) => plan.id === targetId) ?? null;

  const used = usedCreditsFor(state, current);
  const remaining = Math.max(0, current.credits - used);
  const usedPercent = current.credits > 0 ? Math.round((used / current.credits) * 100) : 0;

  // Action zone: TỐI ĐA MỘT banner. Ưu tiên giảm dần — cái chặn hành động thắng
  // cái chỉ cảnh báo. Hai banner cùng nói về credit là lỗi đã bắt ở Home.
  const banner: 'payment-failed' | 'quota-blocked' | 'low-credit' | null = loading
    ? null
    : is('payment-failed')
      ? 'payment-failed'
      : current.credits > 0 && remaining === 0
        ? 'quota-blocked'
        : current.credits > 0 && remaining / current.credits <= LOW_CREDIT_THRESHOLD
          ? 'low-credit'
          : null;

  return (
    /* Heading = "Billing", khớp nhãn nav đã verify 06 Aug 2026 từ screenshot Widgets.
       Nav ghi "Billing" mà H1 ghi "Plans" là merchant bấm một chữ rồi tới một chữ khác —
       nhỏ nhưng đúng loại lệch làm app đọc ra là chắp vá. Nội dung vẫn là chọn plan. */
    <s-page heading="Billing">
      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={setState}
          states={STATES}
          globalNote={
            <s-stack direction="block" gap="small-300">
              <s-text type="strong">Ràng buộc áp cho MỌI state</s-text>
              <s-paragraph color="subdued">
                Roadmap Phase 0: subscription only, hard stop on credits, không overage. Credit
                top-up pack · annual billing · shared credit pool đều là post-MVP → trang cố ý
                KHÔNG có control cho ba thứ đó; chúng được trả lời trong FAQ cuối trang.
              </s-paragraph>
              <s-paragraph color="subdued">
                ⏳ Chỉ Scale = 2.500 credit/mo là con số verify được từ app thật. Growth = 50 là
                phỏng đoán — cần Duong xác nhận trước khi trang này đi vào app.
              </s-paragraph>
            </s-stack>
          }
        />

        {/* ══ ACTION ZONE — tối đa MỘT banner ══ */}
        {banner === 'payment-failed' && (
          <s-banner tone="critical" heading={`We couldn't charge your ${current.name} subscription`}>
            <s-paragraph>
              Shopify tried on 1 August and the charge was declined. Your videos are still live and
              sales tracking keeps running. AI Studio is paused until the charge goes through — we
              retry automatically for 7 days.
            </s-paragraph>
            {/* In real app: deep link Shopify admin → /admin/settings/billing.
                Không phải trang trong app — merchant sửa thẻ ở phía Shopify. */}
            <s-button slot="secondary-actions" href="#" target="_blank">
              Update payment method
            </s-button>
          </s-banner>
        )}

        {banner === 'quota-blocked' && (
          <s-banner
            tone="critical"
            heading={`You've used all ${current.credits} AI videos on ${current.name} this cycle`}
          >
            <s-paragraph>
              Credits reset on {RESET_DATE}. Everything except AI Studio keeps working — your
              videos stay live and sales tracking continues.
            </s-paragraph>
            {!readOnly && (
              <s-button slot="secondary-actions" onClick={() => setTargetId('scale')}>
                Upgrade to Scale
              </s-button>
            )}
          </s-banner>
        )}

        {banner === 'low-credit' && (
          <s-banner
            tone="warning"
            heading={`${remaining} of your ${current.credits} AI videos left this cycle`}
          >
            <s-paragraph>
              Nothing is blocked yet. Credits reset on {RESET_DATE} — if you need more before then,
              moving to a higher plan takes effect right away.
            </s-paragraph>
          </s-banner>
        )}

        {readOnly && (
          <s-banner tone="info" heading="You can see the plan but can't change it">
            <s-paragraph>
              Only the store owner and staff with billing access can change plans or view invoices.
            </s-paragraph>
          </s-banner>
        )}

        {loading ? (
          <s-section>
            <s-stack direction="block" gap="small" alignItems="center">
              <s-spinner accessibilityLabel="Loading your plan" />
              {/* Không nói tên plan hay con số nào ở đây — chưa biết thì đừng viết */}
              <s-text color="subdued">Loading your plan…</s-text>
            </s-stack>
          </s-section>
        ) : (
          <>
            {/* ══ YOUR PLAN — nơi DUY NHẤT credit hiện dạng số liệu ══ */}
            <s-section heading="Your plan">
              <s-stack direction="block" gap="base">
                <s-stack
                  direction="inline"
                  gap="small"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <s-stack direction="block" gap="small-400">
                    <s-stack direction="inline" gap="small-200" alignItems="center">
                      <s-text type="strong">{current.name}</s-text>
                      {/* Card phải tự mang dấu hiệu, không dựa vào banner ở trên */}
                      {is('payment-failed') && <s-badge tone="critical">Payment failed</s-badge>}
                    </s-stack>
                    <s-text color="subdued">
                      {current.price === 0
                        ? 'Free forever. No card required.'
                        : is('payment-failed')
                          ? `$${current.price}/month · retrying the 1 August charge`
                          : `$${current.price}/month · next charge ${RESET_DATE}`}
                    </s-text>
                  </s-stack>
                  {/* ⛔ ĐÃ BỎ 06 Aug 2026 (Stella) — `<s-heading>${price}/mo` ở mép phải.
                      Nó in lại đúng con số mà dòng bên trái vừa nói ("$99/month · next
                      charge 1 September"), chỉ khác cách viết tắt. Dòng bên trái thắng
                      vì nó còn mang ngày charge. */}
                </s-stack>

                <s-divider />

                <s-grid gap="base" gridTemplateColumns="repeat(auto-fit, minmax(260px, 1fr))">
                  <s-stack direction="block" gap="small-200">
                    <s-text type="strong">AI videos this cycle</s-text>
                    {current.credits === 0 ? (
                      /* Meter 0/0 đọc như lỗi → không vẽ meter. Và KHÔNG đặt CTA ở
                         đây: Compare plans nằm ngay dưới, thêm nút nữa là nói hai lần
                         cùng một câu. Bản trước có nút "Add AI credits" mở modal đổi
                         subscription — nhãn nói credit, hành động là đổi plan, và
                         credit top-up thì lại là post-MVP. */
                      <s-stack direction="block" gap="small-300">
                        <s-heading>Not included</s-heading>
                        {/* KHÔNG viết "everything else has no monthly limit": theo Notion,
                            Free Forever CÓ giới hạn (1 widget · 5 shoppable video). Câu
                            "không giới hạn" trên plan có giới hạn là nói ngược sự thật ở
                            đúng chỗ merchant đọc để quyết. Derive từ `PLANS` nên đổi
                            pricing là câu này tự đúng theo. */}
                        <s-paragraph color="subdued">
                          AI Studio starts on Growth. {current.name} covers{' '}
                          {current.widgetLimit === null
                            ? 'unlimited widgets and shoppable videos'
                            : `${current.widgetLimit} widget and up to ${current.videoLimit} shoppable videos`}
                          , with unlimited views and sales tracking.
                        </s-paragraph>
                      </s-stack>
                    ) : (
                      <s-stack direction="block" gap="small-300">
                        <s-stack
                          direction="inline"
                          gap="small-100"
                          justifyContent="space-between"
                          alignItems="end"
                        >
                          <s-heading>{remaining} left</s-heading>
                          <s-text color="subdued">
                            {used} of {current.credits} used
                          </s-text>
                        </s-stack>
                        {/* `hideLabel`: dòng "12 left · 38 of 50 used" ngay trên bar
                            đã nói đúng con số đó rồi — hiện thêm "76% used" là nói
                            cùng một thông tin lần thứ ba trong một ô. Label vẫn giữ
                            làm aria-label, nếu không screen reader chỉ đọc "76%". */}
                        <ProgressBar
                          progress={usedPercent}
                          tone={remaining === 0 ? 'critical' : 'primary'}
                          hideLabel
                          label={`${used} of ${current.credits} AI videos used this cycle`}
                        />
                        <s-text color="subdued">
                          {/* Rollover đọc từ `PLANS`, không gõ tay: Notion cho Growth và
                              Scale CÓ rollover, Free/Starter thì không có credit nào để
                              cộng dồn. Bản trước hardcode "don't roll over" cho mọi plan —
                              nói ngược sự thật ở đúng chỗ merchant tính xem có phí tiền
                              khi dùng không hết. */}
                          Resets {RESET_DATE}.{' '}
                          {current.creditRollover
                            ? 'Unused credits roll over to next cycle.'
                            : 'Unused credits don’t roll over.'}
                        </s-text>
                        {is('payment-failed') && (
                          <s-text color="subdued">
                            Paused while we retry the charge — your {remaining} remaining credits
                            are still there.
                          </s-text>
                        )}
                      </s-stack>
                    )}
                  </s-stack>

                  <s-stack direction="block" gap="small-200">
                    <s-text type="strong">What you&apos;re using</s-text>
                    {(
                      [
                        ['Videos in your library', TOTAL_VIDEOS.toLocaleString('en-US')],
                        ['Video imports this cycle', '18'],
                        [
                          'AI videos generated this cycle',
                          current.credits === 0 ? '—' : String(used),
                        ],
                      ] as const
                    ).map(([label, value]) => (
                      <s-stack
                        key={label}
                        direction="inline"
                        gap="small-100"
                        justifyContent="space-between"
                      >
                        <s-text color="subdued">{label}</s-text>
                        <s-text type="strong">{value}</s-text>
                      </s-stack>
                    ))}
                    {/* ⛔ ĐÃ BỎ 06 Aug 2026 (Stella) — box "Your bill can't go above $X".
                        Nó nói LẠI đúng câu FAQ số 1 đã trả lời ("We never charge you for
                        going over"), chỉ khác cách diễn đạt. Ràng buộc hard-stop của
                        `ENTERPRISE-UX-CHECKLIST.md` §2 vẫn còn đủ chỗ nói: FAQ câu 1 ·
                        banner `quota-blocked` (có ngày reset + đường upgrade) · dòng
                        "Resets {date}. Unused credits don't roll over." ngay dưới meter.
                        → Bỏ box không làm hở enterprise gate. */}
                  </s-stack>
                </s-grid>
              </s-stack>
            </s-section>

            {/* ══ LƯỚI PLAN CARD ══
                ⛔ Heading "Compare plans" ĐÃ BỎ 06 Aug 2026 (Stella): bốn thẻ có tên
                plan + giá + nút ngay trên đầu đã tự nói chúng là gì, thêm một dòng
                tiêu đề nữa là nói hộ thứ mắt đã thấy.
                ⚠️ Lưới KHÔNG được bọc trong `s-section`: `s-section` lồng nhau thì cái
                bên trong mất surface riêng (§7f). Ở đây thẻ tự dựng bằng `s-box` nên
                kiểm soát được viền — cần thế để làm nổi thẻ "Most popular". */}
            {/* minmax 180px chứ không phải 240px: ở chiều rộng thật của cột main
                (1440 − 240 sidebar, trừ padding) thì 240px chỉ xếp được 3 cột và
                Scale rơi xuống hàng hai một mình — đúng lỗi grid mồ côi đã bắt ở
                Home. `auto-fit` với 4 item không bao giờ vượt quá 4 cột. */}
            {/* Xoá khối <style> này + 4 class trong `PlanCard` là quay lại Polaris
                thuần — xem comment ở `PLAN_CARD_CSS`. Trong app thật thì chuyển vào
                file CSS của route, đừng để inline. */}
            <style>{PLAN_CARD_CSS}</style>
            <s-grid gap="base" gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))">
              {PLANS.map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  previous={PLANS[index - 1]}
                  current={current}
                  readOnly={readOnly}
                  onChoose={() => setTargetId(plan.id)}
                />
              ))}
            </s-grid>

            {/* 🔴 Lý do disable là TEXT HIỆN SẴN, không phải tooltip.
                Verified 05 Aug 2026: `interestFor` KHÔNG mở trên `s-button
                disabled` — browser không dispatch pointer event lên control
                disabled, keyboard cũng không tab tới được. Bản trước của trang
                này đặt tooltip trên nút disabled, tức merchant bấm vào một nút
                chết mà không có đường nào đọc được vì sao. */}
            {readOnly && (
              <s-text color="subdued">
                Only the store owner and staff with billing access can change plans. Ask them to
                open Billing in this app.
              </s-text>
            )}

            {/* ══ BẢNG SO SÁNH ĐẦY ĐỦ ══
                Thẻ trả lời "plan này có gì"; bảng trả lời "khác nhau chỗ nào". Thẻ
                KHÔNG bao giờ trả lời được câu thứ hai — muốn biết Growth hơn Starter
                chỗ nào, merchant phải đọc hai cột rồi tự trừ trong đầu.

                Thu gọn mặc định (Stella, 06 Aug 2026): 18 dòng × 5 cột là bức tường
                thông tin cho người mới vào chỉ muốn xem giá. Ai cần so kỹ thì tự mở.

                Dùng `s-table` thật (không phải `s-grid`) để screen reader đọc được quan
                hệ hàng-cột: ô "Unlimited" một mình vô nghĩa nếu không gắn với hàng
                *Video widgets* và cột *Starter*. */}
            <s-section heading="Plans comparison">
              <s-stack direction="block" gap="base" alignItems="start">
                <s-button
                  variant="tertiary"
                  icon={tableOpen ? 'chevron-up' : 'chevron-down'}
                  onClick={() => setTableOpen((open) => !open)}
                >
                  {tableOpen ? 'Hide full comparison' : 'Compare all features'}
                  {/* Bù a11y: đóng/mở đang chỉ nằm ở hướng chevron */}
                  <s-text accessibilityVisibility="exclusive">
                    {tableOpen ? ', expanded' : ', collapsed'}
                  </s-text>
                </s-button>

                {tableOpen && (
                  /* ⚠️ KHÔNG dùng `s-table` ở bảng này — dùng `s-grid` + ARIA role.
                     Lý do: yêu cầu là **4 cột plan rộng bằng nhau, cột Feature hẹp lại**,
                     mà `s-table` KHÔNG expose cách đặt độ rộng cột (không có colgroup,
                     `s-table-header` chỉ có `format`/`listslot`) và grid thật của nó nằm
                     trong shadow DOM nên CSS ngoài không với tới. Cột `s-table` tự co
                     theo nội dung → luôn lệch nhau.

                     Giữ ngữ nghĩa bảng bằng role: table › rowgroup › row › columnheader
                     /cell. Screen reader vẫn đọc được quan hệ hàng-cột — ô "Unlimited"
                     một mình vô nghĩa nếu không gắn với hàng *Video widgets* và cột
                     *Starter*.

                     Đổi lại còn được: sọc ngựa vằn giờ CHẮC CHẮN ăn (trước đó phụ thuộc
                     Polaris có để nền host `s-table-row` lọt qua không), và bỏ luôn lỗi
                     a11y `aria-required-children` của vendor mà `s-table` mang theo. */
                  <div className="mk-cmp" role="table" aria-label="Plans comparison">
                    <div role="rowgroup">
                      <div className="mk-cmp__row mk-cmp__row--head" role="row">
                        <div className="mk-cmp__cell mk-cmp__cell--feature" role="columnheader">
                          <s-text type="strong">Feature</s-text>
                        </div>
                        {/* Làm nổi cột "Most popular" CHỈ bằng in đậm — tên cột và mọi
                            giá trị trong cột đó. Badge "Most popular" cố ý KHÔNG lặp lại
                            ở đây: 4 thẻ plan phía trên đã mang ribbon đó rồi. */}
                        {PLANS.map((plan) => (
                          <div key={plan.id} className="mk-cmp__cell" role="columnheader">
                            <s-stack direction="block" gap="small-500" alignItems="center">
                              <s-text type="strong">{plan.name}</s-text>
                              {/* Cột plan đang dùng phải đọc ra được, KHÔNG chỉ bằng màu */}
                              {plan.id === current.id && (
                                <s-text color="subdued">Current plan</s-text>
                              )}
                            </s-stack>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div role="rowgroup">
                      {/* Hàng giá đứng ĐẦU — bảng phải tự đứng được: merchant mở nó ra
                          rồi cuộn xuống là mất tầm nhìn tới 4 thẻ giá phía trên. */}
                      <div className="mk-cmp__row" role="row">
                        <div className="mk-cmp__cell mk-cmp__cell--feature" role="cell">
                          <s-text type="strong">Price</s-text>
                        </div>
                        {PLANS.map((plan) => (
                          <div key={plan.id} className="mk-cmp__cell" role="cell">
                            <FeatureValue
                              value={plan.price === 0 ? 'Free' : `$${plan.price}/month`}
                              emphasis={plan.popular}
                            />
                          </div>
                        ))}
                      </div>

                      {PLAN_FEATURES.map((row, index) => {
                        // Hàng tiêu đề nhóm — cắt 16 dòng phẳng thành 3 khối đọc được.
                        // Nhóm lấy nguyên từ Notion (Shoppable video · AI video creation
                        // · Support), không tự nghĩ ra cách chia khác.
                        const startsGroup =
                          index === 0 || PLAN_FEATURES[index - 1].group !== row.group;
                        return (
                          <Fragment key={row.label}>
                            {startsGroup && (
                              <div className="mk-cmp__row mk-cmp__row--group" role="row">
                                <div
                                  className="mk-cmp__cell mk-cmp__cell--feature"
                                  role="columnheader"
                                  aria-colspan={PLANS.length + 1}
                                >
                                  <s-text type="strong">{row.group}</s-text>
                                </div>
                              </div>
                            )}
                            <div className="mk-cmp__row" role="row">
                              <div className="mk-cmp__cell mk-cmp__cell--feature" role="cell">
                                <s-stack direction="block" gap="small-500">
                                  <s-text>{row.label}</s-text>
                                  {row.detail && <s-text color="subdued">{row.detail}</s-text>}
                                </s-stack>
                              </div>
                              {row.values.map((value, i) => (
                                <div key={PLANS[i].id} className="mk-cmp__cell" role="cell">
                                  <FeatureValue value={value} emphasis={PLANS[i].popular} />
                                </div>
                              ))}
                            </div>
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </s-stack>
            </s-section>

            {/* ══ FAQ ══
                Thay cho section "Not available yet" của bản trước — một danh sách
                "chúng tôi không có gì" đặt ngay dưới bảng giá là tự bắn vào chân.
                Thông tin post-MVP vẫn nói đủ, nhưng nói ở chỗ merchant đi hỏi và
                kèm đường ra, không phải một bảng liệt kê thiếu sót.

                Thu gọn được (Stella, 06 Aug 2026): đổ phẳng 4 câu hỏi + 4 đoạn trả lời
                đẩy phần "xem hoá đơn" ra khỏi màn hình, và bắt merchant đọc 3 câu không
                liên quan để tới câu của mình. Mở sẵn câu ĐẦU vì đó là câu duy nhất
                merchant đang bị chặn cần ngay ("hết credit giữa tháng thì sao"). */}
            <s-section heading="Questions merchants ask">
              <s-stack direction="block" gap="small-200">
                {FAQ.map((item, index) => (
                  <FaqRow
                    key={item.q}
                    question={item.q}
                    answer={item.a}
                    open={openFaq === index}
                    // Accordion một-mở-một: mở câu khác thì câu đang mở tự đóng, bấm
                    // lại chính nó thì đóng hẳn. Mở nhiều câu cùng lúc là quay về
                    // đúng bức tường chữ mà việc thu gọn sinh ra để tránh.
                    onToggle={() => setOpenFaq(openFaq === index ? null : index)}
                  />
                ))}
                <s-divider />
                <s-stack direction="block" gap="small-300" alignItems="start">
                  <s-paragraph color="subdued">
                    MakeUGC charges appear on your Shopify invoice, not a separate bill.
                  </s-paragraph>
                  {/* In real app: deep link Shopify admin → /admin/settings/billing/invoices.
                      MakeUGC không tự dựng trang invoice — charge nằm trên hoá đơn Shopify. */}
                  <s-button disabled={readOnly} href="#" target="_blank" icon="external">
                    View invoices in Shopify admin
                  </s-button>
                  {readOnly && (
                    <s-text color="subdued">
                      Invoices need billing access too.
                    </s-text>
                  )}
                </s-stack>
              </s-stack>
            </s-section>
          </>
        )}
      </s-stack>

      {/* ══ CONFIRM MODAL — MỘT modal cho cả ba chiều ══
          Bản trước tách "downgrade warning" thành một state riêng của review tool,
          nên nó không bao giờ là HỆ QUẢ của việc bấm nút, và nội dung hardcode
          "Starter"/"38 credits" không nối với plan được chọn. Ở đây nội dung sinh
          từ plan thật sự được bấm → review thấy đúng flow. */}
      {target && (
        <ConfirmModal
          target={target}
          current={current}
          used={used}
          onClose={() => setTargetId(null)}
        />
      )}
    </s-page>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

const FAQ = [
  {
    q: 'What happens if I run out of AI videos mid-month?',
    a: `AI Studio stops until your credits reset on ${RESET_DATE}. Nothing else changes: your videos stay live, widgets keep working, and sales tracking keeps counting. We never charge you for going over.`,
  },
  {
    q: 'Can I buy extra credits without changing plan?',
    a: 'Not yet. For now the two options are to wait for your reset date, or move to a plan with a bigger monthly allowance — that takes effect immediately, including the new credits.',
  },
  {
    q: 'Do I lose my videos if I move to a smaller plan?',
    a: 'No. Videos, product tags, widgets and your tracking history are never deleted by a plan change. Only the AI Studio allowance changes.',
  },
  {
    q: 'Is there an annual plan?',
    a: 'Monthly only. Plans are billed through Shopify, so you can change or cancel from this page at any time.',
  },
];

/**
 * Một ô giá trị trong bảng so sánh.
 *
 * ⚠️ `true`/`false` KHÔNG được truyền tải chỉ bằng icon: `s-icon` không nhận
 * `accessibilityLabel` (§7d) và checklist §9 cấm truyền thông tin chỉ bằng màu/hình.
 * Nên mỗi ô boolean đều kèm một `s-text accessibilityVisibility="exclusive"` — mắt thấy
 * ✓ hoặc —, screen reader đọc "Included" / "Not included".
 */
function FeatureValue({value, emphasis = false}: {value: boolean | string; emphasis?: boolean}) {
  return (
    // Căn giữa mọi ô giá trị (`s-table-cell` không nhận [layout] nên phải bọc stack).
    // Cột nhãn feature vẫn căn trái — mắt dò theo mép trái để tìm dòng, rồi quét ngang.
    <s-stack direction="inline" justifyContent="center">
      {typeof value === 'string' ? (
        // Cột "Most popular" in đậm — cách duy nhất làm nổi cột vì `s-table-cell`
        // không nhận `background`.
        emphasis ? <s-text type="strong">{value}</s-text> : <s-text>{value}</s-text>
      ) : value ? (
        <>
          {/* Chấm tròn xanh thay dấu ✓ trần. `s-badge` KHÔNG có `accessibilityLabel`
              (typecheck bác) nên vẫn phải kèm text ẩn — badge chỉ-có-icon mà không có
              text là truyền thông tin chỉ bằng hình. */}
          <s-badge tone="success" icon="check" />
          <s-text accessibilityVisibility="exclusive">Included</s-text>
        </>
      ) : (
        <>
          <s-text color="subdued">—</s-text>
          <s-text accessibilityVisibility="exclusive">Not included</s-text>
        </>
      )}
    </s-stack>
  );
}

/**
 * Một dòng FAQ thu gọn được.
 *
 * ⚠️ Không có `s-collapsible`/`s-accordion` — conditional render.
 *
 * Trigger là `s-button variant="tertiary"`, KHÔNG phải `s-clickable` bọc cả dòng: §7c
 * verified 05 Aug 2026 rằng `s-clickable` luôn tô một dải xám full-width khi hover và
 * không prop nào tắt được.
 *
 * ⚠️ **Khoảng trống a11y phải tự bù:** trạng thái đóng/mở đang chỉ nằm ở hướng mũi tên
 * chevron — screen reader đọc mọi nút y như nhau. Bù bằng `s-text
 * accessibilityVisibility="exclusive"`, đúng cách `TabBar` trong `primitives.tsx` bù cho
 * tab đang chọn. KHÔNG dùng `accessibilityLabel`: nó THAY nhãn chứ không thêm vào, dùng
 * là mất luôn câu hỏi.
 */
function FaqRow({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <s-stack direction="block" gap="small-400">
      <s-stack direction="inline" alignItems="start">
        <s-button
          variant="tertiary"
          icon={open ? 'chevron-up' : 'chevron-down'}
          onClick={onToggle}
        >
          {question}
          <s-text accessibilityVisibility="exclusive">{open ? ', expanded' : ', collapsed'}</s-text>
        </s-button>
      </s-stack>
      {open && (
        <s-box paddingInlineStart="large">
          <s-paragraph color="subdued">{answer}</s-paragraph>
        </s-box>
      )}
    </s-stack>
  );
}

/**
 * ⚠️ NGOẠI LỆ CSS — cái thứ 4 của repo (`mockup-app/CLAUDE.md` §5 vốn chỉ cho 3).
 *
 * Stella yêu cầu plan card giống hệt bản tham chiếu pricing của một app Shopify thật.
 * BỐN thứ trong đó không có đường nào làm bằng Polaris thuần, đã kiểm trong
 * `@shopify/polaris-types` chứ không đoán:
 *
 *   1. Cỡ chữ lớn cho tên plan + giá — `HeadingProps` chỉ có `children`,
 *      `accessibilityRole`, `lineClamp`. KHÔNG có size/variant, và cỡ hiển thị suy từ
 *      độ sâu lồng `s-section` nên không đặt được.
 *   2. Nhấn màu cho giá — `s-text color` chỉ `subdued | base`.
 *   3. Ribbon góc phải — cần `position: absolute`, `[layout]` của Polaris không có.
 *   4. Viền nhấn cho thẻ popular — `borderColor` chỉ `subdued | base | strong` (xám).
 *
 * CSS ngoài KHÔNG xuyên được vào shadow DOM của `s-heading`/`s-text`, nên đặt class
 * lên chúng cũng vô ích — buộc phải dùng element thường cho đúng 3 chỗ này.
 *
 * ✅ **KHÔNG còn phá §2 brand boundary** (Stella chốt 06 Aug 2026: đổi hết màu nhấn
 * sang đen). Toàn bộ hex ở đây là **`#303030` — ink của Polaris**, đúng giá trị
 * `primitives.tsx` đang dùng cho `ProgressBar`. Không có màu brand nào trong admin,
 * nên rủi ro bị trừ điểm native fidelity khi xin Built for Shopify đã hết.
 *
 * Cái còn lại chỉ là **cỡ chữ + vị trí** — thuần layout, không phải chuyện brand. Muốn
 * về Polaris 100% thì xoá khối này + bỏ 4 class trong `PlanCard`; thẻ vẫn chạy, chỉ
 * mất cỡ chữ lớn và ribbon.
 *
 * ⚠️ `#303030` là hex hardcode — cùng món nợ visual đã ghi ở `ProgressBar`: Polaris
 * không expose CSS custom property công khai cho màu, nên mọi thứ tự dựng đều phải
 * hardcode và sẽ trôi lệch nếu Shopify đổi theme (kể cả dark mode). Giữ danh sách này
 * ngắn nhất có thể.
 */
const PLAN_CARD_CSS = `
.mk-plan { position: relative; block-size: 100%; }
.mk-plan__name {
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: #303030;
}
.mk-plan__price {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #303030;
}
.mk-plan__per { font-size: 14px; color: #616161; margin-inline-start: 4px; }
.mk-plan__ribbon {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  background: #303030;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-start-end-radius: 12px;
  border-end-start-radius: 12px;
}
/* Viền nhấn cho thẻ popular. Dùng \`outline\` thay vì \`border\` để khỏi phải chọc vào
   border của \`s-box\` — outline vẽ đè lên, không đổi box model nên 4 thẻ vẫn cùng cỡ. */
.mk-plan--popular > * {
  outline: 2px solid #303030;
  outline-offset: -1px;
  border-radius: 12px;
}

/* ── Bảng Plans comparison ──
   Lý do bảng này KHÔNG dùng \`s-table\`: xem comment ở chỗ render. Tóm tắt — \`s-table\`
   không expose độ rộng cột, cột tự co theo nội dung nên 4 cột plan luôn lệch nhau. */
.mk-cmp {
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  overflow: hidden;
}
/* Yêu cầu của Stella 06 Aug 2026: 4 cột plan BẰNG NHAU, cột Feature hẹp lại.
   \`repeat(4, minmax(0, 1fr))\` cho 4 cột plan bằng nhau tuyệt đối; Feature 1.6fr
   ≈ 28% thay vì ~45% như khi để cột tự co.
   \`minmax(0, …)\` là bắt buộc — thiếu nó thì grid item lấy min-width auto theo nội
   dung và chuỗi dài (vd "Create AI videos · 1000+ AI creators · 50+ languages") sẽ
   nong cột ra thay vì xuống dòng. */
.mk-cmp__row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(4, minmax(0, 1fr));
  align-items: center;
  border-block-start: 1px solid #ebebeb;
}
.mk-cmp [role='rowgroup']:first-child .mk-cmp__row { border-block-start: none; }
/* Hàng header + hàng tiêu đề nhóm: nền xám, tách khỏi hàng dữ liệu */
.mk-cmp__row--head,
.mk-cmp__row--group { background: #f7f7f7; }
/* Sọc ngựa vằn — mắt bám được dòng khi quét ngang qua 5 cột. Giờ CHẮC CHẮN ăn vì hàng
   là div của mình, không còn phụ thuộc shadow DOM của \`s-table\`. */
.mk-cmp [role='rowgroup']:last-child .mk-cmp__row:nth-of-type(even) { background: #fafafa; }
.mk-cmp__cell {
  padding: 12px 16px;
  min-inline-size: 0;
  text-align: center;
}
/* Cột Feature căn trái — mắt dò mép trái để tìm dòng, rồi mới quét ngang */
.mk-cmp__cell--feature { text-align: start; }
/* Hàng tiêu đề nhóm chỉ có 1 ô, cho nó chiếm hết chiều ngang */
.mk-cmp__row--group { grid-template-columns: 1fr; }
`;

/**
 * Plan card — để LOCAL trong route file, cố ý không tách vào `primitives.tsx`.
 * Nó chỉ dùng ở đúng trang này, mà mục tiêu của mockup là dev copy-paste nguyên
 * route sang app thật; tách ra là tạo thêm một dependency phải copy theo.
 *
 * ⚠️ Thứ tự trong card có lý do: **button nằm TRÊN danh sách feature.** 4 plan có
 * số dòng feature khác nhau (Starter đúng 1 dòng), nên nếu button nằm cuối thì 4
 * button lệch nhau theo chiều dọc — đúng lỗi thẻ lệch chiều cao đã bắt ở Home.
 * Đặt button ở vị trí cố định tính từ đỉnh card thì lệch bao nhiêu dòng cũng không
 * ảnh hưởng. Badge nằm INLINE với dòng giá vì lý do y hệt: một hàng badge riêng
 * chỉ có ở 1-2 card sẽ đẩy mọi thứ dưới nó xuống.
 */
function PlanCard({
  plan,
  previous,
  current,
  readOnly,
  onChoose,
}: {
  plan: Plan;
  previous?: Plan;
  current: Plan;
  readOnly: boolean;
  onChoose: () => void;
}) {
  const isCurrent = plan.id === current.id;
  const intent = intentFor(plan, current);

  const actionLabel =
    intent === 'upgrade' ? 'Upgrade' : intent === 'cancel' ? 'Cancel subscription' : 'Downgrade';

  return (
    <div className={`mk-plan${plan.popular ? ' mk-plan--popular' : ''}`}>
      <s-box
        background="base"
        borderRadius="large"
        borderWidth="base"
        borderColor="base"
        padding="base"
        blockSize="100%"
      >
        {/* Ribbon góc phải — cần position absolute, không có prop Polaris nào làm được */}
        {plan.popular && <span className="mk-plan__ribbon">Most popular</span>}

        <s-stack direction="block" gap="base">
          <s-stack direction="block" gap="small-400">
            {/* Tên plan cỡ lớn: `s-heading` KHÔNG có prop size và CSS ngoài không xuyên
                được vào shadow DOM của nó → phải là element thường + class. */}
            <span className="mk-plan__name">{plan.name}</span>

            {/* Blurb chiều cao CỐ ĐỊNH: câu dài 1–2 dòng khác nhau, không giữ chỗ thì
                giá và nút của 4 thẻ lệch nhau — bản tham chiếu cũng giữ chỗ như vậy. */}
            <s-box minBlockSize="44px">
              <s-text color="subdued">{plan.blurb}</s-text>
            </s-box>
          </s-stack>

          <s-stack direction="block" gap="small-500">
            <span>
              <span className="mk-plan__price">{plan.price === 0 ? '$0' : `$${plan.price}`}</span>
              <span className="mk-plan__per">/month</span>
            </span>
            <s-text color="subdued">
              {plan.credits === 0
                ? 'No AI videos included'
                : `${plan.credits.toLocaleString('en-US')} AI videos included`}
            </s-text>
          </s-stack>

          {/* CTA full-width. CHỈ thẻ popular dùng `primary` (nền đen); còn lại
              `secondary` (viền) — đúng cách bản tham chiếu phân cấp. Để đen cả 4 thì
              không nút nào nổi, và "Cancel subscription" đen ngang nút mua là sai
              trọng số. */}
          {isCurrent ? (
            <s-button disabled inlineSize="fill">
              Current plan
            </s-button>
          ) : (
            <s-button
              variant={plan.popular ? 'primary' : 'secondary'}
              inlineSize="fill"
              disabled={readOnly}
              onClick={onChoose}
            >
              {actionLabel}
            </s-button>
          )}

          <s-divider />

          <s-stack direction="block" gap="small-300">
            <s-text color="subdued">
              {previous ? `Everything in ${previous.name}, plus:` : 'What you get:'}
            </s-text>
            {/* ✓ + text bằng `s-grid` 2 cột, KHÔNG phải `s-stack direction="inline"`.
                §7e: `s-stack` không có prop `wrap` nên dòng dài hơn một dòng thì icon bị
                đẩy lên dòng riêng, để lại dấu ✓ trôi nổi. Grid ghim icon ở cột 1, chữ
                wrap trong cột 2. */}
            <s-grid gridTemplateColumns="max-content minmax(0, 1fr)" gap="small-300">
              {plan.adds.map((item) => (
                <Fragment key={item}>
                  <s-icon type="check" tone="success" size="small" />
                  <s-text>{item}</s-text>
                </Fragment>
              ))}
            </s-grid>
          </s-stack>
        </s-stack>
      </s-box>
    </div>
  );
}

/**
 * Confirm — destructive phải có SỐ LƯỢNG cụ thể + hậu quả (checklist §4).
 * "Downgrade?" chung chung là không đủ: merchant cần biết mất bao nhiêu video AI
 * mỗi tháng, và chuyện gì xảy ra với credit đã tiêu trong cycle này.
 */
function ConfirmModal({
  target,
  current,
  used,
  onClose,
}: {
  target: Plan;
  current: Plan;
  used: number;
  onClose: () => void;
}) {
  const intent = intentFor(target, current);

  /**
   * `s-modal` KHÔNG có prop `open` (typecheck bắt được) — mở bằng
   * `showOverlay()` / `hideOverlay()`, hoặc invoker command
   * (`command="--show" commandFor="id"`). Khác hẳn React Polaris `<Modal open>`.
   *
   * Ref sống TRONG component này chứ không ở route: component chỉ mount khi đã có
   * plan được bấm, nên "mở modal" = "vừa mount" — không cần đồng bộ ref qua prop,
   * và tránh luôn lệch type giữa `RefObject<T | null>` và `Ref<T>` mà `s-modal` nhận.
   */
  const modalRef = useRef<HTMLElementTagNameMap['s-modal']>(null);

  useEffect(() => {
    modalRef.current?.showOverlay();
  }, []);

  const heading =
    intent === 'upgrade'
      ? `Upgrade to ${target.name}?`
      : intent === 'cancel'
        ? 'Cancel your subscription?'
        : `Move down to ${target.name}?`;

  /** Credit đã tiêu vượt allowance của plan mới → AI Studio dừng ngay sau khi đổi */
  const overNewLimit = used > target.credits;

  return (
    <s-modal
      ref={modalRef}
      id="plan-confirm"
      heading={heading}
      /* `heading` KHÔNG đủ — thiếu `accessibilityLabel` thì Polaris warn ra console
         khi modal có scroll-box. Đó là lỗi của mình, không phải của vendor. */
      accessibilityLabel={heading}
      onAfterHide={onClose}
    >
      <s-stack direction="block" gap="small">
        {intent === 'upgrade' ? (
          <>
            <s-paragraph>
              You&apos;ll be charged ${target.price} per month and get{' '}
              {target.credits.toLocaleString('en-US')} AI videos per cycle — up from{' '}
              {current.credits === 0 ? 'none' : current.credits.toLocaleString('en-US')} on{' '}
              {current.name}.
            </s-paragraph>
            <s-paragraph color="subdued">
              Shopify will ask you to approve the charge. The change takes effect immediately and
              your new credits are available right away.
            </s-paragraph>
          </>
        ) : (
          <>
            <s-unordered-list>
              <s-list-item>
                AI videos drop from{' '}
                {current.credits === 0 ? 'none' : current.credits.toLocaleString('en-US')} to{' '}
                {target.credits === 0 ? 'none' : target.credits.toLocaleString('en-US')} per month
              </s-list-item>
              {overNewLimit && (
                <s-list-item>
                  You&apos;ve already used {used} credits this cycle, so AI Studio pauses as soon as
                  the change takes effect and stays paused until {RESET_DATE}
                </s-list-item>
              )}
              <s-list-item>
                Your {TOTAL_VIDEOS.toLocaleString('en-US')} videos, their product tags, your widgets
                and all tracking history are not affected
              </s-list-item>
            </s-unordered-list>
            <s-paragraph color="subdued">
              The change takes effect at the end of your current cycle on {RESET_DATE}. You keep{' '}
              {current.name} until then.
            </s-paragraph>
          </>
        )}
        {/* In real app: Shopify Billing API → appSubscriptionCreate / appSubscriptionCancel,
            merchant approve trên trang confirm của Shopify rồi quay lại app.
            In real app: shopify.toast.show('Plan updated') sau khi quay lại. */}
      </s-stack>

      <s-button
        slot="primary-action"
        variant="primary"
        tone={intent === 'upgrade' ? 'auto' : 'critical'}
        onClick={onClose}
      >
        {intent === 'upgrade'
          ? `Approve $${target.price}/month`
          : intent === 'cancel'
            ? 'Cancel subscription'
            : `Move to ${target.name}`}
      </s-button>
      <s-button slot="secondary-actions" onClick={onClose}>
        Keep {current.name}
      </s-button>
    </s-modal>
  );
}
