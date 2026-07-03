import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { Priority, Status } from "@/app/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const status = searchParams.get("status") as Status | null;
    const priority = searchParams.get("priority") as Priority | null;
    const categoryId = searchParams.get("categoryId");
    const sort = searchParams.get("sort"); // dueDate, priority, createdAt

    const where: Record<string, unknown> = {};

    if (status) {
      if (!Object.values(Status).includes(status)) {
        return Response.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }
      where.status = status;
    }

    if (priority) {
      if (!Object.values(Priority).includes(priority)) {
        return Response.json(
          { error: "Invalid priority value" },
          { status: 400 }
        );
      }
      where.priority = priority;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const orderBy: Record<string, string> = {};
    if (sort === "dueDate") {
      orderBy.dueDate = "asc";
    } else if (sort === "priority") {
      orderBy.priority = "desc";
    } else if (sort === "createdAt") {
      orderBy.createdAt = "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      include: { category: true },
    });

    return Response.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return Response.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority, status, dueDate, categoryId } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return Response.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (priority && !Object.values(Priority).includes(priority)) {
      return Response.json(
        { error: "Invalid priority value" },
        { status: 400 }
      );
    }

    if (status && !Object.values(Status).includes(status)) {
      return Response.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    if (categoryId) {
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

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || undefined,
        status: status || undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        categoryId: categoryId || null,
      },
      include: { category: true },
    });

    return Response.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return Response.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
