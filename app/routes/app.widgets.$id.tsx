/**
 * MOCKUP — Widget detail. Vẽ lại 06 Aug 2026 theo screenshot app thật.
 *
 * Đây là đích của nút "Edit design" trên trang Widgets index, và là nơi sống của 4 P0 đã
 * ghi nhận từ lần trước:
 *
 *  1. Preview của app nói "Add videos to this widget to preview" ở CẢ 4 sub-tab Design →
 *     merchant chỉnh 30 field màu trên một ô trống. Bản này preview luôn vẽ được.
 *  2. Tab app xếp Design | Media | Setup, ngược với hướng dẫn của chính app ("create a
 *     widget, add media, then place the block"). Bản này: Videos → Design → Setup.
 *  3. Widget ID phải copy tay (cuid 25 ký tự, app không có nút copy).
 *  4. `Overlay strength` hiện `0,58` — dấu phẩy thập phân, lỗi locale.
 *
 * Và một sự thật mới: template có **BA cơ chế** lên storefront (theme block / app embed /
 * app proxy), app viết chung một hướng dẫn cho tất cả. Xem `setupKind` trong sample.ts.
 *
 * Route file thật: app/routes/app.widgets.$id.tsx
 */
import {useState} from 'react';
import {useParams} from 'react-router-dom';

import StateSwitcher from '../components/StateSwitcher';
import type {StateOption} from '../components/StateSwitcher';
import {EmptyState, SurfacePills, TabBar, WidgetShape} from '../components/primitives';
import {placementText, templateFor, thumb, videos, widgetList} from '../data/sample';
import type {Video} from '../data/sample';

const STATES: StateOption[] = [
  {
    value: 'default',
    label: 'Default — tab Videos, playlist đầy',
    doc: [
      {
        section: 'Tab',
        rule: 'Thứ tự Videos → Design → Setup, ngược với app. Chính app dạy thứ tự này ở trang Widgets ("create a widget, add media from Library, then place the app block") rồi lại xếp tab ngược lại.',
      },
      {
        section: 'Videos',
        rule: 'Thứ tự hàng LÀ thứ tự shopper thấy — nên nói ra, và phải đổi được. App thật không có control nào cho việc này.',
      },
    ],
  },
  {
    value: 'videos-empty',
    label: 'Videos rỗng — playlist chưa có gì',
    doc: [
      {
        section: 'Empty state',
        rule: 'Nút "Add videos" ở đây VÀ ở header của section khi đã có video. App thật chỉ có nút trong empty state — từ video thứ 2 trở đi merchant phải tự nhớ đường vòng qua Library.',
      },
    ],
  },
  {
    value: 'videos-untagged',
    label: 'Có video chưa tag product',
    doc: [
      {
        section: 'Banner + hàng',
        rule: 'Video nằm trong widget mà chưa tag product = shopper xem xong không mua được gì. Đây đúng là màn hình bắt được nó, mà app không nói gì cả.',
      },
    ],
  },
  {
    value: 'design',
    label: 'Design — playlist đầy, preview thật',
    doc: [
      {
        section: 'Bố cục',
        rule: 'Bỏ sub-nav dọc của app (Behavior/Layout/Style/Lightbox) → 4 section xếp dọc. Sub-nav là tầng chrome thứ 3 sau sub-header và tab, mà chỉ để chuyển giữa 4 nhóm field.',
      },
      {
        section: 'Preview',
        rule: 'Nằm ở slot aside nên dính bên cạnh khi cuộn. Card "Lightbox theme" CHỈ hiện ở tab Design — app hiện nó ở cả 4 sub-tab kể cả khi đang sửa Layout.',
      },
    ],
  },
  {
    value: 'design-no-videos',
    label: 'Design + playlist rỗng — preview VẪN chạy',
    doc: [
      {
        section: 'Preview',
        rule: 'Điểm khác app rõ nhất. App nói "Add videos to preview" ở cả 4 sub-tab → 30 field không kiểm chứng được. Preview ở đây vẽ ô placeholder theo đúng số cột · gap · radius · màu đang chọn.',
      },
    ],
  },
  {
    value: 'dirty',
    label: 'Dirty — có thay đổi chưa lưu',
    doc: [
      {
        section: 'Save',
        rule: 'App thật dùng App Bridge contextual save bar (render NGOÀI iframe) nên mockup không hiện được → banner này là bản thay thế của harness, KHÔNG phải UI đề xuất. App hiện đang để nút "Save settings" inline giữa trang, BFS không chấp nhận.',
      },
    ],
  },
  {
    value: 'setup-app-embed',
    label: 'Setup — template App embed (KHÁC theme block)',
    doc: [
      {
        section: 'Bước 2',
        rule: 'App embed bật bằng TOGGLE trong theme editor, không có chỗ nào "thêm block vào template" và KHÔNG phải dán Widget ID. App thật viết chung một hướng dẫn theme-block cho mọi template → merchant Bubble Feed đi tìm một thứ không tồn tại.',
      },
    ],
  },
  {
    value: 'setup-empty-widget',
    label: 'Setup — widget 0 video vẫn add to theme được',
    doc: [
      {
        section: 'Cảnh báo',
        rule: 'App cho hoàn thành đủ 3 bước với playlist rỗng, không nói gì. Merchant làm xong và storefront hiện khoảng trắng.',
      },
    ],
  },
  {
    value: 'theme-unsupported',
    label: 'Theme unsupported — Online Store 1.0',
    doc: [
      {
        section: 'Nút',
        rule: 'Disabled kèm lý do bằng TEXT HIỆN SẴN — tooltip không mở trên control disabled (§7a).',
      },
    ],
  },
  {
    value: 'no-permission',
    label: 'No permission — chỉ xem được',
    doc: [{section: 'Mọi field', rule: 'Disable chứ không ẩn, lý do là text hiện sẵn.'}],
  },
];

const TABS = [
  {id: 'videos' as const, label: 'Videos'},
  {id: 'design' as const, label: 'Design'},
  {id: 'setup' as const, label: 'Setup'},
];

const DEVICES = [
  {id: 'mobile' as const, label: 'Mobile'},
  {id: 'tablet' as const, label: 'Tablet'},
  {id: 'desktop' as const, label: 'Desktop'},
];

