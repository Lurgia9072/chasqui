import React from 'react';
import { MapPin, Package, Calendar, ArrowRight, User, Truck, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardFooter } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { PriceTag } from './PriceTag';
import { StatusBadge } from './StatusBadge';
import { Trip } from '../../types';
import { format as dateFnsFormat } from 'date-fns';
import { es } from 'date-fns/locale';

interface TripCardProps {
  trip: Trip;
  cargoName: string;
  partnerName: string;
  onClick?: () => void;
  className?: string;
  isMerchant?: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, cargoName, partnerName, onClick, className, isMerchant = false }) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'group cursor-pointer border-gray-200 transition-all hover:border-blue-500 hover:shadow-xl',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {cargoName}
              </h3>
              <p className="text-sm text-gray-500">
                {isMerchant ? 'Transportista: ' : 'Comerciante: '}
                <span className="font-bold text-gray-700">{partnerName}</span>
              </p>
            </div>
          </div>
          <StatusBadge 
            status={trip.estado} 
            detail={trip.temperaturaActual || (trip.estado === 'recojo_completado' ? (trip as any).recojoTemp ? `${(trip as any).recojoTemp}°C` : undefined : undefined)} 
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="mt-1 flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <div className="h-10 w-0.5 bg-gray-200" />
              <div className="h-2 w-2 rounded-full bg-red-600" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Origen</p>
                <p className="text-sm font-bold text-gray-900">{trip.origen}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Destino</p>
                <p className="text-sm font-bold text-gray-900">{trip.destino}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">
                {dateFnsFormat(trip.createdAt, "d 'de' MMMM", { locale: es })}
              </span>
            </div>
            <PriceTag amount={trip.precioFinal} size="md" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center space-x-2 text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium">Actualizado hace poco</span>
        </div>
        <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
          Ver seguimiento
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
