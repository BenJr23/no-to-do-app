import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { Priority, Status } from "@/app/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return Response.json(
      { error: "Failed to fetch task" },
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
    const { title, description, priority, status, dueDate, categoryId } = body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return Response.json(
        { error: "Title must be a non-empty string" },
        { status: 400 }
      );
    }

    if (priority !== undefined && !Object.values(Priority).includes(priority)) {
      return Response.json(
        { error: "Invalid priority value" },
        { status: 400 }
      );
    }

    if (status !== undefined && !Object.values(Status).includes(status)) {
      return Response.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    if (categoryId !== undefined && categoryId !== null) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return Response.json(
          { error: "Category not found" },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (priority !== undefined) data.priority = priority;
    if (status !== undefined) data.status = status;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (categoryId !== undefined) data.categoryId = categoryId;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: { category: true },
    });

    return Response.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return Response.json(
      { error: "Failed to update task" },
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

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    return Response.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return Response.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
