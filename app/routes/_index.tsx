/**
 * Trang index của HARNESS — gửi team 1 link, click xem hết mockup.
 * Không phải route của app thật.
 */
import {useNavigate} from 'react-router-dom';

import {MOCKUPS} from '../registry';

const STATUS_TONE = {
  ready: 'success',
  draft: 'info',
  blocked: 'critical',
} as const;

export default function MockupIndex() {
  const navigate = useNavigate();

  return (
    <s-page heading="MakeUGC admin mockups">
      <s-stack direction="block" gap="base">
        <s-banner tone="info" heading="Đọc trước khi review">
          <s-unordered-list>
            <s-list-item>
              Stack: <s-text type="strong">Shopify Remix template + Polaris web components</s-text>{' '}
              (<s-text type="strong">&lt;s-*&gt;</s-text>), KHÔNG dùng @shopify/polaris React. Chốt
              03 Aug 2026.
            </s-list-item>
            <s-list-item>
              Component nạp qua CDN <s-text type="strong">polaris.js</s-text>, không qua npm. Props
              đã verify bằng <s-text type="strong">npm run typecheck</s-text> với
              @shopify/polaris-types.
            </s-list-item>
            <s-list-item>
              Đây là mockup <s-text type="strong">embedded admin</s-text>. Storefront widget dùng
              CSS + brand token, không phải Polaris — chưa cover.
            </s-list-item>
            <s-list-item>
              Admin cố ý <s-text type="strong">không nhuộm brand MakeUGC</s-text> — native Polaris
              là yêu cầu Built for Shopify (mục tiêu Phase 3).
            </s-list-item>
            <s-list-item>
              Nav bên trên là của harness. App thật dùng{' '}
              <s-text type="strong">&lt;ui-nav-menu&gt;</s-text> của App Bridge, render NGOÀI
              iframe.
            </s-list-item>
          </s-unordered-list>
        </s-banner>

        {MOCKUPS.map((mockup) => (
          <s-section key={mockup.path}>
            <s-stack direction="block" gap="small">
              <s-stack
                direction="inline"
                gap="small-100"
                alignItems="center"
                justifyContent="space-between"
              >
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-link
                    href={mockup.path}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(mockup.path);
                    }}
                  >
                    <s-text type="strong">{mockup.label}</s-text>
                  </s-link>
                  <s-badge tone={STATUS_TONE[mockup.status]}>{mockup.status}</s-badge>
                </s-stack>
                <s-text color="subdued">{mockup.section}</s-text>
              </s-stack>

              <s-paragraph color="subdued">{mockup.description}</s-paragraph>

              <s-box background="subdued" borderRadius="base" padding="small-100">
                <s-text color="subdued">{mockup.routeFile}</s-text>
              </s-box>

              {/* Link ra ngoài + target="_blank" → handler client-side của Shell.tsx cố ý
                  bỏ qua, nên browser tự mở tab mới và state đang review không bị reset. */}
              {mockup.prdUrl && (
                <s-stack direction="inline" gap="small-300" alignItems="center">
                  <s-icon type="note" tone="neutral" size="small" />
                  <s-link href={mockup.prdUrl} target="_blank">
                    PRD — danh sách tính năng trên Notion
                  </s-link>
                </s-stack>
              )}

              {mockup.open && mockup.open.length > 0 && (
                <>
                  <s-divider />
                  <s-text type="strong">Câu hỏi chưa chốt</s-text>
                  <s-unordered-list>
                    {mockup.open.map((question) => (
                      <s-list-item key={question}>
                        <s-text color="subdued">{question}</s-text>
                      </s-list-item>
                    ))}
                  </s-unordered-list>
                </>
              )}
            </s-stack>
          </s-section>
        ))}
      </s-stack>
    </s-page>
  );
}
