import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FiscalDataEntry {
  mes_ano: string;
  compras: number;
  faturamento: number;
}

interface EditFiscalDataModalProps {
  companyId: string;
  companyName: string;
  onDataUpdated: () => void;
}

export const EditFiscalDataModal: React.FC<EditFiscalDataModalProps> = ({
  companyId,
  companyName,
  onDataUpdated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fiscalData, setFiscalData] = useState<FiscalDataEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEntry, setNewEntry] = useState({ mes_ano: '', compras: 0, faturamento: 0 });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadFiscalData();
    }
  }, [isOpen, companyId]);

  const loadFiscalData = async () => {
    try {
      const { data, error } = await supabase
        .from('fiscal_data')
        .select('mes_ano, compras, faturamento')
        .eq('company_id', companyId)
        .order('mes_ano', { ascending: false });

      if (error) throw error;

      setFiscalData(data || []);
    } catch (error) {
      console.error('Erro ao carregar dados fiscais:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados fiscais.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEntry = async (mesAno: string, field: 'compras' | 'faturamento', value: number) => {
    try {
      const { error } = await supabase
        .from('fiscal_data')
        .update({ [field]: value })
        .eq('company_id', companyId)
        .eq('mes_ano', mesAno);

      if (error) throw error;

      // Atualizar estado local
      setFiscalData(prev => 
        prev.map(entry => 
          entry.mes_ano === mesAno 
            ? { ...entry, [field]: value }
            : entry
        )
      );

      toast({
        title: 'Sucesso',
        description: 'Dados atualizados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar dados.',
        variant: 'destructive',
      });
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.mes_ano) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira o período (ex: 2024-01).',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se já existe entrada para este período
    const existingEntry = fiscalData.find(entry => entry.mes_ano === newEntry.mes_ano);
    if (existingEntry) {
      toast({
        title: 'Erro',
        description: 'Já existe uma entrada para este período.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('fiscal_data')
        .insert({
          company_id: companyId,
          mes_ano: newEntry.mes_ano,
          compras: newEntry.compras,
          faturamento: newEntry.faturamento
        });

      if (error) throw error;

      // Adicionar ao estado local
      setFiscalData(prev => [...prev, newEntry].sort((a, b) => b.mes_ano.localeCompare(a.mes_ano)));
      setNewEntry({ mes_ano: '', compras: 0, faturamento: 0 });

      toast({
        title: 'Sucesso',
        description: 'Nova entrada adicionada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao adicionar entrada:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar nova entrada.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (mesAno: string) => {
    try {
      const { error } = await supabase
        .from('fiscal_data')
        .delete()
        .eq('company_id', companyId)
        .eq('mes_ano', mesAno);

      if (error) throw error;

      // Remover do estado local
      setFiscalData(prev => prev.filter(entry => entry.mes_ano !== mesAno));

      toast({
        title: 'Sucesso',
        description: 'Entrada removida com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao remover entrada:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover entrada.',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSaveAndClose = () => {
    setIsOpen(false);
    onDataUpdated();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit3 className="w-4 h-4 mr-2" />
          Editar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Dados Fiscais - {companyName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Formulário para nova entrada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Nova Entrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label htmlFor="new-period">Período (AAAA-MM)</Label>
                  <Input
                    id="new-period"
                    placeholder="2024-01"
                    value={newEntry.mes_ano}
                    onChange={(e) => setNewEntry({ ...newEntry, mes_ano: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-compras">Compras</Label>
                  <Input
                    id="new-compras"
                    type="number"
                    step="0.01"
                    value={newEntry.compras}
                    onChange={(e) => setNewEntry({ ...newEntry, compras: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-faturamento">Faturamento</Label>
                  <Input
                    id="new-faturamento"
                    type="number"
                    step="0.01"
                    value={newEntry.faturamento}
                    onChange={(e) => setNewEntry({ ...newEntry, faturamento: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={handleAddEntry} disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de dados existentes */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              {fiscalData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado fiscal encontrado para esta empresa.
                </p>
              ) : (
                <div className="space-y-4">
                  {fiscalData.map((entry, index) => (
                    <div key={entry.mes_ano} className="border rounded-lg p-4 bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <Label className="text-sm font-medium">Período</Label>
                          <p className="text-lg font-mono">{entry.mes_ano}</p>
                        </div>
                        <div>
                          <Label htmlFor={`compras-${index}`}>Compras</Label>
                          <Input
                            id={`compras-${index}`}
                            type="number"
                            step="0.01"
                            value={entry.compras}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setFiscalData(prev => 
                                prev.map(item => 
                                  item.mes_ano === entry.mes_ano 
                                    ? { ...item, compras: value }
                                    : item
                                )
                              );
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              handleUpdateEntry(entry.mes_ano, 'compras', value);
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(entry.compras)}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor={`faturamento-${index}`}>Faturamento</Label>
                          <Input
                            id={`faturamento-${index}`}
                            type="number"
                            step="0.01"
                            value={entry.faturamento}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setFiscalData(prev => 
                                prev.map(item => 
                                  item.mes_ano === entry.mes_ano 
                                    ? { ...item, faturamento: value }
                                    : item
                                )
                              );
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              handleUpdateEntry(entry.mes_ano, 'faturamento', value);
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(entry.faturamento)}
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.mes_ano)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAndClose}>
              <Save className="w-4 h-4 mr-2" />
              Salvar e Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};