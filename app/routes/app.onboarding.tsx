/**
 * MOCKUP — Onboarding (setup guide)
 *
 * Mục tiêu roadmap Phase 1: install → **first video live dưới 10 phút**.
 * Activation rate là metric chính của phase này, nên trang này là trang quan trọng
 * nhất của app về mặt số liệu — không phải Home.
 *
 * ⚠️ CỐ Ý KHÔNG PHẢI WIZARD CHẶN APP. ENTERPRISE-UX-CHECKLIST §7 ghi rõ anti-pattern:
 * modal onboarding chặn cả app, tour tooltip bắt click hết, dismiss xong mất luôn.
 * Đây là full-page setup guide: merchant vào ra tuỳ ý, dismiss được và mở lại được.
 *
 * ⚠️ KHÔNG có `s-collapsible` → expand/collapse bằng conditional render.
 *
 * 3 bước (chốt với Stella 05 Aug 2026): import → tag product → add player vào theme.
 * KHÔNG có bước chọn plan: bắt chọn plan trước khi thấy giá trị làm tụt activation,
 * Free Forever là mặc định.
 *
 * Route file thật: app/routes/app.onboarding.tsx
 */
import {useState} from 'react';

import StateSwitcher from '../components/StateSwitcher';
import JobProgress from '../components/JobProgress';
import {ProgressBar} from '../components/primitives';
import {importSource, onboardingSteps, storeTheme, thumb, videos} from '../data/sample';

const STATES = [
  {value: 'default', label: 'Default — 1 of 3, đang ở bước tag product'},
  {value: 'fresh', label: 'Fresh install — 0 of 3, chưa làm gì'},
  {value: 'import-queued', label: 'Import queued — chờ slot'},
  {value: 'importing', label: 'Import processing — có ETA + Cancel'},
  {value: 'import-failed', label: 'Import failed — account private'},
  {value: 'untagged', label: 'Untagged — video đã live nhưng chưa tag product'},
  {value: 'theme-pending', label: 'Theme block chưa detect được trên storefront'},
  {value: 'theme-unsupported', label: 'Theme vintage — không hỗ trợ app block'},
  {value: 'all-done', label: 'All done — 3 of 3, hiện next steps'},
  {value: 'dismissed', label: 'Đã dismiss — cách mở lại'},
  {value: 'no-permission', label: 'No permission — staff không sửa được theme'},
  {value: 'loading', label: 'Loading — đang kiểm tra trạng thái setup'},
  {value: 'error', label: 'Error — không kiểm tra được storefront'},
];

/** Bước nào đã xong ở mỗi state. Nguồn duy nhất để suy ra progress/ETA/step đang mở. */
const DONE_BY_STATE: Record<string, string[]> = {
  fresh: [],
  'import-queued': [],
  importing: [],
  'import-failed': [],
  default: ['import'],
  untagged: ['import'],
  loading: ['import'],
  error: ['import'],
  dismissed: ['import'],
  'theme-pending': ['import', 'tag'],
  'theme-unsupported': ['import', 'tag'],
  'no-permission': ['import', 'tag'],
  'all-done': ['import', 'tag', 'publish'],
};

