import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { CompanyDetail } from './CompanyDetail';
import { FileUploader } from './FileUploader';
import { CompaniesData } from '@/types/fiscal';
import { FiscalParser } from '@/utils/fiscal-parser';
import { CompactUploader } from './CompactUploader';
import { useToast } from '@/hooks/use-toast';

export const FiscalDashboard = () => {
  const [companiesData, setCompaniesData] = useState<CompaniesData>({});
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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

  const hasCompanies = Object.keys(companiesData).length > 0;
  const selectedCompanyData = selectedCompany ? companiesData[selectedCompany] : null;

  return (
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
              <p className="text-muted-foreground">
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
  );
};