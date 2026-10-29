"use client";

import { Star } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { RATING_LABELS } from "@/lib/survey/questions";

type Props = {
  /** คะแนนที่เลือก (1–5) หรือ null ถ้ายังไม่เลือก */
  value: number | null;
  onChange: (value: number) => void;
  onBlur?: () => void;
  /** id ของข้อความคำถาม ใช้เป็นชื่อกลุ่มสำหรับ Screen Reader */
  labelledBy: string;
  invalid?: boolean;
  errorId?: string;
  disabled?: boolean;
};

const LEVELS = [1, 2, 3, 4, 5] as const;

/**
 * ให้คะแนนแบบ 5 ดาว (Reusable)
 * - รองรับเมาส์ / จอสัมผัส / คีย์บอร์ด (ลูกศร, Home, End, ตัวเลข 1–5)
 * - ใช้ ARIA radiogroup ให้ Screen Reader อ่านเป็น "x จาก 5 ดาว — ระดับ"
 */
export function RatingStars({
  value,
  onChange,
  onBlur,
  labelledBy,
  invalid,
  errorId,
  disabled,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const descId = useId();
  const display = hover ?? value ?? 0;

  const select = (n: number) => {
    if (disabled) return;
    onChange(n);
    refs.current[n - 1]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = value ?? 0;
    let next: number | null = null;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = Math.min(5, current + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = Math.max(1, current - 1 || 1);
        break;
      case "Home":
        next = 1;
        break;
      case "End":
        next = 5;
        break;
      default:
        if (/^[1-5]$/.test(e.key)) next = Number(e.key);
    }
    if (next !== null) {
      e.preventDefault();
      select(next);
    }
  };

  // roving tabindex: Tab เข้ามาที่ดาวที่เลือกอยู่ (หรือดาวแรกถ้ายังไม่เลือก)
  const tabStop = value ?? 1;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-describedby={[descId, invalid && errorId ? errorId : null].filter(Boolean).join(" ")}
        aria-invalid={invalid || undefined}
        aria-required
        onKeyDown={onKeyDown}
        onMouseLeave={() => setHover(null)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onBlur?.();
        }}
        className={`inline-flex items-center gap-1 rounded-xl p-1 ${
          invalid ? "bg-red-50 ring-1 ring-red-300" : ""
        }`}
      >
        {LEVELS.map((n) => {
          const active = n <= display;
          const checked = value === n;
          return (
            <button
              key={n}
              ref={(el) => {
                refs.current[n - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${n} ดาว — ${RATING_LABELS[n]}`}
              tabIndex={n === tabStop ? 0 : -1}
              disabled={disabled}
              onClick={() => select(n)}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(null)}
              className="group rounded-lg p-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed sm:p-1"
            >
              <Star
                aria-hidden
                strokeWidth={1.75}
                className={`h-9 w-9 transition-transform duration-100 group-hover:scale-110 group-active:scale-95 sm:h-8 sm:w-8 ${
                  active
                    ? "fill-amber-400 text-amber-500"
                    : "fill-transparent text-slate-300 group-hover:text-amber-300"
                }`}
              />
            </button>
          );
        })}
      </div>
      <span
        id={descId}
        aria-live="polite"
        className={`min-w-[7.5rem] rounded-full px-3 py-1 text-sm font-medium ${
          value
            ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
            : hover
              ? "text-slate-500"
              : "text-slate-400"
        }`}
      >
        {value
          ? `${value}/5 · ${RATING_LABELS[value as 1 | 2 | 3 | 4 | 5]}`
          : hover
            ? `${hover}/5 · ${RATING_LABELS[hover as 1 | 2 | 3 | 4 | 5]}`
            : "ยังไม่ได้เลือก"}
      </span>
    </div>
  );
}
