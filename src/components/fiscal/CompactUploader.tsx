import { useRef } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompactUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const CompactUploader = ({ onFilesSelected, isProcessing }: CompactUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        <Plus className="w-3 h-3 mr-1" />
        {isProcessing ? 'Processando...' : 'Adicionar TXT'}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <span className="text-xs text-muted-foreground">
        Importar mais arquivos
      </span>
    </div>
  );
};