-- ============================================================
-- Home Bills — Migração: Grupo Familiar (Household)
-- ============================================================
-- Execute este script NO SUPABASE SQL EDITOR após o schema.sql
-- inicial. Cria as tabelas de grupo familiar, convites e
-- atualiza as políticas RLS para permitir acesso compartilhado.
-- ============================================================

-- ─── TABELA: households ──────────────────────────────────────
-- Representa o grupo familiar. Cada usuário tem um grupo ao
-- se cadastrar. O dono pode convidar outros membros.

CREATE TABLE households (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT 'Minha Família',
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── TABELA: household_members ───────────────────────────────
-- Relaciona usuários aos grupos familiares.
-- O dono também é inserido como membro com role='owner'.

CREATE TABLE household_members (
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (household_id, user_id)
);

-- ─── TABELA: household_invites ───────────────────────────────
-- Convites para entrar em um grupo familiar via token único.
-- O token é enviado como link e expira em 7 dias.

CREATE TABLE household_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  token        UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  invited_by   UUID NOT NULL REFERENCES auth.users(id),
  accepted_by  UUID REFERENCES auth.users(id),
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days'
);

-- ─── ÍNDICES ─────────────────────────────────────────────────

CREATE INDEX idx_households_owner          ON households(owner_id);
CREATE INDEX idx_household_members_user    ON household_members(user_id);
CREATE INDEX idx_household_members_hh      ON household_members(household_id);
CREATE INDEX idx_household_invites_token   ON household_invites(token);
CREATE INDEX idx_household_invites_hh      ON household_invites(household_id);

-- ─── HABILITAR RLS ───────────────────────────────────────────

ALTER TABLE households         ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invites  ENABLE ROW LEVEL SECURITY;

-- ─── FUNÇÃO AUXILIAR: users_share_household ──────────────────
-- Verifica se o usuário autenticado e outro usuário (other_user_id)
-- pertencem ao mesmo grupo familiar. Usada nas políticas RLS das
-- tabelas de dados para permitir acesso compartilhado.
-- SECURITY DEFINER: executa com privilégios do criador para
-- acessar household_members sem expor dados diretamente.

CREATE OR REPLACE FUNCTION users_share_household(other_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM household_members hm1
    JOIN household_members hm2 ON hm1.household_id = hm2.household_id
    WHERE hm1.user_id = auth.uid()
      AND hm2.user_id = other_user_id
  );
$$;

-- ─── POLÍTICAS RLS: households ───────────────────────────────

-- Membro do grupo pode visualizar o grupo
CREATE POLICY "Membro vê seu grupo familiar"
  ON households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = id
        AND user_id = auth.uid()
    )
  );

-- Usuário pode criar grupo com si mesmo como dono
CREATE POLICY "Usuário cria seu grupo familiar"
  ON households FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Somente o dono pode atualizar o grupo
CREATE POLICY "Dono atualiza seu grupo familiar"
  ON households FOR UPDATE
  USING (owner_id = auth.uid());

-- Somente o dono pode excluir o grupo
CREATE POLICY "Dono exclui seu grupo familiar"
  ON households FOR DELETE
  USING (owner_id = auth.uid());

-- ─── POLÍTICAS RLS: household_members ────────────────────────

-- Usuário vê sua própria entrada OU vê membros do mesmo grupo
CREATE POLICY "Membro vê membros do mesmo grupo"
  ON household_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM household_members hm2
      WHERE hm2.household_id = household_id
        AND hm2.user_id = auth.uid()
    )
  );

-- Usuário pode se adicionar a um grupo (ao aceitar convite)
CREATE POLICY "Usuário entra no grupo familiar"
  ON household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Usuário remove a própria entrada OU dono remove qualquer membro
CREATE POLICY "Membro sai ou dono remove do grupo"
  ON household_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM households
      WHERE id = household_id
        AND owner_id = auth.uid()
    )
  );

-- ─── POLÍTICAS RLS: household_invites ────────────────────────

-- Quem criou o convite ou quem é membro do grupo pode ver
CREATE POLICY "Criador ou membro vê convites"
  ON household_invites FOR SELECT
  USING (
    invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = household_invites.household_id
        AND user_id = auth.uid()
    )
  );

-- Membro do grupo pode gerar convite
CREATE POLICY "Membro cria convite"
  ON household_invites FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = household_invites.household_id
        AND user_id = auth.uid()
    )
  );

-- Qualquer usuário autenticado pode aceitar um convite
-- (atualiza accepted_by e accepted_at)
CREATE POLICY "Usuário aceita convite"
  ON household_invites FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ─── ATUALIZAR POLÍTICAS RLS DAS TABELAS DE DADOS ────────────
-- Dropar e recriar as políticas SELECT + INSERT + UPDATE + DELETE
-- de cada tabela para também permitir membros do grupo familiar.

-- ── transactions ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Usuário vê seus próprios lançamentos"     ON transactions;
DROP POLICY IF EXISTS "Usuário cria seus próprios lançamentos"   ON transactions;
DROP POLICY IF EXISTS "Usuário atualiza seus próprios lançamentos" ON transactions;
DROP POLICY IF EXISTS "Usuário deleta seus próprios lançamentos" ON transactions;

CREATE POLICY "Usuário ou cônjuge vê lançamentos"
  ON transactions FOR SELECT
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge cria lançamentos"
  ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge atualiza lançamentos"
  ON transactions FOR UPDATE
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge deleta lançamentos"
  ON transactions FOR DELETE
  USING (user_id = auth.uid() OR users_share_household(user_id));

