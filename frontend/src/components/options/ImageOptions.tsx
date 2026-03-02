import type { ConversionOptions, ImageOptions as IOpts } from "../../types";
import { Field, Row, Select, Slider, Toggle, NumberInput } from "./Controls";

interface Props {
  value: ConversionOptions;
  onChange: (o: ConversionOptions) => void;
}

const opts = (v: ConversionOptions) => v as IOpts;
const set =
  (v: ConversionOptions, onChange: (o: ConversionOptions) => void) =>
  (patch: Partial<IOpts>) =>
    onChange({ ...opts(v), ...patch });

export default function ImageOptions({ value, onChange }: Props) {
  const o = opts(value);
  const upd = set(value, onChange);

  return (
    <div className="space-y-4 pt-2">
      <Slider
        label="Quality"
        min={1}
        max={100}
        value={o.quality ?? 95}
        onChange={(q) => upd({ quality: q })}
        unit="%"
      />

      <Row>
        <Field label="Width (px)">
          <NumberInput
            min={1}
            placeholder="auto"
            value={(o.resize as [number, number])?.[0] ?? ""}
            onChange={(v) => {
              const w = v ? parseInt(v) : undefined;
              const cur = Array.isArray(o.resize)
                ? (o.resize as [number, number])
                : [undefined, undefined];
              upd({ resize: w !== undefined ? [w, cur[1] ?? 0] : undefined });
            }}
          />
        </Field>
        <Field label="Height (px)">
          <NumberInput
            min={1}
            placeholder="auto"
            value={(o.resize as [number, number])?.[1] ?? ""}
            onChange={(v) => {
              const h = v ? parseInt(v) : undefined;
              const cur = Array.isArray(o.resize)
                ? (o.resize as [number, number])
                : [undefined, undefined];
              upd({ resize: h !== undefined ? [cur[0] ?? 0, h] : undefined });
            }}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Rotation">
          <Select
            value={String(o.rotate ?? 0)}
            onChange={(v) => upd({ rotate: parseInt(v) })}
            options={[
              { value: "0", label: "None" },
              { value: "90", label: "90°" },
              { value: "180", label: "180°" },
              { value: "270", label: "270°" },
            ]}
          />
        </Field>
        <Field label="Flip">
          <Select
            value={o.flip ?? ""}
            onChange={(v) => upd({ flip: v as IOpts["flip"] })}
            options={[
              { value: "", label: "None" },
              { value: "horizontal", label: "Horizontal" },
              { value: "vertical", label: "Vertical" },
            ]}
          />
        </Field>
      </Row>

      <Field label="Filter">
        <Select
          value={o.filter ?? ""}
          onChange={(v) => upd({ filter: v || undefined })}
          options={[
            { value: "", label: "None" },
            { value: "blur", label: "Blur" },
            { value: "sharpen", label: "Sharpen" },
            { value: "grayscale", label: "Grayscale" },
            { value: "contour", label: "Contour" },
            { value: "detail", label: "Detail" },
            { value: "edge_enhance", label: "Edge Enhance" },
            { value: "emboss", label: "Emboss" },
          ]}
        />
      </Field>
    </div>
  );
}
