import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Partner {
  id?: string;
  nome: string;
  cpf: string;
  percentual_participacao: number;
  cargo?: string;
  ativo: boolean;
}

export interface Company {
  id?: string;
  cnpj: string;
  nome: string;
  partners?: Partner[];
}

export const useSupabaseData = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveCompanyData = useCallback(async (companiesData: any, userId?: string) => {
    setLoading(true);
    try {
      for (const [cnpj, companyData] of Object.entries(companiesData)) {
        // Verificar se a empresa já existe
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('cnpj', cnpj)
          .maybeSingle();

        let companyId: string;

        if (existingCompany) {
          companyId = existingCompany.id;
          // Atualizar nome da empresa se necessário
          await supabase
            .from('companies')
            .update({ nome: (companyData as any).nome })
            .eq('id', companyId);
        } else {
          // Criar nova empresa
          const { data: newCompany, error } = await supabase
            .from('companies')
            .insert({
              cnpj,
              nome: (companyData as any).nome
            })
            .select('id')
            .single();

          if (error) throw error;
          companyId = newCompany.id;
        }

        // Vincular usuário à empresa se userId for fornecido
        if (userId) {
          // Verificar se já existe vínculo
          const { data: existingLink } = await supabase
            .from('user_companies')
            .select('id')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .maybeSingle();

          if (!existingLink) {
            await supabase
              .from('user_companies')
              .insert({ user_id: userId, company_id: companyId });
          }
        }

        // Salvar dados fiscais
        const fiscalData = (companyData as any).data;
        for (const [mesAno, dados] of Object.entries(fiscalData)) {
          await supabase
            .from('fiscal_data')
            .upsert({
              company_id: companyId,
              mes_ano: mesAno,
              compras: (dados as any).Compras,
              faturamento: (dados as any).Faturamento
            });
        }
      }

      toast({
        title: "Sucesso",
        description: "Dados salvos no banco de dados com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados no banco de dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      return [];
    }
  }, []);

  const linkUserToCompany = useCallback(async (companyId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('user_companies')
        .insert({ user_id: userId, company_id: companyId });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao vincular usuário à empresa:', error);
      return false;
    }
  }, []);

  const getUserCompanies = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          companies (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map(item => item.companies) || [];
    } catch (error) {
      console.error('Erro ao buscar empresas do usuário:', error);
      return [];
    }
  }, []);

  const getCompanyPartners = useCallback(async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('company_id', companyId)
        .eq('ativo', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar sócios:', error);
      return [];
    }
  }, []);

  const savePartner = useCallback(async (partner: Partner, companyId: string) => {
    setLoading(true);
    try {
      console.log('Salvando sócio:', partner);
      console.log('Company ID recebido:', companyId);
      
      const partnerData = {
        company_id: companyId,
        nome: partner.nome,
        cpf: partner.cpf,
        percentual_participacao: partner.percentual_participacao,
        cargo: partner.cargo,
        ativo: partner.ativo
      };

      console.log('Dados do sócio para salvar:', partnerData);

      if (partner.id) {
        console.log('Atualizando sócio existente');
        const { error } = await supabase
          .from('partners')
          .update(partnerData)
          .eq('id', partner.id);
        if (error) throw error;
      } else {
        console.log('Inserindo novo sócio');
        const { data, error } = await supabase
          .from('partners')
          .insert(partnerData)
          .select();
        if (error) throw error;
        console.log('Sócio inserido:', data);
      }

      toast({
        title: "Sucesso",
        description: "Sócio salvo com sucesso!",
      });
      return true;
    } catch (error) {
      console.error('Erro detalhado ao salvar sócio:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar sócio: ${error.message || error}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deletePartner = useCallback(async (partnerId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({ ativo: false })
        .eq('id', partnerId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Sócio removido com sucesso!",
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover sócio:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover sócio.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    saveCompanyData,
    getCompanies,
    getCompanyPartners,
    savePartner,
    deletePartner,
    linkUserToCompany,
    getUserCompanies
  };
};