import { NextResponse } from "next/server";
import { getComponentAction, updateComponentAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json({ error: "Component ID is required" }, { status: 400 });
    }
    const component = await getComponentAction(id);
    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }
    return NextResponse.json(component);
  } catch (error) {
    console.error("Failed to get component", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get component";
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code : "";

    if (!code.trim()) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    const updated = await updateComponentAction(id, code);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update component", error);
    const message = error instanceof Error ? error.message : "Failed to update component";
    const status = message === "Component not found" ? 404 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

