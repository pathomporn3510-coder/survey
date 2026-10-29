import { redirect } from "next/navigation";

/** หน้าแรกพาไปที่แบบประเมินทันที */
export default function Home() {
  redirect("/survey");
}
