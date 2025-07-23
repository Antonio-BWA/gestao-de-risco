import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GlobalRevenueData {
  cpf: string;
  nome: string;
  totalRevenue: number;
  companies: {
    nome: string;
    participacao: number;
    faturamento: number;
  }[];
}

export const GlobalRevenue: React.FC = () => {
  const [data, setData] = useState<GlobalRevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadGlobalRevenue();
  }, []);

  const loadGlobalRevenue = async () => {
    try {
      setLoading(true);
      
      // Buscar sócios com mais de 10% de participação
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select(`
          cpf,
          nome,
          percentual_participacao,
          companies!inner (
            id,
            nome,
            fiscal_data (
              faturamento,
              mes_ano
            )
          )
        `)
        .eq('ativo', true)
        .gte('percentual_participacao', 10);

      if (partnersError) throw partnersError;

      // Agrupar por CPF e calcular faturamento total
      const groupedData = partners?.reduce((acc: any, partner: any) => {
        const { cpf, nome, percentual_participacao, companies } = partner;
        
        if (!acc[cpf]) {
          acc[cpf] = {
            cpf,
            nome,
            totalRevenue: 0,
            companies: []
          };
        }

        // Calcular faturamento total da empresa
        const totalCompanyRevenue = companies.fiscal_data.reduce(
          (sum: number, fiscal: any) => sum + parseFloat(fiscal.faturamento || 0), 
          0
        );

        acc[cpf].totalRevenue += totalCompanyRevenue;
        acc[cpf].companies.push({
          nome: companies.nome,
          participacao: percentual_participacao,
          faturamento: totalCompanyRevenue
        });

        return acc;
      }, {});

      setData(Object.values(groupedData || {}));
    } catch (error) {
      console.error('Erro ao carregar faturamento global:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de faturamento global",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento Global por CPF</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sócios com mais de 10% de participação nas empresas
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item) => (
            <div key={item.cpf} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-semibold">{item.nome}</h3>
                  <p className="text-sm text-muted-foreground">{formatCPF(item.cpf)}</p>
                </div>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {formatCurrency(item.totalRevenue)}
                </Badge>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Participação</TableHead>
                    <TableHead>Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.companies.map((company, index) => (
                    <TableRow key={index}>
                      <TableCell>{company.nome}</TableCell>
                      <TableCell>{company.participacao.toFixed(2)}%</TableCell>
                      <TableCell>{formatCurrency(company.faturamento)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
          
          {data.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Nenhum sócio com mais de 10% de participação encontrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};