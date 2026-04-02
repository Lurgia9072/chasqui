import { collection, addDoc, updateDoc, doc, deleteDoc, getDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Cargo, Offer, Trip } from '../types';

export const cargoService = {
  async postCargo(data: Omit<Cargo, 'id' | 'estado' | 'createdAt'>) {
    return addDoc(collection(db, 'cargas'), {
      ...data,
      estado: 'disponible',
      createdAt: Date.now(),
    });
  },

  async makeOffer(cargoId: string, data: Omit<Offer, 'id' | 'estado' | 'createdAt'>) {
    return addDoc(collection(db, 'cargas', cargoId, 'offers'), {
      ...data,
      estado: 'pendiente',
      createdAt: Date.now(),
    });
  },

  async acceptOffer(cargoId: string, offer: Offer, merchantId: string, origen: string, destino: string) {
    const tripData: Omit<Trip, 'id'> = {
      cargoId: cargoId,
      comercianteId: merchantId,
      transportistaId: offer.transportistaId,
      origen,
      destino,
      precioFinal: offer.precioOfertado,
      comision: offer.precioOfertado * 0.1,
      estado: 'en_progreso',
      seguimiento: { lat: -12.046374, lng: -77.042793, updatedAt: Date.now() },
      createdAt: Date.now(),
    };

    const tripRef = await addDoc(collection(db, 'viajes'), tripData);
    await updateDoc(doc(db, 'cargas', cargoId), { estado: 'asignado' });
    await updateDoc(doc(db, 'cargas', cargoId, 'offers', offer.id), { estado: 'aceptada' });
    
    return tripRef.id;
  },

  async completeTrip(tripId: string) {
    return updateDoc(doc(db, 'viajes', tripId), { estado: 'completado' });
  }
};
