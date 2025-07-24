-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update linked companies" ON public.companies;

-- Recriar política mais permissiva para inserção
CREATE POLICY "Authenticated users can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Política para atualização mais específica
CREATE POLICY "Users can update companies they have access to" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING ((auth.uid() IN ( 
  SELECT user_companies.user_id
  FROM user_companies
  WHERE user_companies.company_id = companies.id
)) OR is_admin());