import { prisma } from "./prisma";

export type ComponentRecord = {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

export async function listComponents(): Promise<ComponentRecord[]> {
  const components = await prisma.component.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return components.map((c: { id: string; code: string; createdAt: Date; updatedAt: Date }) => ({
    id: c.id,
    code: c.code,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function getComponent(id: string): Promise<ComponentRecord | null> {
  const component = await prisma.component.findUnique({
    where: { id },
  });
  if (!component) return null;
  return {
    id: component.id,
    code: component.code,
    createdAt: component.createdAt.toISOString(),
    updatedAt: component.updatedAt.toISOString(),
  };
}

export async function createComponent(code: string): Promise<ComponentRecord> {
  const component = await prisma.component.create({
    data: { code },
  });
  return {
    id: component.id,
    code: component.code,
    createdAt: component.createdAt.toISOString(),
    updatedAt: component.updatedAt.toISOString(),
  };
}

export async function updateComponent(
  id: string,
  code: string
): Promise<ComponentRecord | null> {
  try {
    const component = await prisma.component.update({
      where: { id },
      data: { code },
    });
    return {
      id: component.id,
      code: component.code,
      createdAt: component.createdAt.toISOString(),
      updatedAt: component.updatedAt.toISOString(),
    };
  } catch (error) {
    return null;
  }
}

