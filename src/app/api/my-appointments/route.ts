import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOldPendings } from "@/lib/appointments";

function digits(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function GET(req: NextRequest) {
  try {
    await expireOldPendings();
    const phone = req.nextUrl.searchParams.get("phone") || "";
    const d = digits(phone);
    if (d.length < 8) {
      return NextResponse.json(
        { error: "Informe um telefone válido" },
        { status: 400 }
      );
    }

    const all = await prisma.appointment.findMany({
      orderBy: [{ date: "desc" }, { time: "asc" }],
      include: {
        service: { select: { name: true, price: true, duration: true } },
      },
      take: 200,
    });

    const items = all
      .filter((a) => {
        const p = digits(a.clientPhone);
        return p === d || p.endsWith(d) || d.endsWith(p) || p.endsWith(d.slice(-9));
      })
      .slice(0, 20)
      .map((a) => ({
        id: a.id,
        clientName: a.clientName,
        date: a.date,
        time: a.time,
        status: a.status,
        paymentMethod: a.paymentMethod,
        paymentStatus: a.paymentStatus,
        amountDue: a.amountDue,
        hasReceipt: !!a.receiptData,
        rejectReason: a.rejectReason,
        expiresAt: a.expiresAt,
        service: a.service,
      }));

    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}
