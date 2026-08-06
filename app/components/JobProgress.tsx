import {ProgressBar} from './primitives';

/**
 * Async long-job card — AI video generation, bulk import, bulk operation.
 *
 * Polaris (cả React lẫn web components) KHÔNG có component cho long-running job,
 * và web components còn không có `s-progress-bar` → ProgressBar tự dựng.
 *
 * 4 state, không được nhập nhằng:
 *   queued     — chưa biết %, KHÔNG vẽ progress bar giả
 *   processing — progress + ETA + Cancel
 *   done       — kết quả (kể cả kết quả TỪNG PHẦN) + CTA bước tiếp
 *   failed     — LÝ DO CỤ THỂ + Retry + nói rõ credit bị trừ hay đã hoàn
 *
 * Nguyên tắc quan trọng nhất: job phải SURVIVE RELOAD. Component render từ state
 * truyền vào (in real app: đọc từ API + poll), không phải từ "vừa mới click".
 */
export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export default function JobProgress({
  status,
  title,
  done = 0,
  total = 0,
  etaLabel,
  failedCount = 0,
  errorMessage,
  creditNote,
  onCancel,
  onRetry,
  resultHref,
  pastVerb = 'generated',
  failureHeading = 'Generation failed',
}: {
  status: JobStatus;
  title: string;
  done?: number;
  total?: number;
  etaLabel?: string;
  failedCount?: number;
  errorMessage?: string;
  creditNote?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  resultHref?: string;
  /**
   * Động từ mô tả việc job làm — mặc định `generated` (AI Studio).
   *
   * Vì sao cần prop này: Settings → Connections dùng chính component này cho job
   * **import** post cũ từ TikTok/IG. Để nguyên chữ "generated" thì UI nói dối —
   * merchant đọc "143 videos generated" và tưởng mình vừa tiêu 143 credit.
   */
  pastVerb?: string;
  /** Heading của banner khi fail — mặc định của AI Studio, import job cần chữ khác */
  failureHeading?: string;
}) {
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const badge = {
    queued: <s-badge tone="neutral">Queued</s-badge>,
    processing: <s-badge tone="info">Processing</s-badge>,
    done: <s-badge tone="success">Done</s-badge>,
    failed: <s-badge tone="critical">Failed</s-badge>,
  }[status];

  return (
    <s-section padding="base">
      <s-stack direction="block" gap="small">
        <s-stack direction="inline" gap="small-100" alignItems="center" justifyContent="space-between">
          <s-stack direction="inline" gap="small-200" alignItems="center">
            {badge}
            <strong>{title}</strong>
          </s-stack>

          {status === 'processing' && onCancel && (
            <s-button variant="tertiary" tone="critical" onClick={onCancel}>
              Cancel
            </s-button>
          )}
          {status === 'failed' && onRetry && (
            <s-button variant="tertiary" onClick={onRetry}>
              Retry
            </s-button>
          )}
        </s-stack>

        {/* queued: KHÔNG vẽ progress bar — chưa biết % thì đừng vẽ số giả */}
        {status === 'queued' && (
          <s-paragraph color="subdued">
            Waiting for an available slot. This usually starts within a minute.
          </s-paragraph>
        )}

        {status === 'processing' && (
          <s-stack direction="block" gap="small-300">
            <s-stack direction="inline" gap="small-100" justifyContent="space-between">
              <s-text>
                {done} of {total} done
              </s-text>
              {/* ETA bắt buộc: spinner không ETA thì merchant không biết
                  10 giây hay 10 phút, sẽ reload và tưởng app vỡ */}
              {etaLabel && <s-text color="subdued">{etaLabel}</s-text>}
            </s-stack>
            {/* `hideLabel`: dòng "{done} of {total} done" ngay trên đã nói con số này,
                hiện lại dưới bar là lặp. Label vẫn là aria-label của progressbar. */}
            <ProgressBar
              progress={progress}
              label={`${done} of ${total} videos ${pastVerb}`}
              hideLabel
            />
          </s-stack>
        )}

        {/* Kết quả TỪNG PHẦN — xong 3 lỗi 2 thì hiện 3 cái xong ngay */}
        {status === 'done' && failedCount > 0 && (
          <s-banner tone="warning" heading={`${done} of ${total} videos ${pastVerb}`}>
            <s-paragraph>
              {failedCount} {failedCount === 1 ? 'video' : 'videos'} could not be {pastVerb}.
              {creditNote ? ` ${creditNote}.` : ''}
            </s-paragraph>
            {onRetry && (
              <s-button slot="secondary-actions" onClick={onRetry}>
                Retry failed videos
              </s-button>
            )}
          </s-banner>
        )}

        {status === 'done' && failedCount === 0 && (
          <s-stack direction="inline" gap="small-100" alignItems="center" justifyContent="space-between">
            <s-paragraph color="subdued">
              All {total} videos {pastVerb}.{creditNote ? ` ${creditNote}.` : ''}
            </s-paragraph>
            {resultHref && (
              <s-link href={resultHref}>
                <strong>Review videos</strong>
              </s-link>
            )}
          </s-stack>
        )}

        {status === 'failed' && (
          <s-banner tone="critical" heading={failureHeading}>
            {/* Lý do CỤ THỂ. "Something went wrong" là vô dụng cho enterprise */}
            <s-paragraph>
              {errorMessage ?? 'The AI provider did not respond. No videos were created.'}
            </s-paragraph>
            {/* Nói rõ credit — enterprise SẼ đối chiếu hoá đơn */}
            {creditNote && (
              <s-paragraph>
                <strong>{creditNote}.</strong>
              </s-paragraph>
            )}
          </s-banner>
        )}

        {/* In real app: job state đọc từ API + poll để survive reload.
            shopify.toast.show('5 videos ready') khi chuyển sang done. */}
      </s-stack>
    </s-section>
  );
}
