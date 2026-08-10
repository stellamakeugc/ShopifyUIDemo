import {createContext, useEffect, useState} from 'react';
import {matchPath, Routes, Route, useNavigate, useLocation} from 'react-router-dom';

import AdminChrome from './components/AdminChrome';
import GlobalJobProgress from './components/GlobalJobProgress';
import {HarnessPrdContext} from './components/StateSwitcher';
import {HARNESS_ONLY_NAV, MOCKUPS, NAV_ITEMS} from './registry';
import MockupIndex from './routes/_index';

/**
 * HARNESS shell — KHÔNG phải app thật.
 *
 * ⚠️ Nav bên trái của app embedded do **App Bridge render NGOÀI iframe** (element
 * `<ui-nav-menu>` trong app thật), không phải `<Frame><Navigation>` bên trong page.
 * Web components không có `s-frame` / `s-navigation` — đúng như vậy, không phải thiếu.
 *
 * Từ 06 Aug 2026 harness bọc mockup trong `AdminChrome`: top bar + sidebar 240px giả
 * của Shopify. Lý do: review ở full-width cho cảm giác SAI về diện tích — layout 2 cột
 * (main + aside) trông thoải mái ở 1440px nhưng chật hẳn khi mất 240px cho sidebar.
 * Nav của app nằm trong sidebar đó, đúng như App Bridge làm.
 */
/**
 * HARNESS — công tắc "Simulate running AI job" của top bar, chia sẻ xuống route.
 *
 * Vì sao cần: công tắc sống ở Shell, còn card job chi tiết sống trong Home và phụ thuộc
 * StateSwitcher RIÊNG của Home. Hai thứ độc lập nên bật công tắc rồi bấm "View progress"
 * là rơi vào Home ở state mặc định — **không có tiến trình nào cả**, nút trông như hỏng.
 *
 * ⚠️ KHÔNG có trong app thật: ở đó job state đọc từ loader của layout route
 * `app/routes/app.tsx` + poll, không phải từ một công tắc review.
 */
export const HarnessJobContext = createContext(false);

export default function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const built = new Set<string>(['/', ...MOCKUPS.map((mockup) => mockup.path)]);
  /**
   * Công tắc của HARNESS để review chỉ báo job toàn cục.
   * Trong app thật không có công tắc nào — job state đọc từ loader của layout route
   * `app/routes/app.tsx` + poll. Xem `components/GlobalJobProgress.tsx`.
   */
  const [simulateJob, setSimulateJob] = useState(false);

  /**
   * HARNESS — bắt click trên link nội bộ và điều hướng bằng React Router.
   *
   * Vì sao cần: `s-link` và `s-button href` render ra `<a href>` **native trong shadow
   * DOM**, nên browser tự điều hướng và nạp lại CẢ trang. Hệ quả: mỗi cú bấm reset sạch
   * state đang review (state nào đang chọn, tab nào, đã cuộn tới đâu) — nhìn như app lỗi.
   * Built for Shopify cũng reject full-page reload (`mockup-app/CLAUDE.md` §11).
   *
   * ⚠️ Trong app THẬT không cần đoạn này: ở đó dùng `<Link>` của React Router hoặc
   * `shopify.intents.navigate()` của App Bridge. Đây là miếng vá của harness để mockup
   * cư xử đúng như app sẽ cư xử.
   */
  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Bấm giữ phím bổ trợ = merchant cố ý mở tab mới → để browser lo
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button !== 0) return;
      // `composedPath` vì href nằm trên custom element / trong shadow root
      const target = event
        .composedPath()
        .find((node): node is HTMLElement => node instanceof HTMLElement && node.hasAttribute('href'));
      if (!target) return;
      const href = target.getAttribute('href');
      // Chỉ nhận đường dẫn nội bộ. Bỏ qua `#…` (placeholder như #theme-editor),
      // link ngoài, và link cố ý mở tab mới.
      if (!href || !href.startsWith('/') || target.getAttribute('target') === '_blank') return;
      event.preventDefault();
      navigate(href);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);
  // Home có card chi tiết (`JobProgress`) rồi → không hiện thêm banner gọn ở đó,
  // hai cái cùng lúc là nói một chuyện hai lần.
  const showGlobalJob = simulateJob && location.pathname !== '/app';

  /**
   * Mockup nào đang mở — để cấp link PRD xuống `StateSwitcher` của trang đó.
   *
   * Dùng `matchPath` chứ không so chuỗi: `/app/library/v-1` phải khớp `alsoMatch` của
   * Library detail, không thì mở trang qua link động là mất link PRD.
   */
  const currentMockup = MOCKUPS.find(
    (mockup) =>
      matchPath(mockup.path, location.pathname) !== null ||
      (mockup.alsoMatch ?? []).some(
        (pattern) => matchPath(pattern, location.pathname) !== null,
      ),
  );

  return (
    <HarnessJobContext.Provider value={simulateJob}>
    <AdminChrome
      appNav={NAV_ITEMS.filter((item) => built.has(item.path))}
      harnessNav={HARNESS_ONLY_NAV.filter((item) => built.has(item.path))}
      currentPath={location.pathname}
      onNavigate={navigate}
      simulateJob={simulateJob}
      onToggleSimulateJob={() => setSimulateJob((on) => !on)}
    >
      {/* ── Chỉ báo job toàn cục ──
          Trong app thật đây là phần của layout route `app/routes/app.tsx`, không phải
          của harness shell. Đặt ở đây vì harness không có layout route lồng nhau. */}
      {showGlobalJob && (
        <s-box padding="small-100">
          {/* Banner này render NGOÀI `s-page` nên không ăn ràng buộc bề ngang của page:
              ở cửa sổ 1440 nó rộng 1145px trong khi nội dung page chỉ 966px — thừa ~90px
              mỗi bên, đọc ra như một khối lạc khỏi trang (Stella bắt được).

              `s-page` giới hạn nội dung ở 966px rồi căn giữa, nên áp đúng ràng buộc đó.
              Ở cửa sổ hẹp (<1030px) thì chưa chạm trần, div co theo và vẫn khớp.

              ⚠️ HARNESS ONLY: trong app thật banner này thuộc layout route
              `app/routes/app.tsx`, nằm TRONG page nên tự khớp, không cần đoạn này. */}
          {/* `paddingInline: 4` + `boxSizing: border-box`, `maxWidth` cộng thêm đúng 8px:
              ở cửa sổ hẹp `s-box padding="small-100"` không thực sự tạo padding, banner
              vẫn thừa 4px mỗi bên. Cách này khớp ở CẢ hai đầu — đo ở 1440 và 1120. */}
          <div style={{maxWidth: 974, paddingInline: 4, boxSizing: 'border-box', margin: '0 auto'}}>
            <GlobalJobProgress done={3} total={5} etaLabel="~2 min left" href="/app" />
          </div>
        </s-box>
      )}

      <HarnessPrdContext.Provider value={currentMockup?.prdUrl ?? null}>
      <Routes>
        <Route path="/" element={<MockupIndex />} />
        {MOCKUPS.map(({path, Component}) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
        {/* Path phụ (`/app/library/:id`) — có để link động từ Home không rơi vào
            catch-all. Không hiện trên index page vì link `:id` bấm vào là chết. */}
        {MOCKUPS.flatMap(({alsoMatch, Component}) =>
          (alsoMatch ?? []).map((pattern) => (
            <Route key={pattern} path={pattern} element={<Component />} />
          )),
        )}
        <Route path="*" element={<MockupIndex />} />
      </Routes>
      </HarnessPrdContext.Provider>
    </AdminChrome>
    </HarnessJobContext.Provider>
  );
}
