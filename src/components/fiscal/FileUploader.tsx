import { useRef } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const FileUploader = ({ onFilesSelected, isProcessing }: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Card className="p-8 border-2 border-dashed border-primary/30 bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300">
      <div
        className="text-center space-y-4"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="mx-auto w-16 h-16 bg-corporate-blue-light rounded-full flex items-center justify-center">
          <Upload className="h-8 w-8 text-corporate-blue" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Importar Arquivos TXT
          </h3>
          <p className="text-sm text-muted-foreground">
            Arraste e solte ou clique para selecionar múltiplos arquivos TXT com dados fiscais
          </p>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          <FileText className="w-4 h-4 mr-2" />
          {isProcessing ? 'Processando...' : 'Selecionar Arquivos'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        <p className="text-xs text-muted-foreground">
          Formato: TXT (ISO-8859-1) • Múltiplos arquivos suportados
        </p>
      </div>
    </Card>
  );
};