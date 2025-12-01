import { NextResponse } from "next/server";
import { createComponentAction, listComponentsAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const components = await listComponentsAction();
    return NextResponse.json({ components });
  } catch (error) {
    console.error("Failed to list components", error);
    return NextResponse.json(
      { error: "Failed to list components" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code : "";

    if (!code.trim()) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    const record = await createComponentAction(code);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Failed to create component", error);
    const message = error instanceof Error ? error.message : "Failed to create component";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

