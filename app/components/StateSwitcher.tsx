import {createContext, Fragment, useContext, useState} from 'react';
import type {ReactNode} from 'react';

/**
 * REVIEW TOOL — link PRD của trang đang mở, do `Shell.tsx` cấp theo URL.
 *
 * Vì sao qua context chứ không phải prop: 13 route đều gọi `StateSwitcher` và không
 * route nào biết mình là entry nào trong registry. Shell thì biết (nó có
 * `location.pathname`) → nó tra registry một lần, mọi trang tự có link.
 *
 * Context nằm ở ĐÂY chứ không ở `Shell.tsx` để tránh vòng import: StateSwitcher không
 * import gì từ Shell, còn Shell vốn đã import components.
 */
export const HarnessPrdContext = createContext<string | null>(null);

/**
 * REVIEW TOOL — không phải phần của app thật. Dev xoá khi copy route đi.
 *
 * Cho Stella/Duong xem từng state mà không cần đổi code hay giả lập data.
 *
 * `doc` là **rule hiển thị** của state đang chọn, để dev đọc mà không phải dò code.
 * Cố ý thu gọn mặc định: mở sẵn thì nó chiếm hết màn hình và đẩy chính cái UI cần
 * review xuống dưới. Chỉ ghi rule KHÔNG tự hiện rõ trên trang — cái gì nhìn là thấy
 * thì đừng viết lại.
 */
export interface StateDocRow {
  /** Section của trang mà rule này áp dụng */
  section: string;
  /** Một câu, chỉ rule — không mô tả lại cái đang hiện */
  rule: string;
}

export interface StateOption {
  value: string;
  label: string;
  doc?: StateDocRow[];
}

export default function StateSwitcher({
  state,
  onChange,
  states,
  globalNote,
}: {
  state: string;
  onChange: (value: string) => void;
  states: StateOption[];
  /** Note áp cho MỌI state của trang (ví dụ: scope data chưa được Shopify approve) */
  globalNote?: ReactNode;
}) {
  const [docOpen, setDocOpen] = useState(false);
  const prdUrl = useContext(HarnessPrdContext);
  const current = states.find((option) => option.value === state);
  const hasDoc = Boolean(current?.doc?.length || globalNote);

  return (
    <s-box background="subdued" borderRadius="base" border="base" padding="base">
      <s-stack direction="block" gap="small">
        <s-stack direction="inline" gap="base" alignItems="center">
          <strong>Review tool — state</strong>
          <s-select
            label="State"
            labelAccessibilityVisibility="exclusive"
            value={state}
            onChange={(event) => onChange(event.currentTarget.value)}
          >
            {states.map((option) => (
              <s-option key={option.value} value={option.value}>
                {option.label}
              </s-option>
            ))}
          </s-select>
          <s-text color="subdued">Không có trong app thật — xoá khi copy vào app.</s-text>
        </s-stack>

        {/* Link PRD ở ĐÂY, không chỉ ở index page: dev mở thẳng trang để review thì
            không đi qua index, và câu hỏi ngay sau "trang này trông thế nào" luôn là
            "trang này có những tính năng gì".
            `target="_blank"` → handler client-side của Shell cố ý bỏ qua, nên bấm vào
            không reset state đang review. */}
        {prdUrl && (
          <s-stack direction="inline" gap="small-300" alignItems="center">
            <s-icon type="note" tone="neutral" size="small" />
            <s-link href={prdUrl} target="_blank">
              PRD — danh sách tính năng của trang này
            </s-link>
          </s-stack>
        )}

        {hasDoc && (
          <s-stack direction="block" gap="small-200" alignItems="start">
            <s-button
              variant="tertiary"
              icon={docOpen ? 'chevron-up' : 'chevron-down'}
              onClick={() => setDocOpen((open) => !open)}
            >
              {docOpen ? 'Ẩn rule hiển thị' : 'Rule hiển thị của state này'}
            </s-button>

            {docOpen && (
              <s-box background="base" borderRadius="base" padding="base">
                <s-stack direction="block" gap="small">
                  {current?.doc?.length ? (
                    <s-grid
                      gap="small-200"
                      gridTemplateColumns="minmax(110px, max-content) minmax(0, 1fr)"
                    >
                      {current.doc.map((row, index) => (
                        // Fragment giữ 2 ô là 2 grid item riêng — bọc bằng div là
                        // vỡ grid 2 cột.
                        // Key có index: một state được phép có nhiều rule cùng section.
                        <Fragment key={`${row.section}-${index}`}>
                          <strong>{row.section}</strong>
                          <s-text color="subdued">{row.rule}</s-text>
                        </Fragment>
                      ))}
                    </s-grid>
                  ) : null}

                  {globalNote && (
                    <>
                      <s-divider />
                      {globalNote}
                    </>
                  )}
                </s-stack>
              </s-box>
            )}
          </s-stack>
        )}
      </s-stack>
    </s-box>
  );
}
