import * as XLSX from 'xlsx';
import { CompaniesData } from '@/types/fiscal';
import { FiscalCalculations } from './fiscal-calculations';

export interface PartnerRevenueData {
  nome: string;
  percentual_participacao: number;
  faturamento_total: number;
  faturamento_por_socio: number;
}

export class ExcelExport {
  static async exportCompanyReport(
    companiesData: CompaniesData,
    selectedCnpj: string,
    partners: any[] = []
  ) {
    const companyData = companiesData[selectedCnpj];
    if (!companyData) return;

    const workbook = XLSX.utils.book_new();

    // Aba 1: Dados Fiscais Mensais
    const monthlyData = FiscalCalculations.getMonthlyDataSorted(companyData);
    const fiscalSheet = XLSX.utils.json_to_sheet(
      monthlyData.map(item => ({
        'Mês/Ano': item.mes,
        'Faturamento': FiscalCalculations.formatCurrency(item.faturamento),
        'Compras': FiscalCalculations.formatCurrency(item.compras),
        'Percentual C/V': FiscalCalculations.formatPercentage(item.percentualCV),
        'Status': item.status
      }))
    );

    // Adicionar totais
    const totals = FiscalCalculations.calculateCompanyTotals(companyData);
    XLSX.utils.sheet_add_json(fiscalSheet, [
      {
        'Mês/Ano': 'TOTAL',
        'Faturamento': FiscalCalculations.formatCurrency(totals.totalFaturamento),
        'Compras': FiscalCalculations.formatCurrency(totals.totalCompras),
        'Percentual C/V': FiscalCalculations.formatPercentage(totals.percentualCV),
        'Status': ''
      }
    ], { origin: -1 });

    XLSX.utils.book_append_sheet(workbook, fiscalSheet, 'Dados Fiscais');

    // Aba 2: Quadro Societário e Faturamento por Sócio
    if (partners.length > 0) {
      const partnerData: PartnerRevenueData[] = partners.map(partner => ({
        nome: partner.nome,
        percentual_participacao: partner.percentual_participacao,
        faturamento_total: totals.totalFaturamento,
        faturamento_por_socio: (totals.totalFaturamento * partner.percentual_participacao) / 100
      }));

      const partnerSheet = XLSX.utils.json_to_sheet(
        partnerData.map(partner => ({
          'Nome do Sócio': partner.nome,
          'Participação (%)': `${partner.percentual_participacao.toFixed(2)}%`,
          'Faturamento Total': FiscalCalculations.formatCurrency(partner.faturamento_total),
          'Faturamento por Sócio': FiscalCalculations.formatCurrency(partner.faturamento_por_socio)
        }))
      );

      XLSX.utils.book_append_sheet(workbook, partnerSheet, 'Faturamento por Sócio');
    }

    // Aba 3: Resumo da Empresa
    const summaryData = [
      { 'Campo': 'CNPJ', 'Valor': selectedCnpj },
      { 'Campo': 'Empresa', 'Valor': companyData.nome },
      { 'Campo': 'Faturamento Total', 'Valor': FiscalCalculations.formatCurrency(totals.totalFaturamento) },
      { 'Campo': 'Compras Total', 'Valor': FiscalCalculations.formatCurrency(totals.totalCompras) },
      { 'Campo': 'Percentual C/V', 'Valor': FiscalCalculations.formatPercentage(totals.percentualCV) },
      { 'Campo': 'Número de Sócios', 'Valor': partners.length.toString() },
      { 'Campo': 'Data do Relatório', 'Valor': new Date().toLocaleDateString('pt-BR') }
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

    // Configurar estilos básicos
    const fileName = `relatorio_${companyData.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Exportar arquivo
    XLSX.writeFile(workbook, fileName);
  }

  static async exportConsolidatedReport(companiesData: CompaniesData) {
    const workbook = XLSX.utils.book_new();

    // Dados consolidados de todas as empresas
    const consolidatedData = Object.entries(companiesData).map(([cnpj, companyData]) => {
      const totals = FiscalCalculations.calculateCompanyTotals(companyData);
      return {
        'CNPJ': cnpj,
        'Empresa': companyData.nome,
        'Faturamento Total': FiscalCalculations.formatCurrency(totals.totalFaturamento),
        'Compras Total': FiscalCalculations.formatCurrency(totals.totalCompras),
        'Percentual C/V': FiscalCalculations.formatPercentage(totals.percentualCV)
      };
    });

    const consolidatedSheet = XLSX.utils.json_to_sheet(consolidatedData);
    XLSX.utils.book_append_sheet(workbook, consolidatedSheet, 'Consolidado');

    // Dados detalhados por empresa
    Object.entries(companiesData).forEach(([cnpj, companyData]) => {
      const monthlyData = FiscalCalculations.getMonthlyDataSorted(companyData);
      const detailSheet = XLSX.utils.json_to_sheet(
        monthlyData.map(item => ({
          'Mês/Ano': item.mes,
          'Faturamento': FiscalCalculations.formatCurrency(item.faturamento),
          'Compras': FiscalCalculations.formatCurrency(item.compras),
          'Percentual C/V': FiscalCalculations.formatPercentage(item.percentualCV),
          'Status': item.status
        }))
      );

      const sheetName = companyData.nome.substring(0, 31); // Limite do Excel para nomes de aba
      XLSX.utils.book_append_sheet(workbook, detailSheet, sheetName);
    });

    const fileName = `relatorio_consolidado_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}