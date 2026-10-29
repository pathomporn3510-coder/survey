/**
 * Rate limit แบบ in-memory (sliding window) ต่อ IP
 * หมายเหตุ: บน Serverless แต่ละ instance มีหน่วยความจำแยกกัน จึงเป็นชั้นป้องกันเบื้องต้น
 * ชั้นป้องกันหลักอยู่ที่ trigger survey_responses_rate_limit ในฐานข้อมูล
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);

  // ทำความสะอาดเป็นครั้งคราว
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