export default function Onboarding() {
  const [state, setState] = useState('default');
  // null = chưa tự mở bước nào → mở bước đang tới. '' = đã đóng hết bằng tay.
  const [openId, setOpenId] = useState<string | null>(null);

  const is = (...names: string[]) => names.includes(state);
  const doneIds = DONE_BY_STATE[state] ?? [];

  const steps = onboardingSteps.map((step) => ({...step, done: doneIds.includes(step.id)}));
  const doneCount = doneIds.length;
  const activeStep = steps.find((step) => !step.done);
  const remainingMinutes = steps
    .filter((step) => !step.done)
    .reduce((total, step) => total + step.minutes, 0);

  const expandedId = openId ?? activeStep?.id ?? '';
  const toggle = (id: string) => setOpenId(expandedId === id ? '' : id);

  const readOnly = is('no-permission');
  const theme = is('theme-unsupported') ? storeTheme.unsupported : storeTheme.supported;
  const firstVideo = videos[0];

  return (
    <s-page heading="Set up MakeUGC">
      {/* breadcrumb-actions chỉ nhận link component, không nhận button */}
      <s-link slot="breadcrumb-actions" href="/app">
        Home
      </s-link>
      <s-button slot="secondary-actions" href="#" target="_blank" icon="question-circle">
        Setup help
      </s-button>

      <s-stack direction="block" gap="base">
        <StateSwitcher state={state} onChange={setState} states={STATES} />

        {/* ══ BANNERS ══ */}
        {is('error') && (
          <s-banner tone="critical" heading="We couldn't check your storefront">
            {/* Lý do cụ thể + trấn an cái gì KHÔNG bị ảnh hưởng */}
            <s-paragraph>
              Your videos and settings are safe — we just couldn&apos;t reach your storefront to
              confirm the player is showing. This is usually temporary.
            </s-paragraph>
            <s-button slot="secondary-actions" icon="refresh">
              Check again
            </s-button>
            <s-button slot="secondary-actions" href="#" target="_blank">
              Contact support
            </s-button>
          </s-banner>
        )}

        {is('dismissed') && (
          <s-banner tone="info" heading="Setup guide hidden">
            {/* Dismiss được nhưng KHÔNG mất — §7 anti-pattern: dismiss xong tìm không ra */}
            <s-paragraph>
              You can reopen it any time from Home → Finish setup. Your progress is kept.
            </s-paragraph>
            <s-button slot="secondary-actions" onClick={() => setState('default')}>
              Show setup guide
            </s-button>
          </s-banner>
        )}

        {readOnly && (
          <s-banner tone="warning" heading="You can't finish this setup on your own">
            <s-paragraph>
              Step 3 edits your theme, which needs the <s-text type="strong">Themes</s-text> staff
              permission. You can do steps 1 and 2 now and ask your store owner for the last one.
            </s-paragraph>
          </s-banner>
        )}

        {is('untagged') && (
          <s-banner tone="warning" heading="Your video is live with nothing to buy">
            {/* Lỗi im lặng tệ nhất của app này: video chạy, có view, không mua được gì */}
            <s-paragraph>
              &quot;{firstVideo.title}&quot; is showing to shoppers but has no products tagged, so
              there is nothing for them to add to cart. Tag a product to fix it.
            </s-paragraph>
          </s-banner>
        )}

        {/* ══ PROGRESS HEADER ══ */}
        <s-section padding="base">
          <s-stack direction="block" gap="small">
            <s-stack
              direction="inline"
              gap="small"
              alignItems="start"
              justifyContent="space-between"
            >
              <s-stack direction="block" gap="small-500">
                <s-heading>
                  {doneCount === steps.length
                    ? 'Your first video is live'
                    : 'Get your first shoppable video live'}
                </s-heading>
                <s-paragraph color="subdued">
                  {doneCount === steps.length
                    ? 'Setup is done. Everything below stays here if you want to change it.'
                    : 'Most stores finish in under 10 minutes. You can leave and come back — nothing is lost.'}
                </s-paragraph>
              </s-stack>
              {/* Dismiss: cho phép, nhưng banner state 'dismissed' cho thấy mở lại được */}
              {doneCount < steps.length && (
                <s-button variant="tertiary" onClick={() => setState('dismissed')}>
                  Hide guide
                </s-button>
              )}
            </s-stack>

            {is('loading') ? (
              // KHÔNG có skeleton component → s-spinner
              <s-stack direction="inline" gap="small-200" alignItems="center">
                <s-spinner size="base" accessibilityLabel="Checking your setup" />
                <s-text color="subdued">Checking what&apos;s already done</s-text>
              </s-stack>
            ) : (
              <s-stack direction="block" gap="small-300">
                <ProgressBar
                  progress={(doneCount / steps.length) * 100}
                  label={`${doneCount} of ${steps.length} steps done`}
                />
                <s-stack direction="inline" gap="small-100" justifyContent="space-between">
                  <s-text type="strong">
                    {doneCount} of {steps.length} done
                  </s-text>
                  {remainingMinutes > 0 && (
                    <s-stack direction="inline" gap="small-500" alignItems="center">
                      <s-icon type="clock" tone="neutral" size="small" />
                      <s-text color="subdued">About {remainingMinutes} minutes left</s-text>
                    </s-stack>
                  )}
                </s-stack>
              </s-stack>
            )}
          </s-stack>
        </s-section>

        {/* ══ STEPS ══ */}
        {steps.map((step, index) => {
          const expanded = expandedId === step.id;
          const isActive = activeStep?.id === step.id;
          // Bước sau bước đang tới thì chưa làm được — nhưng vẫn MỞ XEM ĐƯỢC.
          // Ẩn nội dung đi làm merchant không biết mình đang tiến tới cái gì.
          const locked = !step.done && !isActive;

          return (
            <s-section key={step.id} padding="base">
              <s-stack direction="block" gap="small">
                <s-clickable
                  onClick={() => toggle(step.id)}
                  accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} step ${index + 1}: ${step.label}`}
                >
                  <s-stack
                    direction="inline"
                    gap="small"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <s-stack direction="inline" gap="small-100" alignItems="center">
                      {/* Trạng thái có ICON + TEXT, không chỉ màu — a11y */}
                      <s-icon
                        type={step.done ? 'check-circle' : locked ? 'circle' : 'incomplete'}
                        tone={step.done ? 'success' : 'neutral'}
                      />
                      <s-stack direction="block" gap="small-500">
                        <s-text color="subdued">
                          Step {index + 1} of {steps.length} · about {step.minutes} min
                        </s-text>
                        <s-text type="strong">{step.label}</s-text>
                      </s-stack>
                    </s-stack>

                    <s-stack direction="inline" gap="small-200" alignItems="center">
                      {step.done && <s-badge tone="success">Done</s-badge>}
                      {isActive && <s-badge tone="info">Next up</s-badge>}
                      <s-icon type={expanded ? 'chevron-up' : 'chevron-down'} tone="neutral" />
                    </s-stack>
                  </s-stack>
                </s-clickable>

                {expanded && (
                  <s-stack direction="block" gap="small">
                    <s-divider />
                    <s-paragraph color="subdued">{step.why}</s-paragraph>

                    {step.id === 'import' && (
                      <ImportStep state={state} done={step.done} />
                    )}
                    {step.id === 'tag' && (
                      <TagStep state={state} done={step.done} locked={locked} />
                    )}
                    {step.id === 'publish' && (
                      <PublishStep
                        state={state}
                        done={step.done}
                        locked={locked}
                        readOnly={readOnly}
                        themeName={theme.name}
                        unsupported={is('theme-unsupported')}
                      />
                    )}
                  </s-stack>
                )}
              </s-stack>
            </s-section>
          );
        })}

        {/* ══ DONE — next steps ══ */}
        {is('all-done') && <DoneSection />}
      </s-stack>

      {/* ══ ASIDE ══ */}
      <s-stack slot="aside" direction="block" gap="base">
        <s-section heading="Your store">
          <s-stack direction="block" gap="small-200">
            <s-stack direction="inline" gap="small-200" alignItems="center" justifyContent="space-between">
              <s-text color="subdued">Theme</s-text>
              <s-text type="strong">{theme.name}</s-text>
            </s-stack>
            <s-stack direction="inline" gap="small-200" alignItems="center" justifyContent="space-between">
              <s-text color="subdued">Theme version</s-text>
              {is('theme-unsupported') ? (
                <s-badge tone="warning">{theme.version}</s-badge>
              ) : (
                <s-badge tone="neutral">{theme.version}</s-badge>
              )}
            </s-stack>
            <s-stack direction="inline" gap="small-200" alignItems="center" justifyContent="space-between">
              <s-text color="subdued">Plan</s-text>
              <s-badge tone="info">Growth</s-badge>
            </s-stack>
            <s-divider />
            <s-paragraph color="subdued">
              Setup doesn&apos;t use any AI credits. Importing and tagging videos is free on every
              plan.
            </s-paragraph>
          </s-stack>
        </s-section>

        <s-section heading="Need a hand?">
          <s-stack direction="block" gap="small-200">
            <s-link href="#" target="_blank">
              How the player works in your theme
            </s-link>
            <s-link href="#" target="_blank">
              Tagging products in a video
            </s-link>
            <s-divider />
            {/* PLAN-GATED — khác hẳn quota-blocked: đường thoát là upgrade, không phải chờ reset */}
            <s-button disabled interestFor="setup-call-tip" icon="clock">
              Book a setup call
            </s-button>
            <s-tooltip id="setup-call-tip">
              Guided onboarding calls are included on the Scale plan. You&apos;re on Growth.
            </s-tooltip>
            <s-link href="/app/billing">See what Scale includes</s-link>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}

/**
 * Bước 1 — import.
 *
 * Import từ TikTok/Instagram là JOB ASYNC: 4 state, có ETA + Cancel, survive reload.
 * Chốt với Stella 05 Aug 2026. Spinner không ETA là anti-pattern §1.
 */
function ImportStep({state, done}: {state: string; done: boolean}) {
  const is = (...names: string[]) => names.includes(state);

  if (is('import-queued')) {
    return <JobProgress status="queued" title={`Importing from ${importSource.handle}`} />;
  }

  if (is('importing')) {
    return (
      <JobProgress
        status="processing"
        title={`Importing ${importSource.batchSize} videos from ${importSource.handle}`}
        done={2}
        total={importSource.batchSize}
        etaLabel="~40 seconds left"
        onCancel={() => {}}
      />
    );
  }

  if (is('import-failed')) {
    return (
      <JobProgress
        status="failed"
        title={`Importing from ${importSource.handle}`}
        total={importSource.batchSize}
        // Lý do CỤ THỂ + cách sửa. "Something went wrong" là vô dụng cho merchant.
        errorMessage={`${importSource.handle} is set to private, so we can't read its videos. Make the account public, or upload a video file instead.`}
        creditNote="No credits were used — importing is free"
        onRetry={() => {}}
      />
    );
  }

  if (done) {
    return (
      <s-stack direction="block" gap="small">
        <s-stack direction="inline" gap="small-200" alignItems="center">
          {/* alt đúng nghĩa, không phải "thumbnail" */}
          <s-thumbnail src={thumb('v-1', 80)} alt={videos[0].title} size="small" />
          <s-stack direction="block" gap="small-500">
            <s-text type="strong">{videos[0].title}</s-text>
            <s-text color="subdued">
              {importSource.network} · {videos[0].duration}
            </s-text>
          </s-stack>
        </s-stack>
        <s-stack direction="inline" gap="small-200">
          <s-button href="/app/library" icon="import">
            Import more videos
          </s-button>
        </s-stack>
      </s-stack>
    );
  }

  return (
    <s-stack direction="block" gap="small">
      {/* Bước dễ nhất phải đứng đầu → 3 lựa chọn, không form dài */}
      <s-grid gap="small-100" gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))">
        {[
          {id: 'tiktok', label: 'Connect TikTok', icon: 'play-circle' as const},
          {id: 'instagram', label: 'Connect Instagram', icon: 'image' as const},
          {id: 'upload', label: 'Upload a file', icon: 'upload' as const},
        ].map((option) => (
          <s-clickable
            key={option.id}
            border="base"
            borderRadius="base"
            padding="small"
            accessibilityLabel={option.label}
          >
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <s-icon type={option.icon} tone="neutral" />
              <s-text type="strong">{option.label}</s-text>
            </s-stack>
          </s-clickable>
        ))}
      </s-grid>
      {/* Overload ngay từ bước đầu: account thật có hàng trăm video, đừng kéo hết về */}
      <s-paragraph color="subdued">
        Connecting an account imports your {importSource.batchSize} most recent videos so you can
        start. Accounts like {importSource.handle} have {importSource.videosFound} videos — you
        choose the rest later, there is no import limit.
      </s-paragraph>
    </s-stack>
  );
}

