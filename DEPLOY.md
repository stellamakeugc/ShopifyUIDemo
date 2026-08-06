# Deploy mockup — GitLab → Vercel

Repo đã `git init` + commit sẵn (branch `main`). Build production đã verify chạy được.

**Luồng chốt 06 Aug 2026 (Stella):** code ở **GitLab**, Vercel **auto-deploy mỗi lần push**.

---

## ⚠️ Đọc trước: mockup này KHÔNG nên để public

Nội dung trong mockup **chưa được công bố**, và một phần **chưa được BOD duyệt**:

| Cái gì | Ở đâu |
|---|---|
| Bảng giá 4 plan + feature matrix đầy đủ | `app.billing.tsx`, `sample.ts` → `PLANS` / `PLAN_FEATURES` |
| ⚠️ Giá lấy từ Notion *Tactic 2 · Pricing proposal*, mà chính Notion ghi *"Ready for review — numbers are placeholders"* | như trên |
| Scoping post-MVP (Analytics chưa build, credit top-up, annual billing) | `app.analytics.tsx`, `app.billing.tsx` |
| ~25 câu hỏi chưa chốt với dev, nhiều câu là mâu thuẫn trong chính app | index page (`_index.tsx`) → `open[]` từng route |
| Ghi chú nội bộ tiếng Việt ("đề xuất — chưa chốt", "chờ Duong") | hầu hết file |
| Tên đối thủ (Reelfy, Triple Whale, Okendo/Yotpo) | `sample.ts`, `app.settings.tsx` |

Đã có sẵn lớp **tối thiểu**: `X-Robots-Tag: noindex` + `public/robots.txt`. **Đây không phải bảo mật** — ai có URL vẫn xem được, và URL `*.vercel.app` là đoán/quét được.

→ **Bật Deployment Protection ngay sau khi deploy** (mục 3).

---

## 1. Push lên GitLab

Repo root là chính thư mục `mockup-app/` — **cố ý không phải cả `makeugc/`**: thư mục cha chứa Notion mirror, roadmap, app listing, docs setup Slack. Dev không cần chúng để implement UI, và đẩy lên là mở rộng vùng lộ không có lý do.

```bash
cd ~/Desktop/makeugc/mockup-app

git remote add origin <URL_GITLAB_PROJECT>
git push -u origin main
```

Tạo project trên GitLab thì để **rỗng** (không tick "Initialize repository with a README") — có commit sẵn là push bị từ chối vì lịch sử khác nhau.

---

## 2. Nối Vercel với GitLab

> 🛑 **Kiểm trước khi làm:** Vercel git integration nối được **gitlab.com**. Nếu GitLab của Avada là **self-hosted** thì bản Hobby/Pro nhiều khả năng **không nối được** — lúc đó dùng mục 2b.

1. https://vercel.com/new → **Import Git Repository** → chọn GitLab → authorize
2. Chọn project vừa push
3. **Root Directory**: để `./` (repo root chính là `mockup-app`)
4. Framework / Build / Output: **không sửa gì** — `vercel.json` đã khai đủ
5. Deploy

Từ đó mỗi `git push` lên `main` là tự deploy production; push branch khác ra preview URL riêng.

⚠️ **Có sẵn một project tên `mockup-app`** trong team `make-ugc1` (id `prj_UTymAfNzflaUcRzYWTPlhO6ZGJQO`) — tôi tạo nhầm khi thử deploy bằng CLI, lần đó **fail** vì `vercel.json` còn key comment. Hoặc nối GitLab vào chính project đó (Settings → Git), hoặc xoá đi rồi import mới. Đừng để hai project cùng trỏ một repo.

### 2b. Nếu GitLab là self-hosted

Hai đường:

- **CLI thủ công:** `npm run deploy` (CLI đã login sẵn `stella-6953`). Mỗi lần đổi phải chạy lại.
- **GitLab CI:** thêm `.gitlab-ci.yml` gọi `npx vercel deploy --prod --token=$VERCEL_TOKEN`, token để ở CI/CD Variables. Giữ được auto-deploy.

