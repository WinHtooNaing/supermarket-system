import { NextResponse } from "next/server";

import { createSale } from "@/server/pos-data";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sellerId: number;
    paymentAmount: number;
    items: Array<{ productId: number; quantity: number; price: number }>;
  };

  try {
    const sale = await createSale(body);
    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create sale." },
      { status: 400 }
    );
  }
}
