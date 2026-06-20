import { NextResponse } from "next/server";
import { getCalendar } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json({ meetings: getCalendar() });
}
