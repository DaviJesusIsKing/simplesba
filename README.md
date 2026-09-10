# Barbearia MVP — Instruções completas

Plataforma web para barbearia/salão de beleza: site público, agendamento, PIX com comprovante e painel administrativo.

---

## 1. Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 (App Router), React, TypeScript, Tailwind CSS |
| Backend | API Routes do Next.js |
| Banco | PostgreSQL (Neon) via Prisma ORM |
| Login | NextAuth.js (e-mail + senha) |
| Deploy sugerido | AWS Amplify Hosting + Neon |

---

## 2. Funcionalidades

### Site (cliente)

- Página inicial com nome, descrição, serviços, produtos, endereço, telefone, horários, Instagram
- Tema de cores personalizável (presets + ajuste fino) em header, menu, cards e rodapé
- Agendar horário: serviço → data → horários livres → nome → telefone/WhatsApp
- Opção **pagar na hora** ou **pagar antes (PIX)**
- PIX: QR Code (se cadastrado) + chave com botão copiar
- Envio de comprovante (imagem)
- Página de sucesso com status ao vivo (pendente / confirmado / expirado)
- **Meus horários**: consulta pelo telefone e reenvio de comprovante
- Link WhatsApp para contato

### Regras de agenda

- Bloqueio por **duração** do serviço (ex.: 70 min a partir de 08:00)
- Não agenda em horário já passado (no mesmo dia)
- Dias da semana configuráveis
- Horário padrão + horário especial por dia (ex.: sábado só até 12:00)
- **Horário de almoço** (intervalo sem agenda)
- Reserva de **15 minutos**: se o admin não confirmar a tempo, expira e libera o horário
- Status: pending, confirmed, cancelled, done, expired

### Painel admin (URL secreta)

Caminho atual do painel (não aparece no menu do site; a segurança real é feita pela autenticação):

```text
/p-x7k9qm2
```

Login:

```text
/p-x7k9qm2/login
```

Funções:

- Dashboard (totais e comprovantes para revisar)
- Agendamentos (filtros, status, WhatsApp, alertas sonoros)
- Comprovantes PIX (ver, aprovar, recusar)
- Serviços e produtos (criar, editar, excluir)
- Configurações do estabelecimento, agenda, PIX, tema, produtos on/off
- **Alterar senha**

---

## 3. Estrutura do projeto

```text
barbearia-v2/
├── amplify.yml                 # Build no AWS Amplify
├── package.json
├── prisma/
│   ├── schema.prisma           # Modelos do banco
│   └── seed.ts                 # Dados iniciais + admin
├── src/
│   ├── app/
│   │   ├── page.tsx            # Home
│   │   ├── agendar/            # Formulário de agendamento
│   │   ├── agendamento/sucesso/
│   │   ├── meus-agendamentos/
│   │   ├── p-x7k9qm2/          # Painel admin (URL secreta)
│   │   │   ├── login/
│   │   │   ├── agendamentos/
│   │   │   ├── comprovantes/
│   │   │   ├── servicos/
│   │   │   ├── produtos/
│   │   │   ├── configuracoes/
│   │   │   └── senha/
│   │   └── api/                # APIs (auth, appointments, admin…)
│   ├── components/             # Header, Footer, Providers
│   └── lib/                    # prisma, auth, theme, appointments
└── README.md
```

---

## 4. Configurar o ambiente local

### 4.1 Pré-requisitos

