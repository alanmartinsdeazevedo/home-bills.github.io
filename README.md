# Home Bills — Controle Financeiro Pessoal

Aplicação web para controle financeiro pessoal, desenvolvida com Next.js 16, TypeScript, Tailwind CSS v4 e Supabase.

## Funcionalidades

- **Painel Mensal**: Visualize cartões de crédito, contas fixas e receitas do mês com controle de pagamento
- **Dashboard**: Resumo financeiro com gráfico de fluxo de caixa dos últimos 6 meses
- **Lançamentos**: Cadastro de receitas e despesas com suporte a parcelamento
- **Parcelas**: Projeção anual de parcelas por cartão
- **A Receber**: Controle de valores a receber de terceiros
- **Cartões**: Gerenciamento de cartões de crédito
- **Contas Fixas**: Gerenciamento de contas fixas mensais

## Tecnologias

- [Next.js 16](https://nextjs.org/) — Framework React com export estático
- [TypeScript](https://www.typescriptlang.org/) — Tipagem estática
- [Tailwind CSS v4](https://tailwindcss.com/) — Estilização utilitária
- [Supabase](https://supabase.com/) — Backend, autenticação e banco de dados PostgreSQL
- [Recharts](https://recharts.org/) — Gráficos
- [Lucide React](https://lucide.dev/) — Ícones

## Configuração Local

### Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com/)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/home-bills.git
cd home-bills
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Configure o Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Cole e execute o conteúdo do arquivo `schema.sql`
4. Isso criará todas as tabelas, políticas RLS e índices necessários

### 5. Execute o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Deploy no GitHub Pages

### Configuração do repositório

1. Vá em **Settings → Pages** do repositório
2. Em **Source**, selecione **GitHub Actions**

### Secrets e variáveis necessárias

Vá em **Settings → Secrets and variables → Actions**:

**Secrets** (Repository secrets):
- `NEXT_PUBLIC_SUPABASE_URL` — URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Chave anônima do Supabase

**Variables** (Repository variables, opcional):
- `NEXT_PUBLIC_BASE_PATH` — Sub-caminho do GitHub Pages (ex: `/home-bills` se o repositório não for `usuario.github.io`). Deixe vazio para domínio customizado.

### Deploy automático

O deploy acontece automaticamente ao fazer push para a branch `main`. Acompanhe em **Actions**.

## Estrutura do Projeto

```
src/
├── app/
│   ├── dashboard/     # Página de dashboard com gráficos
│   ├── painel/        # Painel mensal (cartões, contas, receitas)
│   ├── lancamentos/   # Lista de lançamentos do mês
│   ├── mais/          # Parcelas, recebíveis, cartões, contas fixas
│   ├── login/         # Autenticação
│   ├── globals.css    # Estilos globais (Tailwind v4)
│   ├── layout.tsx     # Layout raiz
│   └── page.tsx       # Rota raiz (redireciona)
├── components/        # Componentes reutilizáveis
├── hooks/             # React hooks (auth, transactions, etc.)
└── lib/               # Utilitários (supabase, types, seed)
schema.sql             # Schema completo do banco de dados
```

## Primeiro Acesso

1. Acesse a aplicação e crie uma conta
2. O sistema automaticamente cadastrará:
   - 33 categorias pré-definidas (23 despesas + 10 receitas)
   - 6 cartões de crédito comuns (Carrefour, Santander, Nubank, Assaí, Hiper, Sams Club)
3. Acesse **Mais → Contas Fixas** para cadastrar suas contas fixas
4. Comece a lançar suas receitas e despesas

## Licença

Uso pessoal.
