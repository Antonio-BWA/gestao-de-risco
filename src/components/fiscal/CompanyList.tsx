import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Eye } from 'lucide-react';
import { FilterPanel, FilterState } from './FilterPanel';

interface Company {
  id: string;
  cnpj: string;
  nome: string;
  created_at: string;
}

interface CompanyListProps {
  companies: Company[];
  onViewDetails: (company: Company) => void;
}

export const CompanyList: React.FC<CompanyListProps> = ({ companies, onViewDetails }) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    dateRange: '',
    minFaturamento: '',
    maxFaturamento: '',
    sortBy: 'nome',
    sortOrder: 'asc'
  });
  
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>(companies);

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateRange: '',
      minFaturamento: '',
      maxFaturamento: '',
      sortBy: 'nome',
      sortOrder: 'asc'
    });
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...companies];

    // Filtro de busca por nome ou CNPJ
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(company => 
        company.nome.toLowerCase().includes(term) ||
        company.cnpj.includes(term.replace(/\D/g, ''))
      );
    }

    // Filtro de período
    if (filters.dateRange) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      filtered = filtered.filter(company => {
        const createdDate = new Date(company.created_at);
        
        switch (filters.dateRange) {
          case '2024':
            return createdDate.getFullYear() === 2024;
          case '2023':
            return createdDate.getFullYear() === 2023;
          case 'ultimo-trimestre':
            const threeMonthsAgo = new Date(currentYear, currentMonth - 3);
            return createdDate >= threeMonthsAgo;
          case 'ultimo-semestre':
            const sixMonthsAgo = new Date(currentYear, currentMonth - 6);
            return createdDate >= sixMonthsAgo;
          default:
            return true;
        }
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'nome':
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
          break;
        case 'cnpj':
          aValue = a.cnpj;
          bValue = b.cnpj;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a.nome.toLowerCase();
          bValue = b.nome.toLowerCase();
      }
      
      if (filters.sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    setFilteredCompanies(filtered);
  }, [companies, filters]);

  return (
    <div className="space-y-4">
      <FilterPanel 
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Suas Empresas ({filteredCompanies.length} de {companies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
        {filteredCompanies.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p>{companies.length === 0 ? 'Nenhuma empresa cadastrada' : 'Nenhuma empresa encontrada com os filtros aplicados'}</p>
            <p className="text-sm">{companies.length === 0 ? 'Importe arquivos fiscais para começar' : 'Tente ajustar os filtros para encontrar suas empresas'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{company.nome}</h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      CNPJ: {formatCNPJ(company.cnpj)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Adicionada em: {formatDate(company.created_at)}
                    </p>
                  </div>
                  <Button
                    onClick={() => onViewDetails(company)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};