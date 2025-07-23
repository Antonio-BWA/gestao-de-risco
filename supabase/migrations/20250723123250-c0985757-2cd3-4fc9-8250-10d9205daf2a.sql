-- Habilitar autenticação e criar tabelas de perfis e vínculos
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para vincular usuários às empresas
CREATE TABLE public.user_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Tabela para faturamentos manuais/externos
CREATE TABLE public.external_revenues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf TEXT NOT NULL,
  mes_ano TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_revenues ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Políticas para user_companies
CREATE POLICY "Users can view their own company links" 
ON public.user_companies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all company links" 
ON public.user_companies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can manage company links" 
ON public.user_companies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Políticas para external_revenues
CREATE POLICY "Users can manage their own external revenues" 
ON public.external_revenues 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all external revenues" 
ON public.external_revenues 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Atualizar políticas das tabelas existentes para controle de acesso
DROP POLICY IF EXISTS "Allow all operations on companies" ON public.companies;
DROP POLICY IF EXISTS "Allow all operations on fiscal_data" ON public.fiscal_data;
DROP POLICY IF EXISTS "Allow all operations on partners" ON public.partners;

-- Políticas para companies - baseadas nos vínculos do usuário
CREATE POLICY "Users can view linked companies" 
ON public.companies 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_companies 
    WHERE company_id = companies.id
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can manage companies" 
ON public.companies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Políticas para fiscal_data
CREATE POLICY "Users can view fiscal data of linked companies" 
ON public.fiscal_data 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT uc.user_id FROM public.user_companies uc
    WHERE uc.company_id = fiscal_data.company_id
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can manage fiscal data of linked companies" 
ON public.fiscal_data 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT uc.user_id FROM public.user_companies uc
    WHERE uc.company_id = fiscal_data.company_id
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Políticas para partners
CREATE POLICY "Users can view partners of linked companies" 
ON public.partners 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT uc.user_id FROM public.user_companies uc
    WHERE uc.company_id = partners.company_id
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can manage partners of linked companies" 
ON public.partners 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT uc.user_id FROM public.user_companies uc
    WHERE uc.company_id = partners.company_id
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    false
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_external_revenues_updated_at
BEFORE UPDATE ON public.external_revenues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_user_companies_user_id ON public.user_companies(user_id);
CREATE INDEX idx_user_companies_company_id ON public.user_companies(company_id);
CREATE INDEX idx_external_revenues_cpf ON public.external_revenues(cpf);
CREATE INDEX idx_external_revenues_mes_ano ON public.external_revenues(mes_ano);
CREATE INDEX idx_partners_cpf ON public.partners(cpf);