/**
 * 30 field Design — giữ PHẲNG đủ cả (Stella chốt 06 Aug 2026), không gom thành preset.
 *
 * Đổi lại thì preview bắt buộc phải chạy được khi chưa có video, nếu không thì 30 field
 * này không có cách nào kiểm chứng — đó chính là tình trạng của app hiện tại.
 */
const DESIGN_DEFAULTS = {
  autoAdvance: false,
  loop: false,
  productOverlay: true,
  arrows: true,
  dots: true,
  colsMobile: 2,
  colsTablet: 3,
  colsDesktop: 3,
  gapMobile: 10,
  gapDesktop: 14,
  cardRadius: 10,
  ink: '#161616',
  arrowBg: '#ffffff',
  arrowIcon: '#161616',
  dotColor: '#161616',
  activeDotOpacity: 1,
  ctaBg: '#161616',
  ctaText: '#ffffff',
  ctaRadius: 5,
  overlayStrength: 0.58,
  titleColor: '#ffffff',
  titleSize: 14,
  titleWeight: '600',
  lightboxPanel: '#ffffff',
  lightboxText: '#161616',
  lightboxCartBg: '#161616',
  lightboxCartText: '#ffffff',
  dialogRadius: 12,
  popupSize: 'comfortable',
  openAnimation: 'zoom',
  showDescription: true,
  showProgress: true,
  startMuted: true,
};

type Design = typeof DESIGN_DEFAULTS;

/** Playlist suy ra từ `video.widgets` — MỘT nguồn sự thật, không nhân đôi thành `videoIds` */
function playlistFor(widgetName: string) {
  return videos.filter((video) => video.widgets.includes(widgetName));
}

