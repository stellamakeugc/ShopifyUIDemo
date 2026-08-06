import {ProgressBar} from './primitives';

/**
 * Credit meter cho AI Studio.
 *
 * Billing MakeUGC là HARD-STOP, không overage (roadmap Phase 0) → hệ thống PHẢI
 * chặn. Chặn mà không giải thích trước = support ticket, và support tickets/100
 * installs là guardrail metric của roadmap.
 *
 * Nói về credit ở CẢ BA thời điểm:
 *   1. idle    — balance + cost của action sắp tới
 *   2. low     — warning chủ động ở ≤20%, không chờ hết mới nói
 *   3. blocked — hết: lý do + NGÀY RESET + đường upgrade
 *
 * planGated ≠ quotaBlocked: hai đường thoát khác nhau (upgrade vs chờ reset).
 * Gộp chung là dẫn merchant đi sai.
 */
export default function CreditMeter({
  used,
  total,
  resetDate,
  planName,
  nextPlan,
  pendingCost,
  planGated = false,
  compact = false,
}: {
  used: number;
  total: number;
  resetDate: string;
  planName: string;
  nextPlan?: {name: string; credits: number};
  pendingCost?: number;
  planGated?: boolean;
  /**
   * Chỉ hiện meter + số, BỎ banner low/blocked và nút "Generate video".
   *
   * Dùng trên **chính trang AI Studio**: ở đó nút trỏ về trang đang mở (và cạnh tranh
   * với primary action của page header), còn banner hết-credit thì trang tự hiện ở
   * action zone trên đầu — chỗ đúng cho việc chặn hành động chính. Để cả hai là hai
   * banner nói cùng một câu, đúng lỗi đang có ở app thật.
   */
  compact?: boolean;
}) {
  if (planGated) {
    return (
      <s-section heading="AI Studio">
        <s-banner tone="info" heading="AI Studio is available on Growth and above">
          <s-paragraph>
            Generate videos with 1,000+ AI creators in 50+ languages. Your {planName} plan
            doesn&apos;t include AI credits.
          </s-paragraph>
          <s-button slot="secondary-actions" href="/app/billing">
            Compare plans
          </s-button>
        </s-banner>
      </s-section>
    );
  }

  const remaining = Math.max(0, total - used);
  const usedPercent = total > 0 ? Math.round((used / total) * 100) : 0;
  const isBlocked = remaining <= 0;
  const isLow = !isBlocked && total > 0 && remaining / total <= 0.2;
  const cannotAfford = pendingCost != null && pendingCost > remaining;

  return (
    <s-section heading="AI credits">
      <s-stack direction="block" gap="base">
        <s-stack direction="block" gap="small-200">
          <s-stack direction="inline" gap="small-100" justifyContent="space-between" alignItems="end">
            <s-heading>{remaining} left</s-heading>
            <s-text color="subdued">
              {used} of {total} used
            </s-text>
          </s-stack>

          <ProgressBar
            progress={usedPercent}
            tone={isBlocked ? 'critical' : isLow ? 'warning' : 'primary'}
            label={`${usedPercent}% of AI credits used`}
          />

          <s-stack direction="inline" gap="small-200" justifyContent="space-between">
            <s-text color="subdued">Resets on {resetDate}</s-text>
            <s-text color="subdued">{planName} plan</s-text>
          </s-stack>
        </s-stack>

        {/* Cost preview — merchant PHẢI biết giá TRƯỚC khi bấm, không phải sau */}
        {pendingCost != null && !isBlocked && (
          <s-box background={cannotAfford ? 'strong' : 'subdued'} borderRadius="base" padding="small">
            <s-paragraph tone={cannotAfford ? 'critical' : 'neutral'}>
              {cannotAfford
                ? `This needs ${pendingCost} credits but you only have ${remaining} left.`
                : `This will use ${pendingCost} of your ${remaining} remaining credits.`}
            </s-paragraph>
          </s-box>
        )}

        {isBlocked && !compact && (
          <s-banner tone="critical" heading={`You've used all ${total} AI credits`}>
            <s-paragraph>
              Credits reset on {resetDate}.
              {nextPlan ? ` Upgrade to ${nextPlan.name} for ${nextPlan.credits} credits per month.` : ''}
            </s-paragraph>
            <s-button slot="secondary-actions" href="/app/billing">
              {nextPlan ? `Upgrade to ${nextPlan.name}` : 'View plans'}
            </s-button>
          </s-banner>
        )}

        {isLow && !compact && (
          <s-banner tone="warning" heading={`${remaining} credits left`}>
            <s-paragraph>
              Credits reset on {resetDate}. Generation stops when you run out.
            </s-paragraph>
            <s-button slot="secondary-actions" href="/app/billing">
              Upgrade plan
            </s-button>
          </s-banner>
        )}

        {/* Disable LUÔN kèm giải thích, nhưng bằng TEXT HIỆN SẴN — verified 05 Aug 2026:
            `interestFor` KHÔNG mở tooltip trên control disabled (browser không dispatch
            pointer event lên đó). Xem MAKEUGC-UI-PATTERNS §7a.
            Khi isBlocked thì banner critical phía trên đã nói ngày reset + đường upgrade,
            nên lý do vẫn đọc được. */}
        {!compact &&
          (isBlocked ? (
            <s-stack direction="block" gap="small-400" alignItems="start">
              <s-button variant="primary" disabled>
                Generate video
              </s-button>
              <s-text color="subdued">
                0 credits left — resets on {resetDate}.
              </s-text>
            </s-stack>
          ) : (
            <s-button variant="primary" href="/app/ai-studio" disabled={cannotAfford}>
              Generate video
            </s-button>
          ))}
      </s-stack>
    </s-section>
  );
}
