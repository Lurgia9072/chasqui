import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  label?: string;
  error?: string;
  accept?: string;
  maxSize?: number; // in MB
  isLoading?: boolean;
  className?: string;
}

export const FileUpload = ({ onFileSelect, onFileRemove, label, error, accept = 'image/*', maxSize = 5, isLoading, className }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > maxSize * 1024 * 1024) {
        alert(`El archivo es demasiado grande. El tamaño máximo es ${maxSize}MB.`);
        return;
      }
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.size > maxSize * 1024 * 1024) {
        alert(`El archivo es demasiado grande. El tamaño máximo es ${maxSize}MB.`);
        return;
      }
      setFile(droppedFile);
      onFileSelect(droppedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemove?.();
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all',
          isDragging ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300',
          error ? 'border-red-500 bg-red-50' : '',
          className
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        {isLoading ? (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-gray-500">Subiendo archivo...</p>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
              {file.type.startsWith('image/') ? <ImageIcon className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button variant="outline" size="sm" onClick={removeFile} className="text-red-600 hover:bg-red-50 hover:text-red-600">
              <X className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-2xl bg-gray-50 p-4 text-gray-400">
              <Upload className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900">Haz clic para subir o arrastra y suelta</p>
              <p className="text-xs text-gray-500">PNG, JPG o PDF hasta {maxSize}MB</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Seleccionar archivo
            </Button>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};
