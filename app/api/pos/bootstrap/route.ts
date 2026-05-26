import { NextResponse } from "next/server";

import { getPosBootstrapData } from "@/server/pos-data";

export async function GET() {
  const data = await getPosBootstrapData();
  return NextResponse.json(data);
}
