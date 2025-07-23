import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ExternalRevenue {
  id?: string;
  cpf: string;
  mes_ano: string;
  valor: number;
  descricao?: string;
}

export const ExternalRevenues: React.FC = () => {
  const [revenues, setRevenues] = useState<ExternalRevenue[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<ExternalRevenue | null>(null);
  const [formData, setFormData] = useState<ExternalRevenue>({
    cpf: '',
    mes_ano: '',
    valor: 0,
    descricao: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadRevenues();
  }, []);

  const loadRevenues = async () => {
    try {
      const { data, error } = await supabase
        .from('external_revenues')
        .select('*')
        .order('mes_ano', { ascending: false });

      if (error) throw error;
      setRevenues(data || []);
    } catch (error) {
      console.error('Erro ao carregar faturamentos externos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar faturamentos externos",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const revenueData = {
        cpf: formData.cpf.replace(/\D/g, ''),
        mes_ano: formData.mes_ano,
        valor: formData.valor,
        descricao: formData.descricao,
        user_id: user.id
      };

      if (editingRevenue?.id) {
        const { error } = await supabase
          .from('external_revenues')
          .update(revenueData)
          .eq('id', editingRevenue.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('external_revenues')
          .insert(revenueData);
        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Faturamento externo salvo com sucesso!",
      });
      
      setIsDialogOpen(false);
      resetForm();
      loadRevenues();
    } catch (error) {
      console.error('Erro ao salvar faturamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar faturamento externo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (revenue: ExternalRevenue) => {
    setEditingRevenue(revenue);
    setFormData(revenue);
    setIsDialogOpen(true);
  };

  const handleDelete = async (revenueId: string) => {
    if (window.confirm('Tem certeza que deseja remover este faturamento?')) {
      try {
        const { error } = await supabase
          .from('external_revenues')
          .delete()
          .eq('id', revenueId);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Faturamento removido com sucesso!",
        });
        loadRevenues();
      } catch (error) {
        console.error('Erro ao remover faturamento:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover faturamento",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cpf: '',
      mes_ano: '',
      valor: 0,
      descricao: ''
    });
    setEditingRevenue(null);
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

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Outros Faturamentos</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Faturamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRevenue ? 'Editar Faturamento' : 'Adicionar Faturamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
                  placeholder="000.000.000-00"
                  maxLength={11}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mes_ano">Mês/Ano</Label>
                <Input
                  id="mes_ano"
                  type="text"
                  value={formData.mes_ano}
                  onChange={(e) => setFormData({ ...formData, mes_ano: e.target.value })}
                  placeholder="01/2024"
                  required
                />
              </div>
              <div>
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Input
                  id="descricao"
                  type="text"
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CPF</TableHead>
              <TableHead>Mês/Ano</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenues.map((revenue) => (
              <TableRow key={revenue.id}>
                <TableCell>{formatCPF(revenue.cpf)}</TableCell>
                <TableCell>{revenue.mes_ano}</TableCell>
                <TableCell>{formatCurrency(revenue.valor)}</TableCell>
                <TableCell>{revenue.descricao || '-'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(revenue)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(revenue.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {revenues.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum faturamento externo cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};