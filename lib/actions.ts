"use server";

import { createComponent, getComponent, updateComponent, listComponents } from "./component-store";
import { revalidatePath } from "next/cache";

export type ComponentRecord = {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

export async function createComponentAction(code: string): Promise<ComponentRecord> {
  if (!code.trim()) {
    throw new Error("Code is required");
  }

  try {
    const record = await createComponent(code);
    revalidatePath("/editor");
    revalidatePath("/");
    return record;
  } catch (error) {
    console.error("Failed to create component", error);
    throw new Error("Failed to create component");
  }
}

export async function getComponentAction(id: string): Promise<ComponentRecord | null> {
  try {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid component ID");
    }
    return await getComponent(id);
  } catch (error) {
    console.error("Failed to get component", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get component");
  }
}

export async function updateComponentAction(
  id: string,
  code: string
): Promise<ComponentRecord> {
  if (!code.trim()) {
    throw new Error("Code is required");
  }

  try {
    const updated = await updateComponent(id, code);
    if (!updated) {
      throw new Error("Component not found");
    }
    revalidatePath("/editor");
    revalidatePath("/");
    return updated;
  } catch (error) {
    console.error("Failed to update component", error);
    if (error instanceof Error && error.message === "Component not found") {
      throw error;
    }
    throw new Error("Failed to update component");
  }
}

export async function listComponentsAction(): Promise<ComponentRecord[]> {
  try {
    return await listComponents();
  } catch (error) {
    console.error("Failed to list components", error);
    throw new Error("Failed to list components");
  }
}