---

## 3. Khoá lại — làm ngay sau khi deploy

Vercel dashboard → project → **Settings → Deployment Protection**

| Tuỳ chọn | Ai xem được | Gói |
|---|---|---|
| **Vercel Authentication** | chỉ người trong Vercel team (phải login Vercel) | có trên Hobby |
| **Password Protection** | ai có password | cần Pro |

**Gợi ý:** bật **Vercel Authentication** rồi invite Duong vào team — miễn phí, không phải nhớ password.

---

## 4. Cấu hình — vì sao từng dòng có ở đó

`vercel.json` **không cho phép key comment** (`additionalProperties: false` trong schema). Bản trước có `"//rewrites"` và `"//headers"` để giải thích, và deploy **fail** đúng vì thế:

```
Error: Invalid vercel.json - should NOT have additional property `//rewrites`
```

Nên phần giải thích để ở đây:

| Khoá | Vì sao |
|---|---|
| `rewrites: /(.*) → /index.html` | **BẮT BUỘC.** App là SPA client-side routing. Thiếu dòng này thì mở thẳng `/app/billing` hoặc F5 trên trang con sẽ **404** — Vercel đi tìm file không tồn tại. Vercel serve file tĩnh trong `dist/` trước nên asset không bị rewrite |
| `headers: X-Robots-Tag noindex…` | Chặn search engine index. Lớp **tối thiểu**, không phải bảo mật — xem cảnh báo đầu file |
| `framework: vite` · `outputDirectory: dist` | Vercel tự nhận ra, khai rõ cho khỏi phụ thuộc auto-detect |

`public/robots.txt` → `Disallow: /`

**Lưu ý build:** `polaris.js` + `app-bridge.js` nạp từ CDN Shopify (xem `index.html`), **không** nằm trong bundle. Nên:

- Bundle 689 KB JS (gzip 235 KB), phần lớn là `polaris-viz` cho chart Analytics
- Component luôn là bản mới nhất Shopify serve → **UI đổi được mà không cần deploy lại**. Mặt trái: Shopify đổi breaking thì mockup đổi theo — chạy `npm run typecheck` định kỳ
- **Cần internet để render.** Mất mạng là trang trắng

---

## 5. Gửi dev — dán nguyên đoạn này

> **Mockup admin MakeUGC** — 10 route, Polaris **web components** (`<s-*>`), **không phải** Polaris React.
>
> - Trang chủ mockup liệt kê từng route + **câu hỏi chưa chốt** của route đó. Đọc mục đó trước khi implement — nhiều câu là **mâu thuẫn trong chính app hiện tại**, không phải ý kiến thẩm mỹ.
> - Mỗi trang có **state switcher** ở đầu để xem từng state (empty · loading · quota-blocked · async job · no-permission…), kèm panel *"rule hiển thị"* ghi luật của state đó.
> - `StateSwitcher` và `AdminChrome` là **harness — xoá khi copy route sang app thật**. Nav thật do App Bridge render ngoài iframe.
> - `npm run typecheck` phải sạch: nó check JSX với type chính thức của Shopify và đã bắt được thật (`s-modal` không có prop `open`, `details` của `s-choice` là slot, `s-table-cell` không nhận prop layout…).
> - Trang **Analytics** cố ý đánh dấu **post-MVP** — không phải scope launch.
>
> Ba chặn cần trả lời sớm nhất vì chúng đổi cả data model:
>
> 1. **`s-table` không có row selection / bulk actions** — đang tự dựng `SelectAllBar`. Làm cách nào ở app thật?
> 2. **Gate theo plan chưa có số thật** — `PLANS[].widgetLimit` và `widgetTemplates[].minPlan` là đề xuất, và hai nguồn này đang **mâu thuẫn với Notion Pricing proposal**. Phải chốt một nguồn.
> 3. **Repo thật đang là Remix hay React Router v7?** Ảnh hưởng tên file route và signature loader/action.
