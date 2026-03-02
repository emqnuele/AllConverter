export default function SeoContent() {
  const categories = [
    {
      title: "Image Converter",
      formats: ["PNG", "JPG", "JPEG", "AVIF", "WebP", "GIF", "BMP", "TIFF", "HEIC", "ICO", "SVG"],
      description: "Convert images between all major formats. Turn HEIC photos from iPhone to JPG, compress images to WebP or AVIF for the web, or batch-convert entire photo collections.",
    },
    {
      title: "Audio Converter",
      formats: ["MP3", "WAV", "FLAC", "AAC", "OGG", "M4A", "AIFF", "OPUS", "WMA"],
      description: "Convert audio files between lossless and lossy formats. Convert FLAC to MP3, WAV to AAC, or extract audio from video.",
    },
    {
      title: "Video Converter",
      formats: ["MP4", "MKV", "AVI", "MOV", "WebM", "FLV", "WMV", "3GP", "TS"],
      description: "Convert video to any format online. Change MP4 to MKV, convert MOV to MP4 for compatibility, or create WebM videos for the web.",
    },
    {
      title: "Document Converter",
      formats: ["PDF", "DOCX", "DOC", "TXT", "ODT", "RTF", "EPUB", "HTML", "MD"],
      description: "Convert documents between popular formats. Turn DOCX files into PDF, convert markdown to HTML, or export documents for any platform.",
    },
  ];

  const faqs = [
    {
      q: "Is AllConverter free to use?",
      a: "Yes, AllConverter is completely free. No account, no subscription and no watermarks.",
    },
    {
      q: "Are my files kept private?",
      a: "Files are processed on the server and automatically deleted after the conversion session ends. They are never shared or stored permanently.",
    },
    {
      q: "What is the maximum file size?",
      a: "AllConverter supports files up to 300 MB per upload.",
    },
    {
      q: "Can I convert multiple files at once?",
      a: "Yes. You can drag and drop multiple files and convert them all to the same output format in one go.",
    },
    {
      q: "Do I need to install any software?",
      a: "No. AllConverter runs entirely in your browser. No download or installation required.",
    },
  ];

  return (
    <section aria-label="Supported formats and FAQ" className="mt-16 space-y-14">

      {/* Format categories */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-6 text-center">
          Supported File Formats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <article
              key={cat.title}
              className="rounded-2xl border border-border/50 dark:border-white/[0.07] bg-card/50 dark:bg-white/[0.02] p-4 space-y-2"
            >
              <h3 className="text-sm font-semibold text-foreground">{cat.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {cat.formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-muted/60 dark:bg-white/[0.05] text-muted-foreground"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-border/50 dark:border-white/[0.07] bg-card/50 dark:bg-white/[0.02] px-4 py-3 cursor-pointer"
            >
              <summary className="text-sm font-medium text-foreground list-none flex items-center justify-between gap-2 select-none">
                {faq.q}
                <span className="text-muted-foreground text-base transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>

    </section>
  );
}