/** Bước 2 — tag product. */
function TagStep({state, done, locked}: {state: string; done: boolean; locked: boolean}) {
  if (done) {
    return (
      <s-stack direction="inline" gap="small-200" alignItems="center">
        <s-icon type="check-circle" tone="success" size="small" />
        <s-text>2 products tagged in &quot;{videos[0].title}&quot;</s-text>
        <s-link href="/app/library/v-1">Edit tags</s-link>
      </s-stack>
    );
  }

  return (
    <s-stack direction="block" gap="small">
      <s-stack direction="inline" gap="small-200" alignItems="center">
        <s-thumbnail src={thumb('v-1', 80)} alt={videos[0].title} size="small" />
        <s-stack direction="block" gap="small-500">
          <s-text type="strong">{videos[0].title}</s-text>
          <s-text color="subdued">
            {state === 'untagged' ? 'Live · no products tagged' : 'Imported · not published yet'}
          </s-text>
        </s-stack>
      </s-stack>

      <s-stack direction="inline" gap="small-200" alignItems="center">
        {locked ? (
          <>
            {/* Disable thì LUÔN nói lý do — không ẩn, không fail im lặng */}
            <s-button variant="primary" disabled interestFor="tag-locked-tip" icon="product">
              Tag products
            </s-button>
            <s-tooltip id="tag-locked-tip">
              Import a video first — there is nothing to tag yet.
            </s-tooltip>
          </>
        ) : (
          // In real app: shopify.resourcePicker({type: 'product', multiple: true})
          <s-button variant="primary" icon="product" href="/app/library/v-1">
            Tag products
          </s-button>
        )}
        <s-button variant="tertiary" interestFor="tag-skip-tip">
          Skip for now
        </s-button>
        <s-tooltip id="tag-skip-tip">
          You can publish without tags, but shoppers won&apos;t be able to buy from the video.
        </s-tooltip>
      </s-stack>
    </s-stack>
  );
}

