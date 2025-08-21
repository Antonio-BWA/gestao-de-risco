import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';

export interface FilterState {
  searchTerm: string;
  dateRange: string;
  minFaturamento: string;
  maxFaturamento: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.searchTerm || 
    (filters.dateRange && filters.dateRange !== 'todos') || 
    filters.minFaturamento || 
    filters.maxFaturamento ||
    filters.sortBy !== 'nome';

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Ordenação
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                Ativos
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? 'Recolher' : 'Expandir'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Busca por nome/CNPJ */}
            <div>
              <Label htmlFor="search">Buscar por nome ou CNPJ</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite para buscar..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Período */}
            <div>
              <Label>Período</Label>
              <Select 
                value={filters.dateRange} 
                onValueChange={(value) => handleFilterChange('dateRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="ultimo-trimestre">Último trimestre</SelectItem>
                  <SelectItem value="ultimo-semestre">Último semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenação */}
            <div>
              <Label>Ordenar por</Label>
              <div className="flex gap-2">
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nome">Nome</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="faturamento">Faturamento</SelectItem>
                    <SelectItem value="created_at">Data de criação</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={filters.sortOrder} 
                  onValueChange={(value) => handleFilterChange('sortOrder', value as 'asc' | 'desc')}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">A-Z</SelectItem>
                    <SelectItem value="desc">Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Faturamento mínimo */}
            <div>
              <Label htmlFor="min-faturamento">Faturamento mínimo</Label>
              <Input
                id="min-faturamento"
                type="number"
                placeholder="R$ 0,00"
                value={filters.minFaturamento}
                onChange={(e) => handleFilterChange('minFaturamento', e.target.value)}
              />
            </div>

            {/* Faturamento máximo */}
            <div>
              <Label htmlFor="max-faturamento">Faturamento máximo</Label>
              <Input
                id="max-faturamento"
                type="number"
                placeholder="R$ 999.999,99"
                value={filters.maxFaturamento}
                onChange={(e) => handleFilterChange('maxFaturamento', e.target.value)}
              />
            </div>
          </div>

          {/* Botão limpar filtros */}
          {hasActiveFilters && (
            <div className="flex justify-end pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={onClearFilters}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};