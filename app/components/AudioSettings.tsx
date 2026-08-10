import {RangeSlider} from './primitives';
import {actors, voiceDefaults, voiceSliders} from '../data/sample';
import type {Actor} from '../data/sample';

export type VoiceSettings = {clarity: number; tone: number; emotion: number; speed: number};

/**
 * Audio settings — bốn slider chỉnh giọng cho một actor.
 *
 * ═══ VÌ SAO MODAL, KHÔNG PHẢI PANEL PHẢI NHƯ PLATFORM ═══
 * Platform mở panel cố định ở cạnh phải (screenshot 11). Trong `s-page` thì chỗ đó là
 * `slot="aside"`, mà aside đã bị `CreditMeter` chiếm — và credit là thứ merchant cần
 * nhìn thấy TRONG LÚC chỉnh giọng, vì mỗi lần "Generate voice" là một lần tiêu credit.
 * Đá CreditMeter đi để nhét panel giọng vào là đổi cái quan trọng lấy cái phụ.
 *
 * Modal cũng đúng nhịp làm việc hơn: chỉnh giọng là một việc rời, làm xong thì đóng —
 * không phải thứ cần nhìn suốt lúc soạn video.
 *
 * ═══ PLAN GATE ═══
 * Bốn slider này khoá ở Free (đề xuất, xem plan). Khoá thì KHÔNG ẩn: merchant phải thấy
 * mình đang bỏ lỡ cái gì, và lý do là text hiện sẵn chứ không phải tooltip — tooltip
 * không mở được trên control `disabled` (`MAKEUGC-UI-PATTERNS.md` §7a).
 */
/** Chữ cái đầu cho `s-avatar` — cố ý KHÔNG dùng ảnh mặt giả */
function initialsOf(name: string) {
  return name
    .replace(/\(.*\)/, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function AudioSettings({
  actorId,
  value,
  voiceId,
  locked = false,
  onChange,
  onVoiceChange,
}: {
  actorId: string | null;
  value: VoiceSettings;
  /** Giọng có thể KHÁC actor — platform cho chọn voice-over riêng khỏi mặt */
  voiceId: string;
  locked?: boolean;
  onChange: (next: VoiceSettings) => void;
  onVoiceChange: (voiceId: string) => void;
}) {
  const actor: Actor | undefined = actors.find((item) => item.id === actorId);
  const readyActors = actors.filter((item) => item.status === 'ready');
  const isDefault = voiceSliders.every((slider) => value[slider.key] === voiceDefaults[slider.key]);

  return (
    <s-modal id="audio-settings" heading="Audio settings" accessibilityLabel="Audio settings">
      <s-stack direction="block" gap="base">
        {actor && (
          <s-stack direction="inline" gap="small-200" alignItems="center">
            {/* initials chứ không phải ảnh: ảnh stock ngẫu nhiên dán nhãn tên người
                là nói dối về thứ đang xem (`CLAUDE.md` §9) */}
            <s-avatar initials={initialsOf(actor.name)} alt="" size="large" />
            <s-stack direction="block" gap="small-500">
              <s-text type="strong">{actor.name}</s-text>
              {/* Platform hiện player 00:00 / 00:00 ở đây. Trong mockup không có audio
                  thật nên chỉ để nút — dựng thanh tua giả là nói dối về thứ chưa có. */}
              <s-button variant="tertiary" icon="play">
                Preview current voice
              </s-button>
            </s-stack>
          </s-stack>
        )}

        {/* Giọng tách khỏi mặt: merchant có thể muốn mặt của actor này nhưng giọng của
            actor khác. Platform để select riêng nên giữ nguyên. */}
        <s-select
          label="Voice-over"
          value={voiceId}
          disabled={locked}
          onChange={(event) => onVoiceChange(event.currentTarget.value)}
          details="The voice can be different from the face on screen."
        >
          {readyActors.map((item) => (
            <s-option key={item.id} value={item.id}>
              {item.name}
            </s-option>
          ))}
        </s-select>

        {locked && (
          <s-banner tone="info" heading="Voice tuning is on Growth and above">
            <s-paragraph>
              Your plan uses the default voice settings. Upgrade to adjust clarity, tone, emotion
              and speed.
            </s-paragraph>
            <s-button slot="secondary-actions" href="/app/billing">
              Compare plans
            </s-button>
          </s-banner>
        )}

        <s-stack direction="block" gap="small">
          {voiceSliders.map((slider) => (
            <RangeSlider
              key={slider.key}
              label={slider.label}
              value={value[slider.key]}
              min={slider.min}
              max={slider.max}
              step={slider.step}
              displayValue={slider.format(value[slider.key])}
              disabled={locked}
              onChange={(next) => onChange({...value, [slider.key]: next})}
            />
          ))}
        </s-stack>

        {/* Reset chỉ bấm được khi có gì để reset — nút luôn sáng mà không làm gì
            là nút hỏng. */}
        <s-button
          variant="tertiary"
          disabled={locked || isDefault}
          onClick={() => onChange({...voiceDefaults})}
        >
          Reset to default
        </s-button>
        {isDefault && !locked && (
          <s-text color="subdued">Already using the default settings.</s-text>
        )}
      </s-stack>

      {/* "Generate voice" TIÊU CREDIT — platform để nó là primary của panel này.
          Nói giá ngay trên nhãn, đừng để merchant phát hiện sau khi bấm. */}
      <s-button
        slot="primary-action"
        variant="primary"
        disabled={locked}
        command="--hide"
        commandFor="audio-settings"
      >
        Generate voice preview
      </s-button>
      <s-button slot="secondary-actions" command="--hide" commandFor="audio-settings">
        Close
      </s-button>
    </s-modal>
  );
}