export default function WidgetDetail() {
  const [state, setState] = useState('default');
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('videos');
  const [device, setDevice] = useState<(typeof DEVICES)[number]['id']>('desktop');
  const [design, setDesign] = useState<Design>(DESIGN_DEFAULTS);
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [target, setTarget] = useState<Video | null>(null);
  /** Index hàng đang được kéo — `null` = không kéo gì */
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  /** Index hàng con trỏ đang lơ lửng bên trên, để vẽ chỉ báo chỗ sẽ thả */
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  /**
   * Widget nào đang mở — đọc từ URL, KHÔNG hardcode.
   *
   * Bắt được 06 Aug 2026: bản trước luôn lấy `widgetList[0]`, nên bấm "Edit design" ở
   * widget nào cũng ra "Main product stories" — URL là `/app/widgets/w-6` mà nội dung là
   * w-1. Route param có mà không dùng là nói dối merchant về chỗ họ đang đứng.
   *
   * State `setup-app-embed` là công cụ review nên được phép ghi đè: nó cần một widget
   * dùng template app embed để so hướng dẫn Setup.
   */
  const {id} = useParams();
  const widget =
    state === 'setup-app-embed'
      ? widgetList[4]
      : (widgetList.find((entry) => entry.id === id) ?? widgetList[0]);
  const template = templateFor(widget.templateId);

  const emptyPlaylist =
    state === 'videos-empty' || state === 'design-no-videos' || state === 'setup-empty-widget';

  const [order, setOrder] = useState<string[] | null>(null);
  const basePlaylist = emptyPlaylist ? [] : playlistFor(widget.name);
  const playlist = order
    ? (order.map((id) => basePlaylist.find((v) => v.id === id)).filter(Boolean) as Video[])
    : basePlaylist;

  function changeState(next: string) {
    setState(next);
    // `syncing` mở thẳng tab Setup: toàn bộ UI sync (nút + spinner + "last synced")
    // sống ở đó. Để nó ở tab Videos thì state này không hiện gì cả — một state chết.
    setTab(next.startsWith('design') ? 'design' : next.startsWith('setup') ? 'setup' : 'videos');
    setDesign(DESIGN_DEFAULTS);
    setTouched(false);
    setOrder(null);
    setCopied(false);
  }

  function set<K extends keyof Design>(key: K, value: Design[K]) {
    setDesign((current) => ({...current, [key]: value}));
    setTouched(true);
  }

  const readOnly = state === 'no-permission';
  const themeUnsupported = state === 'theme-unsupported';
  const dirty = (state === 'dirty' || touched) && !readOnly;

  const untagged = playlist.filter((video) => video.products.length === 0);
  const showUntagged = state === 'videos-untagged' || untagged.length > 0;

  function move(index: number, delta: number) {
    const next = [...playlist];
    const swap = index + delta;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setOrder(next.map((video) => video.id));
    setTouched(true);
  }

  /** Thả hàng đang kéo vào vị trí `to` */
  function dropTo(to: number) {
    if (dragIndex === null || dragIndex === to) return;
    const next = [...playlist];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(to, 0, moved);
    setOrder(next.map((video) => video.id));
    setTouched(true);
    setDragIndex(null);
    setDropIndex(null);
  }

  function removeVideo() {
    if (!target) return;
    setOrder(playlist.filter((video) => video.id !== target.id).map((video) => video.id));
    setTouched(true);
  }

  /**
   * Field nào áp dụng cho format của widget ĐANG MỞ. Bấm Edit ở widget nào thì tab
   * Design chỉ hiện đúng những gì format đó có (Stella chốt 06 Aug 2026) — không thêm
   * field mới, chỉ giới hạn. Bảng ở `sample.ts` → `widgetTemplates[].design`.
   */
  const scope = template.design;

  const cols =
    device === 'mobile'
      ? design.colsMobile
      : device === 'tablet'
        ? design.colsTablet
        : design.colsDesktop;
  const gap = device === 'mobile' ? design.gapMobile : design.gapDesktop;

  return (
    <s-page heading={widget.name}>
      {/* breadcrumb-actions chỉ nhận LINK, không nhận button (app.onboarding.tsx:84).
          App thật để "All widgets" thành một nút trong hàng action — nó là breadcrumb,
          không phải action, nên đặt đúng slot của nó. */}
      <s-link slot="breadcrumb-actions" href="/app/widgets">
        All widgets
      </s-link>

      {/* Text trần, KHÔNG icon: nút trong slot action của s-page có `icon` thì Polaris
          warn ra console lúc hydrate (§7i) */}
      <s-button
        slot="primary-action"
        variant="primary"
        disabled={readOnly || themeUnsupported}
        href="#theme-editor"
        target="_blank"
      >
        {template.setupKind === 'app-embed' ? 'Enable app embed' : 'Add to theme'}
      </s-button>
      <s-button slot="secondary-actions" disabled={readOnly}>
        Rename
      </s-button>
      <s-button slot="secondary-actions" disabled={readOnly} href="/app/widgets">
        Delete widget
      </s-button>

      {/* ── Lưới hai cột TỰ DỰNG, không dùng `s-page slot="aside"` ──
          `slot="aside"` dựng layout trong SHADOW DOM của `s-page`, nên không ép được
          chiều cao cột từ ngoài → panel preview không sticky được, cuộn qua ~30 field là
          nó trôi mất (đo được: top tụt xuống −1064 ở scroll 1200).
          Tự dựng lưới thì cột phải là grid item của MÌNH, giãn hết chiều cao hàng, và
          sticky có chỗ dính.

          ⚠️ Dev copy route: nếu KHÔNG cần preview dính theo thì quay lại
          `<s-stack slot="aside">` cho đúng Polaris chuẩn. Đây là đánh đổi có chủ đích. */}
      <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16}}>
      {/* Mỗi cột PHẢI có div thật bọc ngoài: `s-stack` là `display: contents`, để trần
          thì lưới nhận hết các con cháu làm item chứ không phải hai cột. */}
      <div>
      <s-stack direction="block" gap="base">
        <StateSwitcher
          state={state}
          onChange={changeState}
          states={STATES}
          globalNote={
            <s-stack direction="block" gap="small-300">
              <strong>Chỗ mockup đi trước app</strong>
              <s-paragraph color="subdued">
                Preview chạy khi chưa có video · nút thêm video khi playlist đã có · đổi thứ tự
                playlist · cảnh báo video chưa tag product · nút copy Widget ID · hướng dẫn Setup
                phân nhánh theo cơ chế (theme block / app embed / app proxy). App thật chưa có
                cái nào trong số này.
              </s-paragraph>
            </s-stack>
          }
        />

        {/* Sub-header — badge template · số video · placement.
            Dùng "videos" chứ không phải "items": một vốn từ duy nhất (§3e). */}
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-badge>{template.name}</s-badge>
          <s-text color="subdued">
            {playlist.length} {playlist.length === 1 ? 'video' : 'videos'}
          </s-text>
          <SurfacePills surfaces={template.surfaces} note={template.placementNote} />
        </s-stack>

        {themeUnsupported && (
          <s-banner tone="critical" heading="Your current theme doesn't support app blocks">
            <s-paragraph>
              Themes built before Online Store 2.0 can&apos;t use app blocks. You can still edit
              this widget — it goes live once you switch to a supported theme.
            </s-paragraph>
          </s-banner>
        )}

        {readOnly && (
          <s-banner tone="info" heading="You have view-only access">
            <s-paragraph>
              Editing widgets needs staff access to this app. Ask the store owner to give you
              access.
            </s-paragraph>
          </s-banner>
        )}

        {/* HARNESS — app thật dùng App Bridge contextual save bar (render ngoài iframe,
            mockup không hiện được). App hiện đang để nút "Save settings" inline giữa
            trang; BFS yêu cầu save bar.
            In real app: shopify.saveBar.show('widget-design-save-bar') */}
        {dirty && (
          <s-banner tone="info" heading="You have unsaved changes">
            <s-paragraph>
Your storefront updates as soon as you save — no extra step.
            </s-paragraph>
            <s-button slot="secondary-actions" onClick={() => setTouched(false)}>
              Save
            </s-button>
            <s-button slot="secondary-actions" onClick={() => {setDesign(DESIGN_DEFAULTS); setTouched(false);}}>
              Reset to defaults
            </s-button>
          </s-banner>
        )}

        <TabBar
          tabs={[
            {id: 'videos' as const, label: `Videos (${playlist.length})`},
            ...TABS.slice(1),
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* ══════════ TAB VIDEOS ══════════ */}
        {tab === 'videos' && (
          <s-section heading="Videos in this widget">
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" gap="small" alignItems="center" justifyContent="space-between">
                <s-text color="subdued">
                  Shoppers see them in this order, starting with the first.
                </s-text>
                {/* App thật CHỈ có nút này trong empty state — từ video thứ 2 trở đi
                    merchant phải tự nhớ đường vòng Library → Add to widget */}
                <s-button disabled={readOnly} command="--show" commandFor="add-videos">
                  Add videos
                </s-button>
              </s-stack>

              {showUntagged && untagged.length > 0 && (
                <s-banner
                  tone="warning"
                  heading={`${untagged.length} ${untagged.length === 1 ? 'video has' : 'videos have'} no product tagged`}
                >
                  <s-paragraph>
                    Shoppers can watch {untagged.length === 1 ? 'it' : 'them'} but can&apos;t buy
                    anything. Tag a product in Library to turn views into orders.
                  </s-paragraph>
                  <s-button slot="secondary-actions" href="/app/library">
                    Open Library
                  </s-button>
                </s-banner>
              )}

              {playlist.length === 0 ? (
                <EmptyState
                  isEmptyState
                  heading="No videos in this widget yet"
                  body="Add videos from your Library. Until then, this widget shows an empty space on your storefront."
                  actionLabel="Add videos"
                  actionHref="/app/library"
                  resourceName="videos"
                />
              ) : (
                <s-stack direction="block" gap="small-200">
                  {playlist.map((video, index) => (
                    <VideoRow
                      key={video.id}
                      video={video}
                      index={index}
                      total={playlist.length}
                      readOnly={readOnly}
                      onMove={move}
                      onRemove={() => setTarget(video)}
                      dragging={dragIndex === index}
                      dropTarget={dropIndex === index && dragIndex !== index}
                      onDragStart={() => setDragIndex(index)}
                      onDragEnd={() => {
                        setDragIndex(null);
                        setDropIndex(null);
                      }}
                      onDragOverRow={() => setDropIndex(index)}
                      onDropRow={() => dropTo(index)}
                    />
                  ))}
                </s-stack>
              )}
            </s-stack>
          </s-section>
        )}

        {/* ══════════ TAB DESIGN ══════════
            KHÔNG lồng s-section trong s-section — card con mất nền và viền (§7f).
            Bốn section này đứng ngang cấp, thay cho sub-nav dọc của app. */}
        {tab === 'design' && (
          <>
            {(scope.autoAdvance || scope.loop || scope.productOverlay || scope.arrows || scope.dots) && (
            <s-section heading="Behavior">
              <s-stack direction="block" gap="small">
                <s-paragraph color="subdued">
                  How the widget moves between videos. Videos always play muted until a shopper
                  taps.
                </s-paragraph>
                {scope.autoAdvance && <s-switch label="Auto-advance" details="Move to the next video on its own." checked={design.autoAdvance} disabled={readOnly} onChange={(e) => set('autoAdvance', e.currentTarget.checked)} />}
                {scope.loop && <s-switch label="Loop" details="Continue past the last video back to the first." checked={design.loop} disabled={readOnly} onChange={(e) => set('loop', e.currentTarget.checked)} />}
                {scope.productOverlay && <s-switch label="Product overlay" details="Show the product title and a Shop now button on the video." checked={design.productOverlay} disabled={readOnly} onChange={(e) => set('productOverlay', e.currentTarget.checked)} />}
                {scope.arrows && <s-switch label="Navigation arrows" checked={design.arrows} disabled={readOnly} onChange={(e) => set('arrows', e.currentTarget.checked)} />}
                {scope.dots && <s-switch label="Pagination dots" checked={design.dots} disabled={readOnly} onChange={(e) => set('dots', e.currentTarget.checked)} />}
              </s-stack>
            </s-section>
            )}

            {(scope.columns || scope.gap || scope.cardRadius) && (
            <s-section heading="Layout">
              <s-stack direction="block" gap="small">
                {/* Mô tả phải khớp field CÒN LẠI sau khi scope: nói "columns… each screen
                    size" trong khi chỉ còn mỗi bo góc là mô tả một thứ không có ở đây. */}
                <s-paragraph color="subdued">
                  {[scope.columns && 'columns', scope.gap && 'spacing', scope.cardRadius && 'card shape']
                    .filter(Boolean)
                    .join(', ')
                    .replace(/, ([^,]*)$/, ' and $1')
                    // Viết hoa chữ đầu: bỏ `Columns` thì câu mở đầu bằng chữ thường
                    .replace(/^./, (c) => c.toUpperCase())}
                  .{scope.columns || scope.gap ? ' Each screen size is set separately.' : ''}
                </s-paragraph>
                <s-grid gap="small" gridTemplateColumns="repeat(auto-fit, minmax(160px, 1fr))">
                  {scope.columns && <s-number-field label="Columns on mobile" value={String(design.colsMobile)} min={1} max={3} step={1} disabled={readOnly} onInput={(e) => set('colsMobile', Number(e.currentTarget.value))} />}
                  {scope.columns && <s-number-field label="Columns on tablet" value={String(design.colsTablet)} min={1} max={4} step={1} disabled={readOnly} onInput={(e) => set('colsTablet', Number(e.currentTarget.value))} />}
                  {scope.columns && <s-number-field label="Columns on desktop" value={String(design.colsDesktop)} min={1} max={6} step={1} disabled={readOnly} onInput={(e) => set('colsDesktop', Number(e.currentTarget.value))} />}
                  {scope.gap && <s-number-field label="Gap on mobile" details="Pixels between videos." value={String(design.gapMobile)} min={0} max={40} step={1} disabled={readOnly} onInput={(e) => set('gapMobile', Number(e.currentTarget.value))} />}
                  {scope.gap && <s-number-field label="Gap on desktop" details="Pixels between videos." value={String(design.gapDesktop)} min={0} max={40} step={1} disabled={readOnly} onInput={(e) => set('gapDesktop', Number(e.currentTarget.value))} />}
                  {scope.cardRadius && <s-number-field label="Card corner radius" value={String(design.cardRadius)} min={0} max={32} step={1} disabled={readOnly} onInput={(e) => set('cardRadius', Number(e.currentTarget.value))} />}
                </s-grid>
              </s-stack>
            </s-section>
            )}

            <s-section heading="Colours">
              <s-stack direction="block" gap="small">
                <s-paragraph color="subdued">
                  Colours of the widget itself
                  {scope.arrows || scope.dots || scope.cta
                    ? ` — ${[scope.arrows && 'arrows', scope.dots && 'dots', scope.cta && 'the buy button']
                        .filter(Boolean)
                        .join(', ')} drawn over your videos.`
                    : '.'}
                </s-paragraph>
                <s-grid gap="small" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))">
                  <s-color-field label="Ink" value={design.ink} disabled={readOnly} onChange={(e) => set('ink', e.currentTarget.value)} />
                  {scope.arrows && <s-color-field label="Arrow background" value={design.arrowBg} disabled={readOnly} onChange={(e) => set('arrowBg', e.currentTarget.value)} />}
                  {scope.arrows && <s-color-field label="Arrow icon" value={design.arrowIcon} disabled={readOnly} onChange={(e) => set('arrowIcon', e.currentTarget.value)} />}
                  {scope.dots && <s-color-field label="Dot" value={design.dotColor} disabled={readOnly} onChange={(e) => set('dotColor', e.currentTarget.value)} />}
                  {scope.cta && <s-color-field label="Buy button background" value={design.ctaBg} disabled={readOnly} onChange={(e) => set('ctaBg', e.currentTarget.value)} />}
                  {scope.cta && <s-color-field label="Buy button text" value={design.ctaText} disabled={readOnly} onChange={(e) => set('ctaText', e.currentTarget.value)} />}
                  {scope.dots && <s-number-field label="Active dot opacity" value={String(design.activeDotOpacity)} min={0} max={1} step={0.1} disabled={readOnly} onInput={(e) => set('activeDotOpacity', Number(e.currentTarget.value))} />}
                  {scope.cta && <s-number-field label="Buy button corner radius" value={String(design.ctaRadius)} min={0} max={24} step={1} disabled={readOnly} onInput={(e) => set('ctaRadius', Number(e.currentTarget.value))} />}
                  {/* App hiện field này ra `0,58` — dấu phẩy thập phân, lỗi locale.
                      s-number-field có min/max/step nên không nhập tay sai định dạng được. */}
                  {scope.overlay && <s-number-field label="Overlay strength" details="Dark gradient behind the product title, 0 to 1." value={String(design.overlayStrength)} min={0} max={1} step={0.01} disabled={readOnly} onInput={(e) => set('overlayStrength', Number(e.currentTarget.value))} />}
                </s-grid>

                <s-divider />
                {scope.titleStyle && <strong>Product title on each video</strong>}
                {scope.titleStyle && (
                <s-grid gap="small" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))">
                  <s-color-field label="Title colour" value={design.titleColor} disabled={readOnly} onChange={(e) => set('titleColor', e.currentTarget.value)} />
                  <s-number-field label="Title size" details="Pixels." value={String(design.titleSize)} min={10} max={28} step={1} disabled={readOnly} onInput={(e) => set('titleSize', Number(e.currentTarget.value))} />
                  <s-select label="Title weight" value={design.titleWeight} disabled={readOnly} onChange={(e) => set('titleWeight', e.currentTarget.value)}>
                    <s-option value="400">Regular</s-option>
                    <s-option value="500">Medium</s-option>
                    <s-option value="600">Semibold</s-option>
                    <s-option value="700">Bold</s-option>
                    <s-option value="800">Extra bold</s-option>
                  </s-select>
                </s-grid>
                )}
              </s-stack>
            </s-section>

            {scope.lightbox && (
            <s-section heading="Lightbox">
              <s-stack direction="block" gap="small">
                <s-paragraph color="subdued">
                  The popup that opens when a shopper taps a video on your storefront.
                </s-paragraph>
                <s-grid gap="small" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))">
                  <s-color-field label="Panel background" value={design.lightboxPanel} disabled={readOnly} onChange={(e) => set('lightboxPanel', e.currentTarget.value)} />
                  <s-color-field label="Text and borders" value={design.lightboxText} disabled={readOnly} onChange={(e) => set('lightboxText', e.currentTarget.value)} />
                  <s-color-field label="Add to cart background" value={design.lightboxCartBg} disabled={readOnly} onChange={(e) => set('lightboxCartBg', e.currentTarget.value)} />
                  <s-color-field label="Add to cart text" value={design.lightboxCartText} disabled={readOnly} onChange={(e) => set('lightboxCartText', e.currentTarget.value)} />
                  <s-number-field label="Dialog corner radius" value={String(design.dialogRadius)} min={0} max={32} step={1} disabled={readOnly} onInput={(e) => set('dialogRadius', Number(e.currentTarget.value))} />
                  <s-select label="Popup size" value={design.popupSize} disabled={readOnly} onChange={(e) => set('popupSize', e.currentTarget.value)}>
                    <s-option value="compact">Compact</s-option>
                    <s-option value="comfortable">Comfortable</s-option>
                    <s-option value="large">Large</s-option>
                  </s-select>
                  <s-select label="Open animation" value={design.openAnimation} disabled={readOnly} onChange={(e) => set('openAnimation', e.currentTarget.value)}>
                    <s-option value="fade">Fade</s-option>
                    <s-option value="zoom">Zoom</s-option>
                    <s-option value="slide-up">Slide up</s-option>
                  </s-select>
                </s-grid>
                <s-switch label="Show product description" checked={design.showDescription} disabled={readOnly} onChange={(e) => set('showDescription', e.currentTarget.checked)} />
                <s-switch label="Show progress bar" checked={design.showProgress} disabled={readOnly} onChange={(e) => set('showProgress', e.currentTarget.checked)} />
                <s-switch label="Start muted" details="Shoppers can unmute. Browsers block autoplay with sound." checked={design.startMuted} disabled={readOnly} onChange={(e) => set('startMuted', e.currentTarget.checked)} />
              </s-stack>
            </s-section>
            )}
          </>
        )}

        {/* ══════════ TAB SETUP ══════════ */}
        {tab === 'setup' && (
          <>
            {playlist.length === 0 && (
              <s-banner tone="warning" heading="This widget has no videos yet">
                <s-paragraph>
                  You can finish setup, but shoppers will see an empty space until you add videos.
                </s-paragraph>
                <s-button slot="secondary-actions" href="/app/library">
                  Add videos
                </s-button>
              </s-banner>
            )}

            <s-section heading="1. Template">
              <s-stack direction="block" gap="small">
                <s-paragraph>
                  <strong>{template.name}</strong> — {template.blurb}
                </s-paragraph>
                <s-text color="subdued">Placement: {placementText(template)}</s-text>

                {/* App hiện Widget ID thành text trần, không có nút copy — merchant phải
                    chép tay 25 ký tự cuid sang theme editor. */}
                {template.setupKind === 'theme-block' && (
                  <s-stack direction="block" gap="small-300">
                    <s-text-field
                      label="Widget ID"
                      value={widget.widgetId}
                      readOnly
                      id="widget-id-field"
                      details="Paste this into the theme block in step 2."
                    />
                    <s-button
                      onClick={() => {
                        // In real app: navigator.clipboard.writeText(widget.widgetId)
                        setCopied(true);
                      }}
                    >
                      {copied ? 'Copied' : 'Copy widget ID'}
                    </s-button>
                  </s-stack>
                )}
              </s-stack>
            </s-section>

            {/* Ba cơ chế Shopify khác nhau → ba hướng dẫn khác nhau. App viết chung một
                bản theme-block cho tất cả, nên merchant dùng app embed đi tìm chỗ "thêm
                block" không tồn tại. */}
            <s-section
              heading={
                template.setupKind === 'app-embed'
                  ? '2. Turn on the app embed'
                  : template.setupKind === 'app-proxy'
                    ? '2. Link to the feed page'
                    : '2. Add the theme block'
              }
            >
              <s-stack direction="block" gap="small">
                {template.setupKind === 'app-embed' ? (
                  <>
                    <s-paragraph>
                      This template is an <strong>app embed</strong>, not a section
                      block. Open your theme editor, go to <strong>App embeds</strong>{' '}
                      in the sidebar, and turn on MakeUGC. It then appears on every page of your
                      store.
                    </s-paragraph>
                    <s-text color="subdued">
                      There is no widget ID to paste — app embeds apply site-wide.
                    </s-text>
                  </>
                ) : template.setupKind === 'app-proxy' ? (
                  <>
                    <s-paragraph>
                      This template lives on its own page at{' '}
                      <strong>/apps/feed</strong>. Add a link to it from your
                      navigation or a marketing campaign.
                    </s-paragraph>
                    <s-text color="subdued">
                      ⏳ Not verified with the dev team yet — the setup steps for this template may
                      change.
                    </s-text>
                  </>
                ) : (
                  <s-paragraph>
                    Open your theme editor on a product template, add the{' '}
                    <strong>MakeUGC Widget</strong> block below the description, then
                    paste the widget ID from step 1. On each product page, only videos tagged with
                    that product are shown.
                  </s-paragraph>
                )}

                <s-button disabled={readOnly || themeUnsupported} href="#theme-editor" target="_blank">
                  {template.setupKind === 'app-embed' ? 'Open theme editor' : 'Add to theme'}
                </s-button>
                {themeUnsupported && (
                  // Lý do bằng TEXT HIỆN SẴN — tooltip không mở trên control disabled (§7a)
                  <s-text color="subdued">
                    Your theme is Online Store 1.0, which doesn&apos;t support app blocks.
                  </s-text>
                )}
              </s-stack>
            </s-section>

            {/* Setup còn HAI bước, không phải ba (Stella chốt 06 Aug 2026).
                Bước "Sync storefront data" của app đã bỏ khỏi luồng: storefront cập nhật
                ngay lúc save. Giữ lại đúng một nút SỬA LỖI ở cuối — không phải bước bắt
                buộc, không đánh số, chỉ dùng khi storefront trông không khớp.

                In real app: mutation ghi metafield chạy trong CÙNG request với save. */}
            <s-section heading="Your storefront stays up to date on its own">
              <s-stack direction="block" gap="small">
                <s-paragraph color="subdued">
                  Every time you save, your storefront picks up the change right away. There&apos;s
                  no publish step to remember.
                </s-paragraph>
                <s-text color="subdued">
                  Storefront doesn&apos;t match what you see here? Refreshing rebuilds the copy your
                  theme reads from.
                </s-text>
                <s-button variant="tertiary" disabled={readOnly} onClick={() => undefined}>
                  Refresh storefront data
                </s-button>
              </s-stack>
            </s-section>
          </>
        )}
      </s-stack>
      </div>

      {/* ══════════ CỘT PHẢI — PREVIEW ══════════
          App nói "Add videos to this widget to preview" ở CẢ 4 sub-tab Design, nên 30
          field không có cách nào kiểm chứng. Preview này luôn vẽ được: có video thì dùng
          thumbnail, chưa có thì dùng ô placeholder — số cột, gap, radius, màu vẫn đúng. */}
      {/* Preview phải theo mắt khi merchant cuộn qua ~30 field — sửa màu ở cuối trang
            mà panel đã trôi mất thì 30 field đó lại không kiểm chứng được.

            HAI lớp div, không phải một:
              • lớp ngoài `alignSelf: stretch` — mọi custom element của Polaris trên chuỗi
                cha đều `display: contents`, nên div này CHÍNH LÀ grid item của `s-page`.
                Không ép stretch thì nó co theo nội dung (623px) và sticky hết chỗ dính,
                trôi mất ngay khi cuộn quá chiều cao chính nó.
              • lớp trong mới là `position: sticky`.

            `top: 72` = top bar giả của harness (56px) + khoảng thở.
            Ngoại lệ CSS "storefront preview" — xem `mockup-app/CLAUDE.md` §5. */}
      <div style={{alignSelf: 'stretch'}}>
        <div
          style={{
            position: 'sticky',
            top: 72,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            // Ghim mà cao hơn màn hình thì phần dưới KHÔNG cuộn tới được — ở viewport
            // 560px, card "Lightbox preview" nằm 73px dưới mép và mất hẳn (Stella bắt
            // được: "mất cái Lightbox preview à?"). Cho cột tự cuộn bên trong.
            maxHeight: 'calc(100vh - 88px)',
            overflowY: 'auto',
            // Chừa chỗ cho thanh cuộn, không để nó đè lên viền card
            paddingRight: 4,
          }}
        >
        <s-section heading="Preview">
          <s-stack direction="block" gap="small">
            <TabBar tabs={DEVICES} active={device} onChange={setDevice} />

            {/* Khung thiết bị vẽ đơn giản — merchant cần thấy widget NẰM TRONG cái gì.
                Cùng một carousel 3 cột đọc rất khác nhau trên khung điện thoại và khung
                desktop, mà `Columns on mobile/tablet/desktop` là 3 field riêng. */}
            <DeviceFrame device={device}>
              {/* Format không có khái niệm cột (bong bóng góc · vòng story · feed dọc)
                  thì vẽ ĐÚNG hình dạng của nó, dùng lại `WidgetShape` của trang index.
                  Vẽ 3 cột thẻ cho một Floating bubble là nói dối về sản phẩm. */}
              {!scope.columns ? (
                <WidgetShape
                  templateId={widget.templateId}
                  thumbs={playlist.slice(0, 4).map((video) => thumb(video.id, 120))}
                />
              ) : (
              <s-stack direction="block" gap="small-300">
                {/* div thuần chứ không phải s-grid: `gap` ở đây là SỐ PIXEL merchant tự
                    nhập, còn `s-grid gap` chỉ nhận keyword spacing của Polaris. Cả khối
                    preview này là ngoại lệ CSS có chủ đích — xem comment ở đầu aside. */}
                <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap}}>
                  {Array.from({length: cols}, (_, index) => {
                    const video = playlist[index];
                    return (
                      // Thumbnail của CHÍNH playlist widget này. §9 cấm ảnh stock **ngẫu
                      // nhiên** — lý do thật là ảnh không liên quan làm người review nhìn
                      // nội dung ảnh thay vì layout. Video của chính widget thì ngược lại:
                      // merchant nhận ra nội dung, và thiếu nó thì không thấy được overlay/
                      // title/CTA đọc trên nền video ra sao. Chưa có video → ô xám trơn.
                      <div
                        key={index}
                        style={{
                          aspectRatio: '9 / 16',
                          borderRadius: design.cardRadius,
                          overflow: 'hidden',
                          position: 'relative',
                          // `backgroundColor` chứ KHÔNG phải shorthand `background`:
                          // trộn shorthand với longhand `backgroundImage/Size/Position`
                          // trong cùng một style object làm React warn ra console mỗi lần
                          // rerender (27 lỗi, bắt được lúc verify).
                          backgroundColor: '#d9d9d9',
                          ...(video
                            ? {
                                backgroundImage: `url(${thumb(video.id, 200)})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : {}),
                        }}
                      >
                        {design.productOverlay && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 'auto 0 0 0',
                              padding: 6,
                              background: `linear-gradient(transparent, rgba(0,0,0,${design.overlayStrength}))`,
                            }}
                          >
                            <div
                              style={{
                                color: design.titleColor,
                                fontSize: Math.max(9, design.titleSize - 4),
                                fontWeight: Number(design.titleWeight),
                                lineHeight: 1.2,
                              }}
                            >
                              {video ? video.products[0] ?? 'No product' : 'Product title'}
                            </div>
                            <div
                              style={{
                                marginTop: 4,
                                background: design.ctaBg,
                                color: design.ctaText,
                                borderRadius: design.ctaRadius,
                                fontSize: 8,
                                padding: '2px 6px',
                                display: 'inline-block',
                              }}
                            >
                              Shop now
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {(design.arrows || design.dots) && (
                  <s-stack direction="inline" gap="small-300" alignItems="center" justifyContent="center">
                    {design.arrows && (
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          background: design.arrowBg,
                          border: `1px solid ${design.ink}`,
                          color: design.arrowIcon,
                          fontSize: 10,
                          lineHeight: '16px',
                          textAlign: 'center',
                        }}
                      >
                        ‹
                      </span>
                    )}
                    {design.dots &&
                      [0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            background: design.dotColor,
                            opacity: dot === 0 ? design.activeDotOpacity : 0.3,
                          }}
                        />
                      ))}
                    {design.arrows && (
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          background: design.arrowBg,
                          border: `1px solid ${design.ink}`,
                          color: design.arrowIcon,
                          fontSize: 10,
                          lineHeight: '16px',
                          textAlign: 'center',
                        }}
                      >
                        ›
                      </span>
                    )}
                  </s-stack>
                )}
              </s-stack>
              )}
            </DeviceFrame>

            <s-text color="subdued">
              {playlist.length === 0
                ? 'Placeholders — add videos and your own thumbnails appear here.'
                : 'Approximate. Your theme’s fonts and spacing apply on the real storefront.'}
            </s-text>
          </s-stack>
        </s-section>

        {/* Hiện ở MỌI tab, cùng với preview chính.
            Bản trước tôi giới hạn chỉ tab Design, lý do: app thật hiện nó ở cả 4 sub-tab
            kể cả lúc đang sửa Layout. Nhưng tôi ĐÃ BỎ sub-nav đó → lý do bay mất, mà điều
            kiện thì vẫn còn, nên đứng ở tab Videos thấy card biến mất không hiểu vì sao
            (Stella: "có thấy đâu?").
            Cột phải là "shopper thấy gì" — tách đôi theo tab làm merchant tưởng mất đồ. */}
        {/* Format nào không có lightbox (feed toàn màn hình CHÍNH LÀ viewer) thì cũng
            không có preview lightbox — bỏ section mà giữ preview là tự mâu thuẫn. */}
        {scope.lightbox && (
          <s-section heading="Lightbox preview">
            <s-stack direction="block" gap="small-300">
              <div
                style={{
                  background: design.lightboxPanel,
                  border: `1px solid ${design.lightboxText}`,
                  borderRadius: design.dialogRadius,
                  padding: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span style={{color: design.lightboxText, fontSize: 12}}>Product title</span>
                <span
                  style={{
                    background: design.lightboxCartBg,
                    color: design.lightboxCartText,
                    borderRadius: design.ctaRadius,
                    fontSize: 11,
                    padding: '4px 10px',
                  }}
                >
                  Add to cart
                </span>
              </div>
              <s-text color="subdued">
                {design.popupSize} · {design.openAnimation} ·{' '}
                {design.showProgress ? 'progress on' : 'progress off'} ·{' '}
                {design.showDescription ? 'description on' : 'description off'} ·{' '}
                {design.startMuted ? 'starts muted' : 'starts with sound'}
              </s-text>
            </s-stack>
          </s-section>
        )}
        </div>
      </div>
      </div>

      {/* ══ MODAL: thêm video từ Library ══ */}
      <s-modal id="add-videos" heading="Add videos" accessibilityLabel="Add videos to this widget">
        <s-stack direction="block" gap="small">
          <s-paragraph color="subdued">
            Pick videos from your Library. A video can be in more than one widget.
          </s-paragraph>
          {videos.slice(0, 6).map((video) => (
            <s-checkbox
              key={video.id}
              label={video.title}
              details={
                video.products.length === 0
                  ? 'No product tagged — shoppers cannot buy from this one'
                  : video.products.join(', ')
              }
            />
          ))}
        </s-stack>
        <s-button slot="primary-action" variant="primary" command="--hide" commandFor="add-videos">
          Add to widget
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="add-videos">
          Cancel
        </s-button>
      </s-modal>

      {/* ══ MODAL: gỡ video — nói rõ KHÔNG xoá khỏi Library ══
          App thật chỉ có nút "Remove" trần, không confirm, không nói hậu quả: merchant
          không biết đây là gỡ khỏi widget hay xoá hẳn video. */}
      <s-modal id="remove-video" heading="Remove from widget" accessibilityLabel="Remove video from widget">
        <s-stack direction="block" gap="small">
          <s-paragraph>
            Remove <strong>{target?.title ?? 'this video'}</strong> from{' '}
            {widget.name}?
          </s-paragraph>
          <s-paragraph color="subdued">
            The video stays in your Library and in any other widget it&apos;s in. Shoppers stop
            seeing it here as soon as you save.
          </s-paragraph>
        </s-stack>
        <s-button slot="primary-action" variant="primary" tone="critical" command="--hide" commandFor="remove-video" onClick={removeVideo}>
          Remove from widget
        </s-button>
        <s-button slot="secondary-actions" command="--hide" commandFor="remove-video">
          Cancel
        </s-button>
      </s-modal>
    </s-page>
  );
}

/**
 * Khung thiết bị cho panel Preview — vẽ đơn giản bằng div, không dùng ảnh.
 *
 * Vì sao cần: `Columns on mobile / tablet / desktop` là ba field riêng, nhưng nếu preview
 * chỉ là một ô vuông thì merchant không thấy được 3 cột trên điện thoại chật thế nào so
 * với 3 cột trên desktop. Khung cho ngữ cảnh mà con số không cho được.
 *
 * Thuộc ngoại lệ "storefront preview" của `mockup-app/CLAUDE.md` §5 — CSS thuần, vì không
 * token Polaris nào biểu diễn được khung máy.
 */
function DeviceFrame({device, children}: {device: string; children: React.ReactNode}) {
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';
  const shell: React.CSSProperties = {
    margin: '0 auto',
    background: '#fff',
    border: '2px solid #b5b5b5',
    borderRadius: isMobile ? 20 : isTablet ? 14 : 8,
    // Bề ngang cố ý KHÁC nhau: đó chính là thứ làm số cột đọc ra khác nhau
    maxWidth: isMobile ? 190 : isTablet ? 260 : '100%',
    padding: isMobile ? '18px 8px 14px' : isTablet ? '14px 10px' : 0,
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <s-box background="subdued" borderRadius="base" padding="small">
      <div style={shell}>
        {/* Tai thỏ của điện thoại */}
        {isMobile && (
          <div
            style={{
              position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
              width: 46, height: 5, borderRadius: 999, background: '#d9d9d9',
            }}
          />
        )}
        {/* Thanh trình duyệt của desktop */}
        {!isMobile && !isTablet && (
          <div
            style={{
              display: 'flex', gap: 4, alignItems: 'center',
              padding: '6px 8px', borderBottom: '1px solid #e3e3e3', background: '#f6f6f7',
            }}
          >
            {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
              <span key={color} style={{width: 7, height: 7, borderRadius: 999, background: color}} />
            ))}
          </div>
        )}
        <div style={{padding: isMobile || isTablet ? 0 : 10}}>{children}</div>
        {/* Nút home của điện thoại */}
        {isMobile && (
          <div
            style={{
              margin: '10px auto 0', width: 40, height: 3,
              borderRadius: 999, background: '#d9d9d9',
            }}
          />
        )}
      </div>
    </s-box>
  );
}

function VideoRow({
  video,
  index,
  total,
  readOnly,
  onMove,
  onRemove,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOverRow,
  onDropRow,
}: {
  video: Video;
  index: number;
  total: number;
  readOnly: boolean;
  onMove: (index: number, delta: number) => void;
  onRemove: () => void;
  dragging: boolean;
  dropTarget: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOverRow: () => void;
  onDropRow: () => void;
}) {
  const untagged = video.products.length === 0;

  return (
    // Kéo thả cho chuột. Nút ↑↓ bên phải GIỮ NGUYÊN — kéo thả không dùng được bằng bàn
    // phím, bỏ nút đi là mất a11y (BFS chấm). Hai cách cùng tồn tại là pattern chuẩn.
    // `<div draggable>` chứ không đặt trên `s-box`: custom element không đảm bảo forward
    // thuộc tính `draggable` cho browser.
    <div
      draggable={!readOnly}
      onDragStart={(event) => {
        // Firefox không bắt đầu kéo nếu dataTransfer rỗng
        event.dataTransfer.setData('text/plain', video.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onDragOverRow();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropRow();
      }}
      style={{
        cursor: readOnly ? 'default' : 'grab',
        opacity: dragging ? 0.4 : 1,
        // Vạch chỉ báo chỗ sẽ thả — không có vạch thì kéo xong không biết rơi vào đâu
        boxShadow: dropTarget ? 'inset 0 3px 0 0 #005bd3' : 'none',
        borderRadius: 8,
      }}
    >
    <s-box border="base" borderRadius="base" padding="small">
      <s-stack direction="inline" gap="small" alignItems="center" justifyContent="space-between">
        <s-stack direction="inline" gap="small" alignItems="center">
          {/* Tay cầm: nói cho merchant biết hàng này kéo được. Chỉ trang trí —
              chức năng thật nằm ở `draggable` của cả hàng và ở nút ↑↓. */}
          {!readOnly && (
            /* s-icon KHÔNG nhận nhóm [layout] (§7d) — nó vốn không có a11y surface,
               đúng thứ ta muốn ở đây vì tay cầm chỉ là chỉ báo thị giác */
            <s-icon type="drag-handle" tone="neutral" />
          )}
          <s-image
            src={thumb(video.id, 96)}
            alt={`Thumbnail for ${video.title}`}
            aspectRatio="1/1"
            objectFit="cover"
            loading="lazy"
            borderRadius="base"
            inlineSize="auto"
          />
          <s-stack direction="block" gap="small-500">
            {/* lineClamp chỉ có ở s-paragraph/s-heading, không có ở s-text (§7d) */}
            <s-paragraph lineClamp={1}>
              <strong>{video.title}</strong>
            </s-paragraph>
            {/* Chip `Video` của app bị bỏ: nó trùng badge đã đè trên thumbnail.
                Giữ nguồn + thời gian vì đó là hai thứ phân biệt được các video với nhau. */}
            <s-text color="subdued">
              {video.source} · {video.createdAt} · {video.duration}
            </s-text>
            {untagged ? (
              <s-badge tone="warning">No product tagged</s-badge>
            ) : (
              <s-text color="subdued">
                {video.products.length} {video.products.length === 1 ? 'product' : 'products'}{' '}
                tagged
              </s-text>
            )}
          </s-stack>
        </s-stack>

        <s-stack direction="inline" gap="small-300" alignItems="center">
          {/* Nút icon-only PHẢI có accessibilityLabel, và label phải nói rõ video nào —
              6 nút "Move up" giống hệt nhau thì screen reader không phân biệt được */}
          <s-button
            variant="tertiary"
            icon="chevron-up"
            accessibilityLabel={`Move ${video.title} up`}
            disabled={readOnly || index === 0}
            onClick={() => onMove(index, -1)}
          />
          <s-button
            variant="tertiary"
            icon="chevron-down"
            accessibilityLabel={`Move ${video.title} down`}
            disabled={readOnly || index === total - 1}
            onClick={() => onMove(index, 1)}
          />
          <s-button disabled={readOnly} command="--show" commandFor="remove-video" onClick={onRemove}>
            Remove
          </s-button>
        </s-stack>
      </s-stack>
    </s-box>
    </div>
  );
}
