import { NextResponse } from "next/server";

import { removeUser, upsertUser, userIdExists } from "@/server/pos-data";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id?: number;
    userId: string;
    password: string;
    name: string;
    role: "admin" | "seller";
  };

  if (await userIdExists(body.userId, body.id)) {
    return NextResponse.json(
      { message: "This user ID is already in use." },
      { status: 409 }
    );
  }

  const data = await upsertUser(body);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id: number };

  try {
    await removeUser(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete user." },
      { status: 400 }
    );
  }
}
