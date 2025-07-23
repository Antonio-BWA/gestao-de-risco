import { useState, useEffect } from 'react';
import { AlertCircle, FileSpreadsheet, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';
import { CompanyDetail } from './CompanyDetail';
import { FileUploader } from './FileUploader';
import { CompactUploader } from './CompactUploader';
import { GlobalRevenue } from './GlobalRevenue';
import { ExternalRevenues } from './ExternalRevenues';
import { CompaniesData } from '@/types/fiscal';
import { FiscalParser } from '@/utils/fiscal-parser';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { ExcelExport } from '@/utils/excel-export';

export const FiscalDashboard = () => {
  const [companiesData, setCompaniesData] = useState<CompaniesData>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { saveCompanyData, getCompanies, getUserCompanies } = useSupabaseData();
  const { user, profile, signOut, isAdmin } = useAuth();

  useEffect(() => {
    if (user) {
      loadCompanies();
    }
  }, [user]);

  const loadCompanies = async () => {
    if (!user) return;
    
    let data;
    if (isAdmin) {
      data = await getCompanies();
    } else {
      data = await getUserCompanies(user.id);
    }
    setCompanies(data || []);
  };

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    
    try {
      const newCompaniesData = await FiscalParser.parseFiles(files);
      
      if (Object.keys(newCompaniesData).length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Os arquivos selecionados não contêm dados fiscais válidos.",
          variant: "destructive",
        });
        return;
      }

      // Consolidar com dados existentes
      const consolidatedData = { ...companiesData };
      Object.entries(newCompaniesData).forEach(([cnpj, companyData]) => {
        if (consolidatedData[cnpj]) {
          // Consolidar dados da empresa existente
          Object.entries(companyData.data).forEach(([mesAno, monthData]) => {
            if (consolidatedData[cnpj].data[mesAno]) {
              consolidatedData[cnpj].data[mesAno].Compras += monthData.Compras;
              consolidatedData[cnpj].data[mesAno].Faturamento += monthData.Faturamento;
            } else {
              consolidatedData[cnpj].data[mesAno] = { ...monthData };
            }
          });
        } else {
          consolidatedData[cnpj] = companyData;
        }
      });

      setCompaniesData(consolidatedData);
      
      // Salvar dados no Supabase
      await saveCompanyData(consolidatedData);
      
      // Recarregar empresas após salvar
      await loadCompanies();
      
      // Selecionar primeira empresa se nenhuma estiver selecionada
      if (!selectedCompany && Object.keys(consolidatedData).length > 0) {
        setSelectedCompany(Object.keys(consolidatedData)[0]);
      }

      toast({
        title: "Arquivos processados com sucesso",
        description: `${Object.keys(newCompaniesData).length} empresa(s) encontrada(s) em ${files.length} arquivo(s).`,
      });

    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      toast({
        title: "Erro ao processar arquivos",
        description: "Verifique se os arquivos estão no formato correto e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompanySelect = (cnpj: string) => {
    setSelectedCompany(cnpj);
  };

  const handleExportConsolidated = async () => {
    await ExcelExport.exportConsolidatedReport(companiesData);
  };

  const hasCompanies = Object.keys(companiesData).length > 0;
  const selectedCompanyData = selectedCompany ? companiesData[selectedCompany] : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Fiscal</h1>
          {profile && (
            <p className="text-muted-foreground">
              Bem-vindo, {profile.nome} {isAdmin && '(Administrador)'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {Object.keys(companiesData).length > 0 && (
            <Button 
              onClick={handleExportConsolidated}
              variant="outline"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Consolidado
            </Button>
          )}
          <Button 
            onClick={signOut}
            variant="outline"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="details">Detalhes por Empresa</TabsTrigger>
          <TabsTrigger value="global">Faturamento Global</TabsTrigger>
          <TabsTrigger value="external">Outros Faturamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="h-screen flex bg-background">
            <Sidebar 
              companiesData={companiesData}
              selectedCompany={selectedCompany}
              onCompanySelect={handleCompanySelect}
            />
            
            <div className="flex-1 flex flex-col">
              {!hasCompanies ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="max-w-md w-full">
                    <FileUploader 
                      onFilesSelected={handleFilesSelected}
                      isProcessing={isProcessing}
                    />
                  </div>
                </div>
              ) : !selectedCompanyData ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto" />
                    <h2 className="text-xl font-semibold text-foreground">
                      Selecione uma empresa
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Escolha uma empresa na barra lateral para visualizar os dados fiscais.
                    </p>
                  </div>
                </div>
              ) : (
                <CompanyDetail 
                  cnpj={selectedCompany!}
                  companyData={selectedCompanyData}
                />
              )}

              {hasCompanies && (
                <div className="p-2 border-t border-border bg-card">
                  <div className="max-w-sm">
                    <CompactUploader
                      onFilesSelected={handleFilesSelected}
                      isProcessing={isProcessing}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details">
          {selectedCompany ? (
            <CompanyDetail
              cnpj={selectedCompany}
              companyData={selectedCompanyData!}
            />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Selecione uma empresa da visão geral para ver os detalhes
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="global">
          <GlobalRevenue />
        </TabsContent>

        <TabsContent value="external">
          <ExternalRevenues />
        </TabsContent>
      </Tabs>
    </div>
  );
};