/**
 * Bước 3 — thêm player vào theme.
 *
 * Đây là bước duy nhất merchant phải RỜI APP (sang theme editor) → tỷ lệ rơi cao nhất.
 * Hai thứ bắt buộc: deep link thẳng tới đúng block, và tự kiểm tra đã thêm chưa.
 */
function PublishStep({
  state,
  done,
  locked,
  readOnly,
  themeName,
  unsupported,
}: {
  state: string;
  done: boolean;
  locked: boolean;
  readOnly: boolean;
  themeName: string;
  unsupported: boolean;
}) {
  if (done) {
    return (
      <s-stack direction="block" gap="small-200">
        <s-stack direction="inline" gap="small-200" alignItems="center">
          <s-icon type="check-circle" tone="success" size="small" />
          <s-text>Video carousel is live on your Product page</s-text>
        </s-stack>
        <s-stack direction="inline" gap="small-200">
          <s-button href="/app/widgets" icon="layout-block">
            Manage placement
          </s-button>
          <s-button href="#" target="_blank" icon="external">
            View on your store
          </s-button>
        </s-stack>
      </s-stack>
    );
  }

  if (unsupported) {
    return (
      <s-stack direction="block" gap="small">
        {/* Theme vintage không có app block — bế tắc thật, phải có đường khác */}
        <s-banner tone="warning" heading={`${themeName} doesn't support app blocks`}>
          <s-paragraph>
            Your theme was built before Online Store 2.0, so the player can&apos;t be added from the
            theme editor. We can install it manually for you, or you can switch to a 2.0 theme.
          </s-paragraph>
          <s-button slot="secondary-actions">Request manual install</s-button>
          <s-button slot="secondary-actions" href="#" target="_blank">
            About Online Store 2.0
          </s-button>
        </s-banner>
      </s-stack>
    );
  }

  return (
    <s-stack direction="block" gap="small">
      {/* Tên surface đúng chuẩn Shopify — gọi sai làm merchant tìm sai chỗ trong theme editor */}
      <s-paragraph color="subdued">
        We&apos;ll open <s-text type="strong">{themeName}</s-text> in the theme editor with the video
        carousel ready to drop onto your <s-text type="strong">Product page</s-text>. Save there,
        then come back.
      </s-paragraph>

      <s-stack direction="inline" gap="small-200" alignItems="center">
        {locked || readOnly ? (
          <>
            <s-button variant="primary" disabled interestFor="publish-locked-tip" icon="theme-edit">
              Open theme editor
            </s-button>
            <s-tooltip id="publish-locked-tip">
              {readOnly
                ? 'Editing your theme needs the Themes staff permission. Ask your store owner.'
                : 'Tag a product first, so the player has something to sell.'}
            </s-tooltip>
          </>
        ) : (
          // In real app: deep link chính thức của Shopify, KHÔNG bắt merchant tự tìm block:
          // https://{shop}/admin/themes/current/editor
          //   ?template=product&addAppBlockId={EXTENSION_UUID}/video-carousel&target=mainSection
          <s-button variant="primary" icon="theme-edit" href="#" target="_blank">
            Open theme editor
          </s-button>
        )}
        <s-button icon="refresh">Check again</s-button>
      </s-stack>

      {/* Tự kiểm tra thay vì hỏi "bạn đã thêm chưa?" — merchant không phải người xác nhận */}
      <s-stack direction="inline" gap="small-200" alignItems="center">
        <s-icon
          type={state === 'theme-pending' ? 'alert-triangle' : 'circle'}
          tone={state === 'theme-pending' ? 'caution' : 'neutral'}
          size="small"
        />
        <s-text color="subdued">
          {state === 'theme-pending'
            ? "We opened the editor but can't see the player on your storefront yet — did you hit Save? Last checked 2 minutes ago."
            : 'We check your storefront automatically and tick this off when the player appears.'}
        </s-text>
      </s-stack>
    </s-stack>
  );
}