-- ── credit_cards ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Usuário vê seus próprios cartões"     ON credit_cards;
DROP POLICY IF EXISTS "Usuário cria seus próprios cartões"   ON credit_cards;
DROP POLICY IF EXISTS "Usuário atualiza seus próprios cartões" ON credit_cards;
DROP POLICY IF EXISTS "Usuário deleta seus próprios cartões" ON credit_cards;

CREATE POLICY "Usuário ou cônjuge vê cartões"
  ON credit_cards FOR SELECT
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge cria cartões"
  ON credit_cards FOR INSERT
  WITH CHECK (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge atualiza cartões"
  ON credit_cards FOR UPDATE
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge deleta cartões"
  ON credit_cards FOR DELETE
  USING (user_id = auth.uid() OR users_share_household(user_id));

-- ── categories ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Usuário vê suas próprias categorias"     ON categories;
DROP POLICY IF EXISTS "Usuário cria suas próprias categorias"   ON categories;
DROP POLICY IF EXISTS "Usuário atualiza suas próprias categorias" ON categories;
DROP POLICY IF EXISTS "Usuário deleta suas próprias categorias" ON categories;

CREATE POLICY "Usuário ou cônjuge vê categorias"
  ON categories FOR SELECT
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge cria categorias"
  ON categories FOR INSERT
  WITH CHECK (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge atualiza categorias"
  ON categories FOR UPDATE
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge deleta categorias"
  ON categories FOR DELETE
  USING (user_id = auth.uid() OR users_share_household(user_id));

-- ── fixed_bills ───────────────────────────────────────────────

DROP POLICY IF EXISTS "Usuário vê suas próprias contas fixas"     ON fixed_bills;
DROP POLICY IF EXISTS "Usuário cria suas próprias contas fixas"   ON fixed_bills;
DROP POLICY IF EXISTS "Usuário atualiza suas próprias contas fixas" ON fixed_bills;
DROP POLICY IF EXISTS "Usuário deleta suas próprias contas fixas" ON fixed_bills;

CREATE POLICY "Usuário ou cônjuge vê contas fixas"
  ON fixed_bills FOR SELECT
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge cria contas fixas"
  ON fixed_bills FOR INSERT
  WITH CHECK (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge atualiza contas fixas"
  ON fixed_bills FOR UPDATE
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge deleta contas fixas"
  ON fixed_bills FOR DELETE
  USING (user_id = auth.uid() OR users_share_household(user_id));

-- ── fixed_bill_payments ───────────────────────────────────────

DROP POLICY IF EXISTS "Usuário vê seus próprios pagamentos de contas"     ON fixed_bill_payments;
DROP POLICY IF EXISTS "Usuário cria seus próprios pagamentos de contas"   ON fixed_bill_payments;
DROP POLICY IF EXISTS "Usuário atualiza seus próprios pagamentos de contas" ON fixed_bill_payments;
DROP POLICY IF EXISTS "Usuário deleta seus próprios pagamentos de contas" ON fixed_bill_payments;

CREATE POLICY "Usuário ou cônjuge vê pagamentos de contas"
  ON fixed_bill_payments FOR SELECT
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge cria pagamentos de contas"
  ON fixed_bill_payments FOR INSERT
  WITH CHECK (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge atualiza pagamentos de contas"
  ON fixed_bill_payments FOR UPDATE
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge deleta pagamentos de contas"
  ON fixed_bill_payments FOR DELETE
  USING (user_id = auth.uid() OR users_share_household(user_id));

-- ── card_bill_payments ────────────────────────────────────────

DROP POLICY IF EXISTS "Usuário vê seus próprios pagamentos de faturas"     ON card_bill_payments;
DROP POLICY IF EXISTS "Usuário cria seus próprios pagamentos de faturas"   ON card_bill_payments;
DROP POLICY IF EXISTS "Usuário atualiza seus próprios pagamentos de faturas" ON card_bill_payments;
DROP POLICY IF EXISTS "Usuário deleta seus próprios pagamentos de faturas" ON card_bill_payments;

CREATE POLICY "Usuário ou cônjuge vê pagamentos de faturas"
  ON card_bill_payments FOR SELECT
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge cria pagamentos de faturas"
  ON card_bill_payments FOR INSERT
  WITH CHECK (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge atualiza pagamentos de faturas"
  ON card_bill_payments FOR UPDATE
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge deleta pagamentos de faturas"
  ON card_bill_payments FOR DELETE
  USING (user_id = auth.uid() OR users_share_household(user_id));

-- ── receivables ───────────────────────────────────────────────

DROP POLICY IF EXISTS "Usuário vê seus próprios recebíveis"     ON receivables;
DROP POLICY IF EXISTS "Usuário cria seus próprios recebíveis"   ON receivables;
DROP POLICY IF EXISTS "Usuário atualiza seus próprios recebíveis" ON receivables;
DROP POLICY IF EXISTS "Usuário deleta seus próprios recebíveis" ON receivables;

CREATE POLICY "Usuário ou cônjuge vê recebíveis"
  ON receivables FOR SELECT
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge cria recebíveis"
  ON receivables FOR INSERT
  WITH CHECK (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge atualiza recebíveis"
  ON receivables FOR UPDATE
  USING (user_id = auth.uid() OR users_share_household(user_id));

CREATE POLICY "Usuário ou cônjuge deleta recebíveis"
  ON receivables FOR DELETE
  USING (user_id = auth.uid() OR users_share_household(user_id));
