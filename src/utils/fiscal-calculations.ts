import { CompanyData, MonthlyData, MONTHS_ORDER } from '../types/fiscal';

export class FiscalCalculations {
  static calculateCompanyTotals(companyData: CompanyData) {
    let totalFaturamento = 0;
    let totalCompras = 0;

    Object.values(companyData.data).forEach(monthData => {
      totalFaturamento += monthData.Faturamento;
      totalCompras += monthData.Compras;
    });

    const percentualCV = totalFaturamento > 0 ? (totalCompras / totalFaturamento) * 100 : 0;

    return {
      totalFaturamento,
      totalCompras,
      percentualCV
    };
  }

  static getMonthlyDataSorted(companyData: CompanyData): MonthlyData[] {
    const monthlyData: MonthlyData[] = [];

    Object.entries(companyData.data).forEach(([mesAno, data]) => {
      const [mes] = mesAno.split(' ');
      const percentualCV = data.Faturamento > 0 ? (data.Compras / data.Faturamento) * 100 : 0;
      const status = data.Compras > 0.8 * data.Faturamento ? 'Atenção' : 'OK';

      monthlyData.push({
        mes: mesAno,
        compras: data.Compras,
        faturamento: data.Faturamento,
        percentualCV,
        status
      });
    });

    // Ordenar por mês usando a ordem do calendário
    return monthlyData.sort((a, b) => {
      const [mesA, anoA] = a.mes.split(' ');
      const [mesB, anoB] = b.mes.split(' ');
      
      // Primeiro ordenar por ano
      if (anoA !== anoB) {
        return parseInt(anoA) - parseInt(anoB);
      }
      
      // Depois ordenar por mês
      const indexA = MONTHS_ORDER.indexOf(mesA);
      const indexB = MONTHS_ORDER.indexOf(mesB);
      return indexA - indexB;
    });
  }

  static formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}