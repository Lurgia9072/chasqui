import { Star, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { PriceTag } from './PriceTag';
import { Rating } from './Rating';
import { UserAvatar } from './UserAvatar';
import { Offer } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface OfferCardProps {
  offer: Offer;
  carrierName: string;
  carrierRating: number;
  onAccept?: () => void;
  onReject?: () => void;
  className?: string;
  isMerchant?: boolean;
}

export const OfferCard = ({ offer, carrierName, carrierRating, onAccept, onReject, className, isMerchant = false }: OfferCardProps) => {
  return (
    <Card className={cn('overflow-hidden border-gray-200 transition-all hover:border-blue-500 hover:shadow-xl', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <UserAvatar name={carrierName} size="lg" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">{carrierName}</h3>
              <div className="flex items-center space-x-3 mt-1">
                <Rating value={carrierRating} size="sm" />
                <span className="text-xs text-gray-400">•</span>
                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">
                    {formatDistanceToNow(offer.createdAt, { addSuffix: true, locale: es })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <PriceTag amount={offer.precioOfertado} size="lg" />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-gray-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium">Transportista Verificado</span>
          </div>
          {isMerchant && offer.estado === 'pendiente' && (
            <div className="flex items-center space-x-2">
              <Button variant="danger" size="sm" onClick={onReject} className="bg-red-50 text-red-600 hover:bg-red-100">
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button variant="primary" size="sm" onClick={onAccept} className="bg-blue-600 text-white hover:bg-blue-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Aceptar Oferta
              </Button>
            </div>
          )}
          {!isMerchant && (
            <Badge variant={offer.estado === 'pendiente' ? 'warning' : offer.estado === 'aceptada' ? 'success' : 'danger'}>
              {offer.estado}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
