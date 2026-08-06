/**
 * MOCKUP — Video detail / product tagging
 *
 * "Tag products in-video so shoppers can add to cart while they watch" là 1 trong
 * 5 feature headline của app listing V1 → trang này là core MVP.
 *
 * Quyết định UX chính: **product tag gắn với MỐC THỜI GIAN trong video**, không
 * phải gắn với cả video. Shopper thấy áo ở giây 12 thì tag phải hiện ở giây 12.
 *
 * Route file thật: app/routes/app.library.$id.tsx
 */
import {useState} from 'react';

import StateSwitcher from '../components/StateSwitcher';
import {ProgressBar} from '../components/primitives';
import {taggedProducts} from '../data/sample';

const STATES = [
  {value: 'default', label: 'Default — đã tag 3 product'},
  {value: 'untagged', label: 'Untagged — chưa tag product nào (lỗi im lặng)'},
  {value: 'dirty', label: 'Dirty — có thay đổi chưa lưu (save bar)'},
  {value: 'processing', label: 'Processing — video đang được xử lý'},
  {value: 'errors', label: 'Validation errors'},
  {value: 'product-unavailable', label: 'Product unavailable — SP đã xoá/hết hàng'},
  {value: 'no-permission', label: 'No permission — chỉ xem được'},
];

const SURFACES = ['Product page', 'Home page', 'Collection page', 'Cart page'];

