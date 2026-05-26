import { NextResponse } from "next/server";

import { categoryNameExists, removeCategory, upsertCategory } from "@/server/pos-data";

export async function POST(request: Request) {
  const body = (await request.json()) as { id?: number; name: string };

  if (await categoryNameExists(body.name, body.id)) {
    return NextResponse.json(
      { message: "This category name already exists." },
      { status: 409 }
    );
  }

  const data = await upsertCategory(body);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id: number };

  try {
    await removeCategory(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete category." },
      { status: 400 }
    );
  }
}
