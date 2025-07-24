import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Eye } from 'lucide-react';

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
  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Suas Empresas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p>Nenhuma empresa cadastrada</p>
            <p className="text-sm">Importe arquivos fiscais para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {companies.map((company) => (
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
  );
};