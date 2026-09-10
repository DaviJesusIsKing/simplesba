import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireOldPendings } from "@/lib/appointments";
import { appointmentAccessToken } from "@/lib/security";

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

    let all = await prisma.appointment.findMany({
      where: { clientPhoneDigits: d },
      orderBy: [{ date: "desc" }, { time: "asc" }],
      include: { service: { select: { name: true, price: true, duration: true } } },
      take: 50,
    });

    // Compatibilidade com registros antigos criados antes de clientPhoneDigits.
    if (all.length === 0) {
      const legacy = await prisma.appointment.findMany({
        where: { clientPhone: { contains: d.slice(-8) } },
        orderBy: [{ date: "desc" }, { time: "asc" }],
        include: { service: { select: { name: true, price: true, duration: true } } },
        take: 200,
      });
      all = legacy.filter((a) => a.clientPhone.replace(/\D/g, "") === d).slice(0, 50);
    }

    const items = all.map((a) => ({
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
      accessToken: appointmentAccessToken(a.id, a.clientPhone),
      service: a.service,
    }));

    return NextResponse.json({ items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}
