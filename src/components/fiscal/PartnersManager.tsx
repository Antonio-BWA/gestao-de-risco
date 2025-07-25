import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useSupabaseData, Partner } from '@/hooks/useSupabaseData';

interface PartnersManagerProps {
  companyId: string;
  companyName: string;
}

export const PartnersManager: React.FC<PartnersManagerProps> = ({ companyId, companyName }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<Partner>({
    nome: '',
    cpf: '',
    percentual_participacao: 0,
    cargo: '',
    ativo: true
  });

  const { loading, getCompanyPartners, savePartner, deletePartner } = useSupabaseData();

  useEffect(() => {
    loadPartners();
  }, [companyId]);

  const loadPartners = async () => {
    const data = await getCompanyPartners(companyId);
    setPartners(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Tentando salvar sócio:', formData);
    console.log('Company ID:', companyId);
    
    if (!companyId) {
      console.error('Company ID não fornecido!');
      return;
    }
    
    const success = await savePartner(formData, companyId);
    if (success) {
      setIsDialogOpen(false);
      resetForm();
      loadPartners();
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData(partner);
    setIsDialogOpen(true);
  };

  const handleDelete = async (partnerId: string) => {
    if (window.confirm('Tem certeza que deseja remover este sócio?')) {
      const success = await deletePartner(partnerId);
      if (success) {
        loadPartners();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      percentual_participacao: 0,
      cargo: '',
      ativo: true
    });
    setEditingPartner(null);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const totalParticipacao = partners.reduce((sum, partner) => sum + partner.percentual_participacao, 0);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Quadro Societário - {companyName}</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Sócio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? 'Editar Sócio' : 'Adicionar Sócio'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
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
                <Label htmlFor="percentual">Percentual de Participação (%)</Label>
                <Input
                  id="percentual"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.percentual_participacao}
                  onChange={(e) => setFormData({ ...formData, percentual_participacao: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cargo">Cargo (opcional)</Label>
                <Input
                  id="cargo"
                  type="text"
                  value={formData.cargo || ''}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
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
        <div className="mb-4">
          <Badge variant={totalParticipacao === 100 ? "default" : "destructive"}>
            Total: {totalParticipacao.toFixed(2)}%
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Participação</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>{partner.nome}</TableCell>
                <TableCell>{formatCPF(partner.cpf)}</TableCell>
                <TableCell>{partner.percentual_participacao.toFixed(2)}%</TableCell>
                <TableCell>{partner.cargo || '-'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(partner)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(partner.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {partners.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum sócio cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};