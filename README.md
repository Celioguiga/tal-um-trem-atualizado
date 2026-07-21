# Sistema de Gestão Pedagógica — Escola Waldorf

Sistema web para apoiar o trabalho de professores Waldorf: cadastro de turmas,
alunos, épocas e horários, com planejamento de aulas, registros de notas/faltas/
observações, avaliações, banco de músicas com integração RNFG/Cromus e uma
base de conhecimento pedagógica.

**Status desta entrega:** cadastro base (Turmas, Alunos, Épocas, Horários) e
autenticação. Os demais módulos aparecem no menu como "em breve" — o modelo de
dados já os contempla, faltando construir a interface.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Prisma 7](https://www.prisma.io) + SQLite (via `@prisma/adapter-better-sqlite3`)
- [Auth.js (NextAuth v5)](https://authjs.dev) com login por e-mail/senha

## Configuração local

```bash
npm install
cp .env.example .env
```

Gere um `AUTH_SECRET` e cole no `.env`:

```bash
openssl rand -base64 32
```

Preencha também `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NOME` no `.env` — esse
será o usuário criado pelo seed para o primeiro login.

Crie o banco de dados e o usuário administrador:

```bash
npx prisma migrate dev
npx prisma db seed
```

Rode o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e entre com o e-mail e
senha definidos em `ADMIN_PASSWORD`.

## Modelo de dados

O schema (`prisma/schema.prisma`) cobre todo o sistema planejado:

- **Cadastro:** `Turma`, `Aluno`, `Epoca`, `Horario`
- **Planejamento e conhecimento:** `PlanoDeAula`, `ConhecimentoArtigo`
- **Registros:** `Falta`, `Nota`, `Observacao`, `Avaliacao`
- **Repertório musical:** `Musica` (com campos para notação Cromus, LilyPond e PDF gerado — pensado para integrar com a skill `cromus-partitura`)

## Roteiro (próximos módulos)

1. Planejamento de aula + base de conhecimento Waldorf
2. Lançamento de notas, faltas e observações
3. Avaliações
4. Banco de músicas com geração de partitura RNFG
