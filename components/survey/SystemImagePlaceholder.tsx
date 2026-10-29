import Image from "next/image";
import { ImageIcon, Maximize2 } from "lucide-react";
import type { SectionImage } from "@/lib/config/survey-config";

type Props = {
  image: SectionImage;
  /** ข้อความเมื่อยังไม่มีรูป */
  placeholderText?: string;
  priority?: boolean;
  className?: string;
};

/**
 * Component กลางสำหรับรูปภาพประกอบแต่ละส่วน
 * - มีรูป: แสดงด้วย next/image (Responsive, รักษาอัตราส่วน)
 * - ไม่มีรูป: แสดง Placeholder
 */
export function SystemImagePlaceholder({
  image,
  placeholderText = "รอเพิ่มรูปภาพระบบ",
  priority,
  className = "",
}: Props) {
  const ratio = image.aspectRatio ?? 16 / 9;

  if (image.src) {
    return (
      <a
        href={image.src}
        target="_blank"
        rel="noopener noreferrer"
        title="คลิกเพื่อดูภาพขนาดเต็ม"
        className={`group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-contain transition-transform duration-300 group-hover:scale-[1.01]"
        />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-slate-900/70 px-2 py-1 text-xs text-white">
          <Maximize2 className="h-3 w-3" aria-hidden />
          ดูภาพเต็ม
        </span>
      </a>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${image.alt} (${placeholderText})`}
      className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-sky-50 to-white text-slate-400 ${className}`}
      style={{ aspectRatio: ratio, maxHeight: 220 }}
    >
      <ImageIcon className="h-9 w-9 text-blue-300" aria-hidden />
      <span className="text-sm font-medium">{placeholderText}</span>
    </div>
  );
}
