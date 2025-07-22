-- Create companies table to store company information
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partners table to store company partners information
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  percentual_participacao DECIMAL(5,2) NOT NULL CHECK (percentual_participacao >= 0 AND percentual_participacao <= 100),
  cargo TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, cpf)
);

-- Create fiscal_data table to store monthly fiscal data
CREATE TABLE public.fiscal_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  mes_ano TEXT NOT NULL,
  compras DECIMAL(15,2) NOT NULL DEFAULT 0,
  faturamento DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, mes_ano)
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on companies" 
ON public.companies 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on partners" 
ON public.partners 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on fiscal_data" 
ON public.fiscal_data 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fiscal_data_updated_at
BEFORE UPDATE ON public.fiscal_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX idx_partners_company_id ON public.partners(company_id);
CREATE INDEX idx_partners_cpf ON public.partners(cpf);
CREATE INDEX idx_fiscal_data_company_id ON public.fiscal_data(company_id);
CREATE INDEX idx_fiscal_data_mes_ano ON public.fiscal_data(mes_ano);