/** Xong cả 3 bước — chỉ đường tiếp, không để merchant đứng im ở màn hình "Done". */
function DoneSection() {
  return (
    <s-section padding="base">
      <s-stack direction="block" gap="small">
        <s-stack direction="inline" gap="small-200" alignItems="center">
          <s-icon type="confetti" tone="success" />
          <s-heading>What to do next</s-heading>
        </s-stack>
        {/* In real app: shopify.toast.show('Your first video is live') khi bước 3 chuyển done */}
        <s-paragraph color="subdued">
          Sales attributed to this video show up on Home within a few hours of the first order.
        </s-paragraph>

        <s-grid gap="small-100" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))">
          {[
            {
              href: '/app/library',
              icon: 'import' as const,
              title: 'Import more videos',
              body: 'The more tagged videos live, the more shoppers see.',
            },
            {
              href: '/app/ai-studio',
              icon: 'wand' as const,
              title: 'Generate an AI video',
              body: 'Uses AI credits. You have 50 this month on Growth.',
            },
            {
              href: '/app/analytics',
              icon: 'chart-line' as const,
              title: 'See what videos earn',
              body: 'Revenue per video, once orders start coming in.',
            },
          ].map((card) => (
            <s-clickable
              key={card.href}
              href={card.href}
              border="base"
              borderRadius="base"
              padding="small"
              accessibilityLabel={card.title}
            >
              <s-stack direction="block" gap="small-300">
                <s-icon type={card.icon} tone="neutral" />
                <s-text type="strong">{card.title}</s-text>
                <s-text color="subdued">{card.body}</s-text>
              </s-stack>
            </s-clickable>
          ))}
        </s-grid>
      </s-stack>
    </s-section>
  );
}
