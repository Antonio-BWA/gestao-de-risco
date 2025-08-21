-- Vincular o usuário antonio.soares@bwa.global a todas as empresas existentes
-- Primeiro, inserir os vínculos que faltam
INSERT INTO user_companies (user_id, company_id)
SELECT 
  p.id as user_id,
  c.id as company_id
FROM profiles p
CROSS JOIN companies c
WHERE p.email = 'antonio.soares@bwa.global'
AND NOT EXISTS (
  SELECT 1 FROM user_companies uc 
  WHERE uc.user_id = p.id AND uc.company_id = c.id
);