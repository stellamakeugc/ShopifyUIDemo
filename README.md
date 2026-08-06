# MakeUGC — admin UI mockups

Mockup giao diện cho **Shopify embedded admin** của MakeUGC. Mục đích: dev **copy-paste từng route** sang app Remix / React Router thật, không phải để deploy làm sản phẩm.

```bash
npm install
npm run typecheck   # PHẢI 0 error — đây là gate, không phải tuỳ chọn
npm run dev         # → localhost:3100
```

---

## Đọc theo thứ tự này

| File | Nội dung |
|---|---|
| Trang chủ mockup (`/`) | Danh sách route + **câu hỏi chưa chốt của từng route**. Đọc trước khi implement |
| [CLAUDE.md](CLAUDE.md) | Quy tắc code: khác biệt Polaris web components vs React, component tự dựng, ngoại lệ CSS |
| [DEPLOY.md](DEPLOY.md) | Deploy GitLab → Vercel, và cảnh báo nội dung chưa public |

---

## Ba thứ dễ hiểu nhầm nhất

**1. Polaris WEB COMPONENTS, không phải Polaris React.**
`<s-page>`, `<s-section>`, `<s-button>`… nạp qua CDN Shopify (xem `index.html`), **không cài npm**. Vì vậy `package.json` không có `@shopify/polaris` — đúng như vậy, không phải thiếu.

**2. `npm run typecheck` là bằng chứng, không phải formality.**
Nó check JSX với type chính thức của Shopify và đã bắt được thật: `s-modal` không có prop `open` · `details` của `s-choice` là slot chứ không phải prop · `s-table-cell` không nhận prop layout · `s-heading` không có prop size.

**3. `StateSwitcher` và `AdminChrome` là harness — XOÁ khi copy route đi.**
`StateSwitcher` là dropdown chọn state để review (empty · loading · quota-blocked · async job · no-permission…), kèm panel *"rule hiển thị"* ghi luật của state đó. `AdminChrome` là khung admin giả của Shopify; app thật thì nav do App Bridge render **ngoài iframe**.

---

## Cấu trúc

```
app/
├── routes/          10 route — tên file theo convention flat-routes để copy sang
│                    app thật là đúng chỗ (app.library._index.tsx, app.library.$id.tsx…)
├── components/      component tự dựng vì web components chưa có
│                    (ProgressBar, EmptyState, TabBar, SelectAllBar, CreditMeter…)
├── data/sample.ts   toàn bộ sample data — KHÔNG nhồi vào route
└── registry.tsx     thêm route mới chỉ sửa file này
```

Sample data cố ý **đầy một trang (20+ row)** và cố ý có **video chưa tag product** — mockup 3 row che hết vấn đề layout, còn video không tag product là lỗi im lặng tệ nhất của app này.

---

## ⚠️ Nội dung chưa public

Repo chứa bảng giá chưa chốt (lấy từ Notion *Tactic 2 · Pricing proposal*, mà chính Notion ghi *"numbers are placeholders"*), scoping post-MVP, và ~25 câu hỏi chưa chốt. **Đừng để URL demo ra ngoài team** — xem [DEPLOY.md](DEPLOY.md).
