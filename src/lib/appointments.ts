import { prisma } from "./prisma";

/** Marca pendentes vencidos como expired. Reserva padrão: 15 min. */
export async function expireOldPendings() {
  const now = new Date();
  await prisma.appointment.updateMany({
    where: {
      status: "pending",
      expiresAt: { lte: now },
    },
    data: { status: "expired" },
  });
}

export const RESERVATION_MINUTES = 15;

export function reservationDeadline(from = new Date()) {
  return new Date(from.getTime() + RESERVATION_MINUTES * 60 * 1000);
}

/** Status que ainda ocupam horário */
export function isBlockingStatus(status: string) {
  return status === "pending" || status === "confirmed" || status === "done";
}
