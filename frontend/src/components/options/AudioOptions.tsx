import type { ConversionOptions, AudioOptions as AOpts } from "../../types";
import { Field, Row, Select, Slider, Toggle, NumberInput } from "./Controls";

interface Props {
  value: ConversionOptions;
  onChange: (o: ConversionOptions) => void;
}

const opts = (v: ConversionOptions) => v as AOpts;
const upd =
  (v: ConversionOptions, onChange: (o: ConversionOptions) => void) =>
  (patch: Partial<AOpts>) =>
    onChange({ ...opts(v), ...patch });

export default function AudioOptions({ value, onChange }: Props) {
  const o = opts(value);
  const set = upd(value, onChange);

  return (
    <div className="space-y-4 pt-2">
      <Row>
        <Field label="Bitrate">
          <Select
            value={o.bitrate ?? ""}
            onChange={(v) => set({ bitrate: v || undefined })}
            options={[
              { value: "", label: "Auto" },
              { value: "64k", label: "64 kbps" },
              { value: "128k", label: "128 kbps" },
              { value: "192k", label: "192 kbps" },
              { value: "256k", label: "256 kbps" },
              { value: "320k", label: "320 kbps" },
            ]}
          />
        </Field>
        <Field label="Sample rate">
          <Select
            value={String(o.sample_rate ?? "")}
            onChange={(v) => set({ sample_rate: v ? parseInt(v) : undefined })}
            options={[
              { value: "", label: "Auto" },
              { value: "8000", label: "8 kHz" },
              { value: "22050", label: "22 kHz" },
              { value: "44100", label: "44.1 kHz" },
              { value: "48000", label: "48 kHz" },
            ]}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Channels">
          <Select
            value={String(o.channels ?? "")}
            onChange={(v) => set({ channels: v ? parseInt(v) : undefined })}
            options={[
              { value: "", label: "Auto" },
              { value: "1", label: "Mono" },
              { value: "2", label: "Stereo" },
            ]}
          />
        </Field>
        <Field label="Volume (dB)">
          <NumberInput
            step={0.5}
            placeholder="0"
            value={o.volume_db ?? ""}
            onChange={(v) =>
              set({ volume_db: v ? parseFloat(v) : undefined })
            }
          />
        </Field>
      </Row>

      <Toggle
        label="Normalize audio"
        checked={o.normalize ?? false}
        onChange={(v) => set({ normalize: v })}
      />

      <Row>
        <Field label="Start (ms)">
          <NumberInput
            min={0}
            placeholder="0"
            value={o.start_ms ?? ""}
            onChange={(v) =>
              set({ start_ms: v ? parseInt(v) : undefined })
            }
          />
        </Field>
        <Field label="End (ms)">
          <NumberInput
            min={0}
            placeholder="end"
            value={o.end_ms ?? ""}
            onChange={(v) =>
              set({ end_ms: v ? parseInt(v) : undefined })
            }
          />
        </Field>
      </Row>
    </div>
  );
}
