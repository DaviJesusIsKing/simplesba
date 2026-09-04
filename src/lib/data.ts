import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getEstablishment = cache(async () => {
  try {
    return await prisma.establishment.findFirst();
  } catch {
    return null;
  }
});

export const getActiveServices = cache(async () => {
  try {
    return await prisma.service.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        imageData: true,
      },
    });
  } catch {
    return [];
  }
});

export const getActiveProducts = cache(async () => {
  try {
    return await prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageData: true,
      },
    });
  } catch {
    return [];
  }
});
