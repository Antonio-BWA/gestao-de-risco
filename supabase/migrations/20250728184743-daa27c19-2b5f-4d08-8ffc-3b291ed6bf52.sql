-- Adicionar campo nome_empresa na tabela external_revenues
ALTER TABLE public.external_revenues 
ADD COLUMN nome_empresa TEXT NOT NULL DEFAULT '';