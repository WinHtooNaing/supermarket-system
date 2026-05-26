import { NextResponse } from "next/server";

import { barcodeExists, removeProduct, upsertProduct } from "@/server/pos-data";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id?: number;
    name: string;
    price: number;
    stock: number;
    barcode: string;
    categoryId: number;
    reorderLevel?: number;
  };

  if (await barcodeExists(body.barcode, body.id)) {
    return NextResponse.json(
      { message: "This barcode is already used by another product." },
      { status: 409 }
    );
  }

  const data = await upsertProduct(body);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id: number };
  await removeProduct(body.id);
  return NextResponse.json({ ok: true });
}
