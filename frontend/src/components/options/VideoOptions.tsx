import type { ConversionOptions, VideoOptions as VOpts } from "../../types";
import { Field, Row, Select, Toggle } from "./Controls";

interface Props {
  value: ConversionOptions;
  onChange: (o: ConversionOptions) => void;
  targetFormat: string;
}

const opts = (v: ConversionOptions) => v as VOpts;
const upd =
  (v: ConversionOptions, onChange: (o: ConversionOptions) => void) =>
  (patch: Partial<VOpts>) =>
    onChange({ ...opts(v), ...patch });

export default function VideoOptions({ value, onChange, targetFormat }: Props) {
  const o = opts(value);
  const set = upd(value, onChange);
  const isAudioOut = ["mp3", "ogg", "aac", "flac", "wav"].includes(targetFormat);

  return (
    <div className="space-y-4 pt-2">
      {!isAudioOut && (
        <>
          <Row>
            <Field label="Resolution">
              <Select
                value={o.resolution ?? ""}
                onChange={(v) => set({ resolution: v || undefined })}
                options={[
                  { value: "", label: "Original" },
                  { value: "3840x2160", label: "4K (2160p)" },
                  { value: "1920x1080", label: "1080p" },
                  { value: "1280x720", label: "720p" },
                  { value: "854x480", label: "480p" },
                  { value: "640x360", label: "360p" },
                ]}
              />
            </Field>
            <Field label="FPS">
              <Select
                value={String(o.fps ?? "")}
                onChange={(v) => set({ fps: v ? parseInt(v) : undefined })}
                options={[
                  { value: "", label: "Original" },
                  { value: "24", label: "24 fps" },
                  { value: "30", label: "30 fps" },
                  { value: "60", label: "60 fps" },
                ]}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Video bitrate">
              <Select
                value={o.video_bitrate ?? ""}
                onChange={(v) => set({ video_bitrate: v || undefined })}
                options={[
                  { value: "", label: "Auto" },
                  { value: "500k", label: "500 kbps" },
                  { value: "1000k", label: "1 Mbps" },
                  { value: "2500k", label: "2.5 Mbps" },
                  { value: "5000k", label: "5 Mbps" },
                  { value: "8000k", label: "8 Mbps" },
                ]}
              />
            </Field>
            <Field label="Rotation">
              <Select
                value={String(o.rotation ?? 0)}
                onChange={(v) => set({ rotation: parseInt(v) })}
                options={[
                  { value: "0", label: "None" },
                  { value: "90", label: "90°" },
                  { value: "180", label: "180°" },
                  { value: "270", label: "270°" },
                ]}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Codec">
              <Select
                value={o.codec ?? ""}
                onChange={(v) => set({ codec: v || undefined })}
                options={[
                  { value: "", label: "Auto" },
                  { value: "libx264", label: "H.264" },
                  { value: "libx265", label: "H.265 / HEVC" },
                  { value: "libvpx-vp9", label: "VP9" },
                ]}
              />
            </Field>
            <Field label="Preset">
              <Select
                value={o.preset ?? "medium"}
                onChange={(v) => set({ preset: v })}
                options={[
                  { value: "ultrafast", label: "Ultra fast" },
                  { value: "fast", label: "Fast" },
                  { value: "medium", label: "Medium" },
                  { value: "slow", label: "Slow (best)" },
                ]}
              />
            </Field>
          </Row>

          <Toggle
            label="Mute audio track"
            checked={o.mute ?? false}
            onChange={(v) => set({ mute: v })}
          />
        </>
      )}

      <Field label="Audio bitrate">
        <Select
          value={o.audio_bitrate ?? ""}
          onChange={(v) => set({ audio_bitrate: v || undefined })}
          options={[
            { value: "", label: "Auto" },
            { value: "96k", label: "96 kbps" },
            { value: "128k", label: "128 kbps" },
            { value: "192k", label: "192 kbps" },
            { value: "256k", label: "256 kbps" },
          ]}
        />
      </Field>

      <Row>
        <Field label="Start (sec)">
          <input
            type="number"
            min={0}
            step={0.1}
            placeholder="0"
            value={o.start_sec ?? ""}
            onChange={(e) =>
              set({ start_sec: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            className="input-field"
          />
        </Field>
        <Field label="End (sec)">
          <input
            type="number"
            min={0}
            step={0.1}
            placeholder="end"
            value={o.end_sec ?? ""}
            onChange={(e) =>
              set({ end_sec: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            className="input-field"
          />
        </Field>
      </Row>
    </div>
  );
}