export default function VideoDetail() {
  const [state, setState] = useState('default');
  const [title, setTitle] = useState('Summer haul — 5 pieces I actually wear');
  const [status, setStatus] = useState('published');
  const [ctaLabel, setCtaLabel] = useState('Add to cart');
  const [autoplay, setAutoplay] = useState(true);
  const [placements, setPlacements] = useState(['Product page', 'Home page']);

  const is = (...names: string[]) => names.includes(state);
  const readOnly = is('no-permission');
  const untagged = is('untagged');

  const products = untagged
    ? []
    : is('product-unavailable')
      ? taggedProducts.map((p, i) => (i === 1 ? {...p, available: false} : p))
      : taggedProducts;

  const unavailableCount = products.filter((p) => !p.available).length;
  const titleError = is('errors') ? 'Title is required' : undefined;
  const ctaError = is('errors') ? 'Button label must be 24 characters or fewer' : undefined;

  return (
    <s-page heading={title || 'Untitled video'}>
      <s-button slot="breadcrumb-actions" icon="arrow-left" href="/app/library" variant="tertiary">
        Videos
      </s-button>
      <s-button
        slot="primary-action"
        variant="primary"
        disabled={readOnly || !is('dirty')}
      >
        Save
      </s-button>
      <s-button slot="secondary-actions" icon="external" href="#" target="_blank">
        Preview in store
      </s-button>

      <s-stack direction="block" gap="base">
        <StateSwitcher state={state} onChange={setState} states={STATES} />

        {is('errors') && (
          <s-banner tone="critical" heading="There are errors on this page">
            <s-unordered-list>
              <s-list-item>{titleError}</s-list-item>
              <s-list-item>{ctaError}</s-list-item>
            </s-unordered-list>
          </s-banner>
        )}

        {/* In real app khi dirty: shopify.saveBar.show('video-save-bar') —
            App Bridge contextual save bar, KHÔNG phải banner. BFS yêu cầu save bar. */}
        {is('dirty') && (
          <s-banner tone="info" heading="Unsaved changes">
            <s-paragraph>
              App thật dùng App Bridge contextual save bar ở đầu page, không phải banner này.
            </s-paragraph>
          </s-banner>
        )}

        {/* Lỗi im lặng quan trọng nhất */}
        {untagged && (
          <s-banner tone="warning" heading="No products tagged — this video can't drive sales">
            <s-paragraph>
              Shoppers can watch this video, but there&apos;s nothing to add to cart. Tag at least
              one product to make it shoppable.
            </s-paragraph>
            <s-button slot="secondary-actions">Tag a product</s-button>
          </s-banner>
        )}

        {unavailableCount > 0 && (
          <s-banner
            tone="critical"
            heading={`${unavailableCount} tagged product is no longer available`}
          >
            <s-paragraph>
              The tag still shows in the video but shoppers get an error when they tap it. Replace
              or remove it.
            </s-paragraph>
          </s-banner>
        )}

        {is('processing') && (
          <s-section heading="Preparing video for your storefront">
            <s-stack direction="block" gap="small">
              <s-badge tone="info">Processing</s-badge>
              <ProgressBar progress={68} label="Transcoding and generating thumbnails" />
              <s-stack direction="inline" gap="small-100" justifyContent="space-between">
                <s-text>Transcoding and generating thumbnails</s-text>
                <s-text color="subdued">~40 sec left</s-text>
              </s-stack>
              <s-paragraph color="subdued">
                You can tag products now — changes save even while processing.
              </s-paragraph>
            </s-stack>
          </s-section>
        )}

        {readOnly && (
          <s-banner tone="info" heading="You have view-only access">
            <s-paragraph>Editing videos needs staff access to this app.</s-paragraph>
          </s-banner>
        )}

        {/* ══ PRODUCT TAGGING — phần quan trọng nhất trang ══ */}
        <s-section heading="Tagged products">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="small-100" justifyContent="space-between" alignItems="center">
              <s-paragraph color="subdued">
                Tags appear at the moment you set, while the shopper watches.
              </s-paragraph>
              {/* In real app: shopify.resourcePicker({type: 'product', multiple: true}) */}
              <s-button icon="product-add" disabled={readOnly}>
                Add product
              </s-button>
            </s-stack>

            {products.length === 0 ? (
              <s-box background="subdued" borderRadius="base" padding="large-100">
                <s-stack direction="block" gap="small" alignItems="center">
                  <s-icon type="alert-triangle" tone="caution" />
                  <s-text type="strong">No products tagged yet</s-text>
                  <s-paragraph color="subdued">
                    Tag the products shown in this video so shoppers can add them to cart without
                    leaving the page.
                  </s-paragraph>
                  <s-button variant="primary" icon="product-add" disabled={readOnly}>
                    Add product
                  </s-button>
                </s-stack>
              </s-box>
            ) : (
              <s-table variant="auto">
                <s-table-header-row>
                  <s-table-header listSlot="primary">Product</s-table-header>
                  <s-table-header>Show at</s-table-header>
                  <s-table-header format="numeric">Orders</s-table-header>
                  <s-table-header>Actions</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {products.map((product) => (
                    <s-table-row key={product.id}>
                      <s-table-cell>
                        <s-stack direction="inline" gap="small-100" alignItems="center">
                          <s-thumbnail
                            src={`https://picsum.photos/seed/prod-${product.id}/80/80`}
                            alt={product.title}
                            size="small"
                          />
                          <s-stack direction="block" gap="small-500">
                            <s-text type="strong">{product.title}</s-text>
                            <s-text color="subdued">
                              {product.variant} · {product.price}
                            </s-text>
                            {!product.available && (
                              <s-text tone="critical">No longer available in your catalog</s-text>
                            )}
                          </s-stack>
                        </s-stack>
                      </s-table-cell>
                      <s-table-cell>
                        <s-text-field
                          label="Show at"
                          labelAccessibilityVisibility="exclusive"
                          value={product.timestamp}
                          disabled={readOnly}
                        />
                      </s-table-cell>
                      <s-table-cell>{String(product.orders)}</s-table-cell>
                      <s-table-cell>
                        <s-button
                          variant="tertiary"
                          icon="delete"
                          tone="critical"
                          accessibilityLabel={`Remove ${product.title}`}
                          disabled={readOnly}
                        />
                      </s-table-cell>
                    </s-table-row>
                  ))}
                </s-table-body>
              </s-table>
            )}
          </s-stack>
        </s-section>

        {/* ══ DETAILS ══ */}
        <s-section heading="Details">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="Title"
              value={title}
              onInput={(event) => setTitle(event.currentTarget.value)}
              maxLength={255}
              error={titleError}
              disabled={readOnly}
              details="Shown in your admin only. Shoppers don't see this."
            />
            <s-select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.currentTarget.value)}
              disabled={readOnly}
            >
              <s-option value="published">Published — live in your store</s-option>
              <s-option value="draft">Draft — not visible to shoppers</s-option>
            </s-select>
          </s-stack>
        </s-section>

        {/* ══ SHOPPING BEHAVIOUR ══ */}
        <s-section heading="Shopping behaviour">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="Add to cart button label"
              value={ctaLabel}
              onInput={(event) => setCtaLabel(event.currentTarget.value)}
              maxLength={24}
              error={ctaError}
              disabled={readOnly}
              details="Keep it short so it fits on mobile."
            />
            {/* s-switch = toggle. Label trái / control phải là mặc định của component,
                không phải tự dựng InlineStack như React Polaris */}
            <s-switch
              label="Autoplay muted"
              details="Recommended. Videos with sound on autoplay are blocked by most browsers."
              checked={autoplay}
              onChange={(event) => setAutoplay(event.currentTarget.checked)}
              disabled={readOnly}
            />
          </s-stack>
        </s-section>

        {/* ══ PLACEMENT — tên surface đúng chuẩn Shopify ══ */}
        <s-section heading="Where this video appears">
          <s-stack direction="block" gap="base">
            <s-paragraph color="subdued">
              Placement is controlled per player in Player. This picks which players include this
              video.
            </s-paragraph>
            <s-choice-list
              label="Surfaces"
              labelAccessibilityVisibility="exclusive"
              multiple
              values={placements}
              onChange={(event) => setPlacements(event.currentTarget.values)}
              disabled={readOnly}
            >
              {SURFACES.map((surface) => (
                <s-choice key={surface} value={surface}>
                  {surface}
                </s-choice>
              ))}
            </s-choice-list>
          </s-stack>
        </s-section>
      </s-stack>

      {/* ══ ASIDE ══ */}
      <s-stack slot="aside" direction="block" gap="base">
        <s-section heading="Preview">
          <s-stack direction="block" gap="small">
            {/* s-image có aspectRatio + objectFit — không cần inline style như React */}
            <s-image
              src="https://picsum.photos/seed/makeugc-v-1/400/600"
              alt="Video preview"
              aspectRatio="9/16"
              objectFit="cover"
              loading="lazy"
              borderRadius="base"
            />
            <s-button icon="play">Play preview</s-button>
          </s-stack>
        </s-section>

        <s-section heading="Performance">
          <s-stack direction="block" gap="small-200">
            {[
              ['Views', '48,210'],
              ['Add to cart taps', '412'],
              ['Attributed orders', '142'],
              ['Attributed revenue', '$8,940'],
            ].map(([label, value]) => (
              <s-stack key={label} direction="inline" gap="small-100" justifyContent="space-between">
                <s-text color="subdued">{label}</s-text>
                <s-text type="strong">{value}</s-text>
              </s-stack>
            ))}
            <s-divider />
            <s-paragraph color="subdued">
              Tracked by MakeUGC. Connect Triple Whale in Settings for multi-touch attribution.
            </s-paragraph>
          </s-stack>
        </s-section>

        <s-section heading="Danger zone">
          <s-stack direction="block" gap="small">
            <s-button
              tone="critical"
              disabled={readOnly}
              interestFor={readOnly ? 'delete-tip' : undefined}
            >
              Delete video
            </s-button>
            {readOnly && <s-tooltip id="delete-tip">Needs staff access to this app</s-tooltip>}
            <s-paragraph color="subdued">
              Past attributed revenue stays in your reports.
            </s-paragraph>
          </s-stack>
        </s-section>
      </s-stack>
    </s-page>
  );
}
