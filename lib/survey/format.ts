const dateTimeFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  year: "2-digit",
  month: "short",
  day: "numeric",
});

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** "2026-10-29" -> "29 ต.ค. 69" */
export function formatDay(ymd: string): string {
  return dateFmt.format(new Date(`${ymd}T12:00:00+07:00`));
}
