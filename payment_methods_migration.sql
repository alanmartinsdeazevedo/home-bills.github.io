-- ============================================================
-- Migração: Formas de Pagamento Dinâmicas
-- Execute este script no SQL Editor do Supabase APÓS o schema inicial
-- ============================================================

-- 1. Criar tabela de formas de pagamento customizadas
CREATE TABLE payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (mesmo padrão das outras tabelas)
CREATE POLICY "payment_methods_select" ON payment_methods
  FOR SELECT USING (auth.uid() = user_id OR users_share_household(user_id));

CREATE POLICY "payment_methods_insert" ON payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_methods_update" ON payment_methods
  FOR UPDATE USING (auth.uid() = user_id OR users_share_household(user_id));

CREATE POLICY "payment_methods_delete" ON payment_methods
  FOR DELETE USING (auth.uid() = user_id OR users_share_household(user_id));

-- 2. Alterar payment_method de enum para text
ALTER TABLE transactions ALTER COLUMN payment_method TYPE text;

-- 3. Remover o tipo enum (só funciona se não houver outros usos)
DROP TYPE IF EXISTS payment_method;
