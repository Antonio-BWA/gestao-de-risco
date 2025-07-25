-- Remover a constraint única que impede CPF duplicado
ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_company_id_cpf_key;

-- Permitir que o mesmo CPF possa estar em várias empresas
-- Manter apenas uma constraint única por empresa para evitar duplicação do mesmo sócio na mesma empresa
ALTER TABLE public.partners 
ADD CONSTRAINT partners_company_cpf_unique 
UNIQUE (company_id, cpf, ativo) 
DEFERRABLE INITIALLY DEFERRED;