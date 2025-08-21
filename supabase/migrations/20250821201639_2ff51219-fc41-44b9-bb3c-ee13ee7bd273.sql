-- Fix RLS policies for companies table to allow authenticated users to create companies
-- First, drop the existing policies that might be conflicting
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update companies they have access to" ON public.companies;
DROP POLICY IF EXISTS "Users can view linked companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;

-- Create clear, non-conflicting policies
-- Policy for SELECT: Users can view companies they have access to OR admins can view all
CREATE POLICY "Users can view companies they have access to" ON public.companies
FOR SELECT TO authenticated
USING (
  (auth.uid() IN (
    SELECT uc.user_id 
    FROM user_companies uc 
    WHERE uc.company_id = companies.id
  )) 
  OR 
  is_admin()
);

-- Policy for INSERT: Any authenticated user can create companies
CREATE POLICY "Authenticated users can create companies" ON public.companies
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for UPDATE: Users can update companies they have access to OR admins can update all
CREATE POLICY "Users can update companies they have access to" ON public.companies
FOR UPDATE TO authenticated
USING (
  (auth.uid() IN (
    SELECT uc.user_id 
    FROM user_companies uc 
    WHERE uc.company_id = companies.id
  )) 
  OR 
  is_admin()
)
WITH CHECK (
  (auth.uid() IN (
    SELECT uc.user_id 
    FROM user_companies uc 
    WHERE uc.company_id = companies.id
  )) 
  OR 
  is_admin()
);

-- Policy for DELETE: Only admins can delete companies
CREATE POLICY "Admins can delete companies" ON public.companies
FOR DELETE TO authenticated
USING (is_admin());

-- Also ensure the profiles trigger is working correctly
-- Drop and recreate the trigger to handle new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();