import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

/** Marca pendentes vencidos como expired. Reserva padrão: 15 min. */
export async function expireOldPendings(db: Prisma.TransactionClient | typeof prisma = prisma) {
  const now = new Date();
  await db.appointment.updateMany({
    where: { status: "pending", expiresAt: { lte: now } },
    data: { status: "expired" },
  });
}

export const RESERVATION_MINUTES = 15;

export function reservationDeadline(from = new Date()) {
  return new Date(from.getTime() + RESERVATION_MINUTES * 60 * 1000);
}

/** Status que ainda ocupam horário. */
export function isBlockingStatus(status: string) {
  return status === "pending" || status === "confirmed" || status === "done";
}

/**
 * Serializa criações concorrentes do mesmo estabelecimento/data.
 * PostgreSQL mantém o lock até o fim da transação, evitando double-booking.
 */
export async function lockAppointmentDay(
  tx: Prisma.TransactionClient,
  establishmentId: string,
  date: string
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${establishmentId}:${date}`}, 0))`;
}
