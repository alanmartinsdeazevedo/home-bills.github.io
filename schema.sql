-- ============================================================
-- Home Bills — Schema do Banco de Dados Supabase
-- ============================================================
-- Execute este script no SQL Editor do Supabase para criar
-- todas as tabelas, políticas RLS e índices necessários.
-- ============================================================

-- ─── TIPOS ENUMERADOS ────────────────────────────────────────

CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TYPE payment_method AS ENUM (
  'carrefour',
  'assai',
  'nubank',
  'hiper',
  'santander',
  'sams',
  'pix',
  'dinheiro',
  'boleto',
  'debito',
  'outro'
);

-- ─── TABELA: credit_cards ────────────────────────────────────
-- Armazena os cartões de crédito do usuário

CREATE TABLE credit_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  fechamento_dia   INTEGER NOT NULL CHECK (fechamento_dia BETWEEN 1 AND 31),
  vencimento_dia   INTEGER NOT NULL CHECK (vencimento_dia BETWEEN 1 AND 31),
  color            TEXT NOT NULL DEFAULT '#2563eb',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABELA: categories ──────────────────────────────────────
-- Categorias de receitas e despesas

CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#64748b',
  icon       TEXT NOT NULL DEFAULT '📦',
  type       transaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABELA: transactions ────────────────────────────────────
-- Lançamentos financeiros (receitas e despesas)

CREATE TABLE transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                  transaction_type NOT NULL,
  amount                NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  description           TEXT NOT NULL,
  date                  DATE NOT NULL,
  payment_method        payment_method NOT NULL DEFAULT 'outro',
  credit_card_id        UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  is_installment        BOOLEAN NOT NULL DEFAULT false,
  installment_current   INTEGER CHECK (installment_current > 0),
  installment_total     INTEGER CHECK (installment_total > 0),
  installment_group_id  UUID,
  is_paid               BOOLEAN NOT NULL DEFAULT false,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── TABELA: fixed_bills ─────────────────────────────────────
-- Contas fixas mensais (água, energia, internet, etc.)

CREATE TABLE fixed_bills (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  amount               NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  due_day              INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  category_id          UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_installment       BOOLEAN NOT NULL DEFAULT false,
  installment_current  INTEGER,
  installment_total    INTEGER,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABELA: fixed_bill_payments ─────────────────────────────
-- Controle de pagamento mensal das contas fixas

CREATE TABLE fixed_bill_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fixed_bill_id  UUID NOT NULL REFERENCES fixed_bills(id) ON DELETE CASCADE,
  month          INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year           INTEGER NOT NULL CHECK (year >= 2020),
  is_paid        BOOLEAN NOT NULL DEFAULT false,
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fixed_bill_id, month, year)
);

-- ─── TABELA: card_bill_payments ──────────────────────────────
-- Controle de pagamento mensal das faturas dos cartões

CREATE TABLE card_bill_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id  UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INTEGER NOT NULL CHECK (year >= 2020),
  is_paid         BOOLEAN NOT NULL DEFAULT false,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (credit_card_id, month, year)
);

-- ─── TABELA: receivables ─────────────────────────────────────
-- Valores a receber de terceiros

CREATE TABLE receivables (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description          TEXT NOT NULL,
  person               TEXT NOT NULL,
  amount               NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_date             DATE,
  is_received          BOOLEAN NOT NULL DEFAULT false,
  installment_current  INTEGER,
  installment_total    INTEGER,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ÍNDICES ─────────────────────────────────────────────────

-- Transactions
CREATE INDEX idx_transactions_user_id    ON transactions(user_id);
CREATE INDEX idx_transactions_date       ON transactions(date);
CREATE INDEX idx_transactions_type       ON transactions(type);
CREATE INDEX idx_transactions_card       ON transactions(credit_card_id);
CREATE INDEX idx_transactions_category   ON transactions(category_id);
CREATE INDEX idx_transactions_group      ON transactions(installment_group_id);
CREATE INDEX idx_transactions_user_date  ON transactions(user_id, date);

-- Credit cards
CREATE INDEX idx_credit_cards_user_id    ON credit_cards(user_id);

-- Categories
CREATE INDEX idx_categories_user_id      ON categories(user_id);
CREATE INDEX idx_categories_type         ON categories(type);

-- Fixed bills
CREATE INDEX idx_fixed_bills_user_id     ON fixed_bills(user_id);
CREATE INDEX idx_fixed_bills_active      ON fixed_bills(user_id, is_active);

-- Payments
CREATE INDEX idx_fixed_bill_payments_user  ON fixed_bill_payments(user_id, month, year);
CREATE INDEX idx_card_bill_payments_user   ON card_bill_payments(user_id, month, year);

-- Receivables
CREATE INDEX idx_receivables_user_id       ON receivables(user_id);
CREATE INDEX idx_receivables_received      ON receivables(user_id, is_received);

-- ─── RLS (ROW LEVEL SECURITY) ────────────────────────────────
-- Habilitar RLS em todas as tabelas

ALTER TABLE credit_cards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_bills          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_bill_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_bill_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables          ENABLE ROW LEVEL SECURITY;

-- ─── POLÍTICAS RLS: credit_cards ─────────────────────────────

CREATE POLICY "Usuário vê seus próprios cartões"
  ON credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria seus próprios cartões"
  ON credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seus próprios cartões"
  ON credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário deleta seus próprios cartões"
  ON credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- ─── POLÍTICAS RLS: categories ───────────────────────────────

CREATE POLICY "Usuário vê suas próprias categorias"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria suas próprias categorias"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza suas próprias categorias"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário deleta suas próprias categorias"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- ─── POLÍTICAS RLS: transactions ─────────────────────────────

CREATE POLICY "Usuário vê seus próprios lançamentos"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria seus próprios lançamentos"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seus próprios lançamentos"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário deleta seus próprios lançamentos"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ─── POLÍTICAS RLS: fixed_bills ──────────────────────────────

CREATE POLICY "Usuário vê suas próprias contas fixas"
  ON fixed_bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria suas próprias contas fixas"
  ON fixed_bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza suas próprias contas fixas"
  ON fixed_bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário deleta suas próprias contas fixas"
  ON fixed_bills FOR DELETE
  USING (auth.uid() = user_id);

-- ─── POLÍTICAS RLS: fixed_bill_payments ──────────────────────

CREATE POLICY "Usuário vê seus próprios pagamentos de contas"
  ON fixed_bill_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria seus próprios pagamentos de contas"
  ON fixed_bill_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seus próprios pagamentos de contas"
  ON fixed_bill_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário deleta seus próprios pagamentos de contas"
  ON fixed_bill_payments FOR DELETE
  USING (auth.uid() = user_id);

-- ─── POLÍTICAS RLS: card_bill_payments ───────────────────────

CREATE POLICY "Usuário vê seus próprios pagamentos de faturas"
  ON card_bill_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria seus próprios pagamentos de faturas"
  ON card_bill_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seus próprios pagamentos de faturas"
  ON card_bill_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário deleta seus próprios pagamentos de faturas"
  ON card_bill_payments FOR DELETE
  USING (auth.uid() = user_id);

-- ─── POLÍTICAS RLS: receivables ──────────────────────────────

CREATE POLICY "Usuário vê seus próprios recebíveis"
  ON receivables FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria seus próprios recebíveis"
  ON receivables FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seus próprios recebíveis"
  ON receivables FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário deleta seus próprios recebíveis"
  ON receivables FOR DELETE
  USING (auth.uid() = user_id);
