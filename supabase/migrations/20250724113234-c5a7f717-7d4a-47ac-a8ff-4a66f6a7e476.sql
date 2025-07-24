-- Permitir que usuários autenticados criem empresas
CREATE POLICY "Users can create companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Permitir que usuários autenticados atualizem empresas que têm acesso
CREATE POLICY "Users can update linked companies" 
ON public.companies 
FOR UPDATE 
USING ((auth.uid() IN ( SELECT user_companies.user_id
   FROM user_companies
  WHERE (user_companies.company_id = companies.id))) OR is_admin());