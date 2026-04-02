import { FileText, Image as ImageIcon, X, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from './Card';

interface DocumentPreviewProps {
  type: 'dni' | 'licencia' | 'tarjeta';
  label: string;
  status: 'pending' | 'verified' | 'rejected';
  url?: string;
  onRemove?: () => void;
  onDownload?: () => void;
  className?: string;
}

export const DocumentPreview = ({ type, label, status, url, onRemove, onDownload, className }: DocumentPreviewProps) => {
  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    verified: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  const statusLabels = {
    pending: 'Pendiente de revisión',
    verified: 'Verificado',
    rejected: 'Rechazado',
  };

  return (
    <Card className={cn('overflow-hidden border-gray-200', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-gray-100 p-2 text-gray-500">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{label}</p>
              <div className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border', statusColors[status])}>
                {statusLabels[status]}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {url && (
              <button
                onClick={onDownload}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Descargar documento"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Eliminar documento"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50 border border-dashed border-gray-300">
          {url ? (
            <img
              src={url}
              alt={label}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
              <ImageIcon className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-xs text-gray-400">No se ha subido ningún documento</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
