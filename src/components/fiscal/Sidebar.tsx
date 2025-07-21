import { Building2, FileText } from 'lucide-react';
import { CompaniesData } from '@/types/fiscal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  companiesData: CompaniesData;
  selectedCompany: string | null;
  onCompanySelect: (cnpj: string) => void;
}

export const Sidebar = ({ companiesData, selectedCompany, onCompanySelect }: SidebarProps) => {
  const companies = Object.entries(companiesData);

  return (
    <div className="w-80 bg-corporate-sidebar text-white border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-corporate-sidebar-hover">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-corporate-blue rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Dashboard Fiscal</h1>
            <p className="text-sm text-gray-300">Análise Corporativa</p>
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
              Empresas
            </h2>
            <div className="px-2 py-1 bg-corporate-blue/20 rounded text-xs text-corporate-blue font-medium">
              {companies.length}
            </div>
          </div>
          
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Nenhuma empresa carregada
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Importe arquivos TXT para começar
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {companies.map(([cnpj, company]) => (
                  <Button
                    key={cnpj}
                    variant="ghost"
                    onClick={() => onCompanySelect(cnpj)}
                    className={`w-full justify-start p-3 h-auto text-left transition-all duration-200 ${
                      selectedCompany === cnpj
                        ? 'bg-gradient-primary text-white shadow-lg'
                        : 'text-gray-300 hover:bg-corporate-sidebar-hover hover:text-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        selectedCompany === cnpj ? 'bg-white' : 'bg-corporate-blue'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight mb-1 truncate">
                          {company.nome}
                        </p>
                        <p className={`text-xs font-mono truncate ${
                          selectedCompany === cnpj ? 'text-white/80' : 'text-gray-400'
                        }`}>
                          {cnpj}
                        </p>
                        <p className={`text-xs mt-1 ${
                          selectedCompany === cnpj ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {Object.keys(company.data).length} período(s)
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};