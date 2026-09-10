import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD || "";
  if (!email || !rawPassword || rawPassword.length < 12) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 12 caracteres) antes de executar o seed.");
  }
  const password = await bcrypt.hash(rawPassword, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password,
      name: "Administrador",
    },
  });

  const est = await prisma.establishment.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      name: "Barbearia Classic",
      description:
        "Há mais de 10 anos oferecendo o melhor em cortes masculinos, barba e cuidados. Ambiente moderno e atendimento de qualidade.",
      address: "Rua das Flores, 123 - Centro, São Paulo - SP",
      phone: "(11) 3456-7890",
      whatsapp: "5511999998888",
      instagram: "barbearia.classic",
      openDays: "1,2,3,4,5,6",
      openTime: "09:00",
      closeTime: "19:00",
      primaryColor: "#d4a017",
      pixChargeMode: "half",
      pixChargePercent: 50,
      paymentPolicy: "both",
      bgColor: "#0f0f0f",
      cardColor: "#1a1a1a",
    },
  });

  await prisma.service.deleteMany();
  await prisma.product.deleteMany();

  const services = [
    { name: "Corte Masculino", description: "Corte moderno ou clássico com acabamento.", price: 45, duration: 30 },
    { name: "Barba", description: "Aparar, modelar e hidratar a barba.", price: 35, duration: 25 },
    { name: "Corte + Barba", description: "Combo completo de corte e barba.", price: 70, duration: 50 },
    { name: "Sobrancelha", description: "Design de sobrancelha masculina.", price: 20, duration: 15 },
    { name: "Corte Infantil", description: "Corte especial para crianças.", price: 40, duration: 30 },
  ];

  for (const s of services) {
    await prisma.service.create({ data: { ...s, establishmentId: est.id } });
  }

  const products = [
    { name: "Pomada Modeladora", description: "Fixação forte, acabamento mate.", price: 39.9, stock: 20 },
    { name: "Óleo para Barba", description: "Nutre e hidrata a barba.", price: 59.9, stock: 15 },
    { name: "Shampoo Anticaspa", description: "Limpeza profunda.", price: 49.9, stock: 12 },
    { name: "Perfume Masculino", description: "Fragrância marcante.", price: 89.9, stock: 8 },
  ];

  for (const p of products) {
    await prisma.product.create({ data: { ...p, establishmentId: est.id } });
  }

  console.log(`Seed concluído para ${email}.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
