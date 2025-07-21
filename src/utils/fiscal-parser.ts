import { CompaniesData, CFOP_COMPRA, CFOP_VENDA } from '../types/fiscal';

export class FiscalParser {
  static parseFiles(files: File[]): Promise<CompaniesData> {
    return new Promise((resolve, reject) => {
      const companiesData: CompaniesData = {};
      let completedFiles = 0;

      if (files.length === 0) {
        resolve(companiesData);
        return;
      }

      files.forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            this.processFileContent(content, companiesData);
            completedFiles++;
            
            if (completedFiles === files.length) {
              resolve(companiesData);
            }
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(new Error(`Erro ao ler arquivo: ${file.name}`));
        reader.readAsText(file, 'ISO-8859-1');
      });
    });
  }

  private static processFileContent(content: string, companiesData: CompaniesData): void {
    // Dividir por blocos que iniciam com "Mês ou período/ano:"
    const blocks = content.split(/(?=Mês ou período\/ano:)/);
    
    blocks.forEach(block => {
      if (block.trim().length === 0) return;
      
      // Extrair CNPJ
      const cnpjMatch = block.match(/CNPJ[:\s]+([0-9\.\/-]+)/);
      if (!cnpjMatch) return;
      const cnpj = cnpjMatch[1].trim();

      // Extrair nome da empresa
      const empresaMatch = block.match(/Empresa[:\s]+([^\r\n]+)/);
      if (!empresaMatch) return;
      const nomeEmpresa = empresaMatch[1].trim();

      // Extrair mês/ano
      const mesAnoMatch = block.match(/\s*([A-Za-zçÇ]+)\s*\/\s*(\d{4})/);
      if (!mesAnoMatch) return;
      const mes = this.capitalizeFirstLetter(mesAnoMatch[1].trim());
      const ano = mesAnoMatch[2].trim();
      const mesAno = `${mes} ${ano}`;

      // Inicializar empresa se não existir
      if (!companiesData[cnpj]) {
        companiesData[cnpj] = {
          nome: nomeEmpresa,
          data: {}
        };
      }

      // Inicializar dados do mês se não existir
      if (!companiesData[cnpj].data[mesAno]) {
        companiesData[cnpj].data[mesAno] = {
          Compras: 0,
          Faturamento: 0
        };
      }

      // Processar linhas do bloco
      this.processBlockLines(block, companiesData[cnpj].data[mesAno]);
    });
  }

  private static processBlockLines(block: string, monthData: { Compras: number; Faturamento: number }): void {
    const lines = block.split('\n');
    let currentSection = '';

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Identificar seção atual
      if (trimmedLine.includes('ENTRADAS')) {
        currentSection = 'ENTRADAS';
        return;
      }
      if (trimmedLine.includes('SAÍDAS')) {
        currentSection = 'SAÍDAS';
        return;
      }

      // Processar linha com CFOP
      const cfopMatch = trimmedLine.match(/^\s*([0-9]\.\d{3})\s+([0-9\.,]+)/);
      if (cfopMatch) {
        const cfop = cfopMatch[1];
        const valorStr = cfopMatch[2];
        const valor = this.parseValue(valorStr);

        // Verificar se é CFOP de compra (na seção ENTRADAS)
        if (currentSection === 'ENTRADAS' && CFOP_COMPRA.includes(cfop)) {
          monthData.Compras += valor;
        }

        // Verificar se é CFOP de venda (na seção SAÍDAS)
        if (currentSection === 'SAÍDAS' && CFOP_VENDA.includes(cfop)) {
          monthData.Faturamento += valor;
        }
      }
    });
  }

  private static parseValue(valueStr: string): number {
    // Remover pontos (separadores de milhares) e trocar vírgula por ponto
    return parseFloat(valueStr.replace(/\./g, '').replace(',', '.')) || 0;
  }

  private static capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}