import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanyData } from '@/types/fiscal';
import { FiscalCalculations } from '@/utils/fiscal-calculations';

interface CompanyDetailProps {
  cnpj: string;
  companyData: CompanyData;
}

declare global {
  interface Window {
    Chart: any;
  }
}

export const CompanyDetail = ({ cnpj, companyData }: CompanyDetailProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const totals = FiscalCalculations.calculateCompanyTotals(companyData);
  const monthlyData = FiscalCalculations.getMonthlyDataSorted(companyData);

  useEffect(() => {
    if (chartRef.current && window.Chart) {
      // Destruir gráfico anterior se existir
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      const labels = monthlyData.map(item => item.mes);
      const comprasData = monthlyData.map(item => item.compras);
      const faturamentoData = monthlyData.map(item => item.faturamento);

      chartInstance.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Compras',
              data: comprasData,
              borderColor: 'hsl(0 84% 60%)',
              backgroundColor: 'hsl(0 84% 60% / 0.1)',
              tension: 0.25,
              fill: false
            },
            {
              label: 'Faturamento',
              data: faturamentoData,
              borderColor: 'hsl(210 100% 56%)',
              backgroundColor: 'hsl(210 100% 56% / 0.1)',
              tension: 0.25,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact'
                  }).format(value);
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  const value = FiscalCalculations.formatCurrency(context.parsed.y);
                  return `${context.dataset.label}: ${value}`;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [monthlyData]);

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-corporate-blue rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{companyData.nome}</h1>
            <p className="text-muted-foreground font-mono">{cnpj}</p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faturamento (Ano)</CardTitle>
              <TrendingUp className="h-4 w-4 text-corporate-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-corporate-success">
                {FiscalCalculations.formatCurrency(totals.totalFaturamento)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">% Total C/V</CardTitle>
              <TrendingDown className="h-4 w-4 text-corporate-danger" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-corporate-danger">
                {FiscalCalculations.formatPercentage(totals.percentualCV)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Mensal */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Análise Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Período</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Compras</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Faturamento</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">% C/V</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${
                        item.status === 'Atenção' ? 'bg-corporate-danger-bg' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium">{item.mes}</td>
                      <td className="py-3 px-4 text-right text-corporate-danger">
                        {FiscalCalculations.formatCurrency(item.compras)}
                      </td>
                      <td className="py-3 px-4 text-right text-corporate-success">
                        {FiscalCalculations.formatCurrency(item.faturamento)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {FiscalCalculations.formatPercentage(item.percentualCV)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Atenção' 
                            ? 'bg-corporate-danger text-white' 
                            : 'bg-corporate-success text-white'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Evolução Temporal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <canvas ref={chartRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};