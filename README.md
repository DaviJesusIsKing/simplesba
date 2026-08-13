# Barbearia Classic (versão simples)

Site de barbearia com:
- Página inicial (serviços, produtos, endereço, WhatsApp)
- Admin para gerenciar serviços, produtos e dados do estabelecimento

## Rodar local

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Abra http://localhost:3000

**Admin:** http://localhost:3000/admin  
**Login:** admin@barbearia.com / admin123

## Observação sobre deploy

SQLite funciona bem no PC. Em hospedagem serverless (Amplify/Vercel) o arquivo do banco não persiste. Para produção use PostgreSQL (Neon/Supabase) e altere o `provider` no `prisma/schema.prisma`.