- Node.js 18+ (recomendado 20+)
- Conta no [Neon](https://neon.tech) (PostgreSQL gratuito)
- Conta GitHub (para deploy)

### 4.2 Arquivo `.env`

Na **raiz** do projeto (mesmo nível do `package.json`), crie `.env`:

```env
DATABASE_URL="postgresql://USER:SENHA@HOST/neondb?sslmode=require"
NEXTAUTH_SECRET="troque-por-uma-string-longa-e-aleatoria"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@seudominio.com"
ADMIN_PASSWORD="uma-senha-forte-com-pelo-menos-12-caracteres"
```

Regras:

- Não use `channel_binding=require` na URL (pode quebrar em alguns ambientes)
- Nunca commite o `.env` no GitHub
- `NEXTAUTH_SECRET` em produção deve ser forte e único

### 4.3 Instalar e subir o banco

No terminal, na pasta do projeto:

```bash
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

- Site: http://localhost:3000  
- Painel: http://localhost:3000/p-x7k9qm2/login  

### 4.4 Login definido por variáveis de ambiente (após o seed)

Defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env` antes de executar o seed. A senha precisa ter pelo menos 12 caracteres. O projeto não publica mais credenciais administrativas padrão.

**Para trocar a senha depois:** painel → **Senha**.

### 4.5 Se aparecer erro de coluna / schema

Sempre que o `schema.prisma` mudar:

```bash
npx prisma db push
npx prisma generate
```

Reinicie o `npm run dev` depois de alterar o `.env`.

---

## 5. Deploy no AWS Amplify

### 5.1 GitHub

1. Crie um repositório
2. Envie os arquivos na **raiz** do repo (não dentro de subpasta extra)
3. Confirme que existem na raiz: `package.json`, `prisma/`, `src/`, `amplify.yml`

Exemplo:

```bash
git init
git add .
git commit -m "Barbearia MVP"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

### 5.2 Amplify

1. AWS Amplify → Hosting → conectar o repositório
2. Branch `main`
3. O arquivo `amplify.yml` já define o build (inclui `prisma generate`)

### 5.3 Variáveis de ambiente no Amplify

| Nome | Valor |
|------|--------|
| `DATABASE_URL` | Mesma URL do Neon usada no PC |
| `NEXTAUTH_SECRET` | String secreta forte |
| `NEXTAUTH_URL` | `https://seu-app.amplifyapp.com` (sem `/` no final) |

Salve e faça **Redeploy**.

### 5.4 Banco em produção

O Amplify **não** guarda SQLite. O banco é o **Neon**.

Depois de mudar models no Prisma, rode no PC (com `DATABASE_URL` do Neon no `.env`):

```bash
npx prisma db push
```

Não é necessário rodar `db push` dentro do Amplify se você já sincronizou o Neon pelo PC.

---

## 6. Uso rápido (checklist)

### Admin (primeira vez)

1. Acesse `/p-x7k9qm2/login`
2. Use as credenciais definidas em `ADMIN_EMAIL`/`ADMIN_PASSWORD`
3. **Configurações**: nome, endereço, WhatsApp, dias, horários, almoço
4. Cadastre chave PIX + QR Code (imagem do app do banco)
5. Escolha política de pagamento e se mostra produtos
6. Ajuste cores (preset ou manual) e salve
7. Cadastre serviços (e produtos, se quiser)

### Cliente

1. Home → **Agendar horário**
2. Escolhe serviço, data, hora, dados
3. PIX ou pagar na hora
4. Se PIX: copia chave / lê QR e envia comprovante
5. Se fechou a página: **Meus horários** + telefone → envia de novo

### Admin (rotina)

1. **Ativar alertas** na aba Agendamentos (aba aberta)
2. **Comprovantes** → aprovar ou recusar
3. Confirmar no WhatsApp quando fizer sentido

---

## 7. Segurança

1. A URL do painel pode ser alterada futuramente; não dependa dela como mecanismo de segurança
2. Use senha forte (painel → Senha)
3. Não deixe o painel logado em computador da recepção sem bloqueio
4. `NEXTAUTH_SECRET` diferente em cada ambiente
5. Backup periódico no Neon (export / snapshot conforme o plano)

---

## 8. Limitações conhecidas (MVP)

- Comprovantes, QR e imagens ficam no banco como data URL (tamanho limitado); volume muito alto pede armazenamento de objetos (S3/R2 etc.)
- Alerta sonoro só com a aba do admin aberta (notificação no celular = etapa futura: Telegram / Web Push)
- Um fluxo de agenda (sem vários profissionais por cadeira)
- PIX é manual (chave + comprovante), sem gateway automático
- O lock anti-double-booking usa PostgreSQL advisory locks; portanto o banco de produção precisa ser PostgreSQL

---

## 9. Scripts úteis

```bash
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run start        # rodar build local
npx prisma db push   # sincronizar schema com o Neon
npx prisma generate  # gerar client Prisma
npx tsx prisma/seed.ts   # popular dados iniciais
```

---

## 10. Suporte a problemas comuns

| Problema | O que fazer |
|----------|-------------|
| `Environment variable not found: DATABASE_URL` | Criar/conferir `.env` na raiz e reiniciar o dev server |
| `Column pixKey does not exist` (ou similar) | `npx prisma db push` |
| `Tabela de agendamentos não existe` | `npx prisma db push` |
| Build Amplify falha no Prisma | Garantir `prisma/` no GitHub e `prisma generate` no `amplify.yml` |
| Login admin em produção | `NEXTAUTH_URL` = URL exata do Amplify; `NEXTAUTH_SECRET` definido |
| Página `/admin` 404 | Correto — o painel é `/p-x7k9qm2` |

---

## 11. Licença / uso

Projeto MVP para uso do estabelecimento. Ajuste textos, cores e dados nas configurações do painel.
