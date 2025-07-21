export interface CompanyData {
  nome: string;
  data: {
    [mesAno: string]: {
      Compras: number;
      Faturamento: number;
    };
  };
}

export interface CompaniesData {
  [cnpj: string]: CompanyData;
}

export interface MonthlyData {
  mes: string;
  compras: number;
  faturamento: number;
  percentualCV: number;
  status: 'OK' | 'Atenção';
}

export const MONTHS_ORDER = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const CFOP_COMPRA = ['1.102', '1.403', '1.404', '2.102', '2.403', '2.404'];
export const CFOP_VENDA = ['5.102', '5.405'];