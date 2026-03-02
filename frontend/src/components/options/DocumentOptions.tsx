import type { ConversionOptions, DocumentOptions as DOpts } from "../../types";
import { Field, Row, Select, Toggle, NumberInput } from "./Controls";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  value: ConversionOptions;
  onChange: (o: ConversionOptions) => void;
  targetFormat: string;
}

const opts = (v: ConversionOptions) => v as DOpts;
const upd =
  (v: ConversionOptions, onChange: (o: ConversionOptions) => void) =>
  (patch: Partial<DOpts>) =>
    onChange({ ...opts(v), ...patch });

export default function DocumentOptions({ value, onChange, targetFormat }: Props) {
  const o = opts(value);
  const set = upd(value, onChange);
  const isPdf = targetFormat === "pdf";

  return (
    <div className="space-y-4 pt-2">
      {isPdf && (
        <>
          <Row>
            <Field label="Paper size">
              <Select
                value={o.paper_size ?? "A4"}
                onChange={(v) => set({ paper_size: v })}
                options={[
                  { value: "A4", label: "A4" },
                  { value: "Letter", label: "Letter" },
                  { value: "Legal", label: "Legal" },
                  { value: "A3", label: "A3" },
                ]}
              />
            </Field>
            <Field label="Font">
              <Select
                value={o.font_name ?? "Helvetica"}
                onChange={(v) => set({ font_name: v })}
                options={[
                  { value: "Helvetica", label: "Helvetica" },
                  { value: "Times-Roman", label: "Times New Roman" },
                  { value: "Courier", label: "Courier" },
                ]}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Font size">
              <NumberInput
                min={6}
                max={72}
                value={o.font_size ?? 12}
                onChange={(v) => set({ font_size: v ? parseInt(v) : 12 })}
              />
            </Field>
            <Field label="Margins (mm)">
              <NumberInput
                min={0}
                max={100}
                placeholder="20"
                value={o.margin_top ?? ""}
                onChange={(v) => {
                  const m = v ? parseInt(v) : undefined;
                  set({ margin_top: m, margin_bottom: m, margin_left: m, margin_right: m });
                }}
              />
            </Field>
          </Row>

          <Toggle
            label="Include table of contents"
            checked={o.include_toc ?? false}
            onChange={(v) => set({ include_toc: v })}
          />

          <Toggle
            label="Encrypt PDF with password"
            checked={o.encrypt_pdf ?? false}
            onChange={(v) => set({ encrypt_pdf: v, pdf_password: v ? o.pdf_password : undefined })}
          />

          <AnimatePresence>
            {o.encrypt_pdf && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Field label="PDF password">
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={o.pdf_password ?? ""}
                    onChange={(e) => set({ pdf_password: e.target.value || undefined })}
                    className="input-field"
                  />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
