import { NextResponse } from "next/server";
import { getDailyBrief } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json(getDailyBrief());
}
