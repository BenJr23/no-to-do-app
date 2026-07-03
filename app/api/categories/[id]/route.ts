import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    return Response.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return Response.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return Response.json(
        { error: "Name must be a non-empty string" },
        { status: 400 }
      );
    }

    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name: name.trim() },
      });
      if (duplicate) {
        return Response.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (color !== undefined) data.color = color;

    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return Response.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return Response.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    await prisma.category.delete({ where: { id } });

    return Response.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return Response.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
