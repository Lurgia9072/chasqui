import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Truck, AlertCircle, FileText, Mail, CheckCircle2, Upload, Eye, EyeOff, 
  ShieldCheck, Lock, User, Check, Building2, Package, ArrowLeft, ArrowRight,
  Shield, MapPin, Gauge, Compass, Users, Activity, Settings, Clock, Landmark
} from 'lucide-react';
import { ChasquiLogo } from '../components/ChasquiLogo';
import { User as UserType, AccountType } from '../types';
import { cn, cleanObject, compressImage } from '../lib/utils';
import { ADMIN_EMAILS } from '../lib/constants';
import { motion, AnimatePresence } from 'motion/react';

// Error Handler following the Firebase Integration Skill
function handleFirestoreError(error: unknown, operationType: 'create' | 'write' | 'get', path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Complete Zod schema supporting all 4 profiles with conditional validation
const registerSchema = z.object({
  // Step 1 selected type
  organizationType: z.enum(['casual', 'independent_driver', 'shipper_company', 'transport_company']),

  // 1. Common / Casual fields
  nombre: z.string().optional(),
  email: z.string().optional(),
  telefono: z.string().optional(),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  documento: z.string().optional(),

  // 2. Transportista Independiente Specific Form Fields
  licenciaNumero: z.string().optional(),
  licenciaCategoria: z.string().optional(),
  licenciaVencimiento: z.string().optional(),
  tipoVehiculo: z.string().optional(),
  placa: z.string().optional(),
  capacidad: z.string().optional(),
  vehiculoMarca: z.string().optional(),
  vehiculoModelo: z.string().optional(),
  vehiculoAno: z.string().optional(),
  rutasFrecuentes: z.string().optional(),
  disponibilidad: z.string().optional(),
  tipoCargaAceptada: z.string().optional(),

  // 3. Empresa Agro/Import/SaaS Specific Form Fields
  ruc: z.string().optional(),
  razonSocial: z.string().optional(),
  nombreComercial: z.string().optional(),
  sector: z.string().optional(),
  tamanioEmpresa: z.string().optional(),
  tipoCargaHabitual: z.string().optional(),
  puertoPrincipal: z.string().optional(),
  usaFrio: z.boolean().optional(),
  usaAduanas: z.boolean().optional(),
  frecuenciaDespachos: z.string().optional(),
  nombreResponsable: z.string().optional(),
  cargoResponsable: z.string().optional(),
  correoCorporativo: z.string().optional(),
  telefonoCorporativo: z.string().optional(),
  cantidadUsuarios: z.string().optional(),
  cantidadSedes: z.string().optional(),

  // 4. Empresa de Transporte Specific Form Fields
  anosOperacion: z.string().optional(),
  cantidadVehiculos: z.string().optional(),
  cantidadChoferes: z.string().optional(),
  coberturaNacional: z.string().optional(),
  tipoCargaEmpresa: z.string().optional(),
  almacenesPropios: z.boolean().optional(),
  patiosManiobras: z.boolean().optional(),
  talleresMantenimiento: z.boolean().optional(),
  gerenteOperaciones: z.string().optional(),
  supervisorGps: z.string().optional(),
  responsableDespacho: z.string().optional(),
  monitoristasCantidad: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.organizationType === 'casual') {
    if (!data.nombre || data.nombre.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nombre demasiado corto (Mínimo 3 caracteres)',
        path: ['nombre'],
      });
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email de acceso inválido',
        path: ['email'],
      });
    }
    if (!data.telefono || data.telefono.length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Teléfono debe tener al menos 9 dígitos',
        path: ['telefono'],
      });
    }
  }

  if (data.organizationType === 'independent_driver') {
    if (!data.nombre || data.nombre.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nombre o Razón Social demasiado corta (Mínimo 3 caracteres)',
        path: ['nombre'],
      });
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email de acceso inválido',
        path: ['email'],
      });
    }
    if (!data.telefono || data.telefono.length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Teléfono debe tener al menos 9 dígitos',
        path: ['telefono'],
      });
    }
    if (!data.documento || data.documento.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Documento (DNI/RUC) inválido',
        path: ['documento'],
      });
    }
    if (!data.licenciaNumero || data.licenciaNumero.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Número de licencia inválido (Mínimo 5 caracteres)',
        path: ['licenciaNumero'],
      });
    }
    if (!data.licenciaCategoria || data.licenciaCategoria.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Categoría inválida',
        path: ['licenciaCategoria'],
      });
    }
  }

  if (data.organizationType === 'shipper_company') {
    if (!data.ruc || data.ruc.length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'RUC corporativo debe tener exactamente 11 dígitos',
        path: ['ruc'],
      });
    }
    if (!data.razonSocial || data.razonSocial.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Razón Social es requerida (Mínimo 3 caracteres)',
        path: ['razonSocial'],
      });
    }
    if (!data.nombreResponsable || data.nombreResponsable.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nombre de responsable es requerido (Mínimo 3 caracteres)',
        path: ['nombreResponsable'],
      });
    }
    if (!data.correoCorporativo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correoCorporativo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email corporativo inválido',
        path: ['correoCorporativo'],
      });
    }
    if (!data.telefonoCorporativo || data.telefonoCorporativo.length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Teléfono corporativo debe tener al menos 9 dígitos',
        path: ['telefonoCorporativo'],
      });
    }
  }

  if (data.organizationType === 'transport_company') {
    if (!data.ruc || data.ruc.length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'RUC corporativo debe tener exactamente 11 dígitos',
        path: ['ruc'],
      });
    }
    if (!data.razonSocial || data.razonSocial.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Razón Social es requerida (Mínimo 3 caracteres)',
        path: ['razonSocial'],
      });
    }
    if (!data.anosOperacion || data.anosOperacion.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Años de operación es requerido',
        path: ['anosOperacion'],
      });
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email de acceso corporativio inválido',
        path: ['email'],
      });
    }
    if (!data.telefono || data.telefono.length < 9) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Teléfono de acceso debe tener al menos 9 dígitos',
        path: ['telefono'],
      });
    }
  }
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register = () => {
  const [searchParams] = useSearchParams();
  
  // Dynamic initialization depending on URL parameters
  const initialType = () => {
    const typeQuery = searchParams.get('type') || searchParams.get('role');
    if (typeQuery === 'comerciante_natural' || typeQuery === 'casual' || typeQuery === 'comerciante') {
      return 'casual';
    }
    if (typeQuery === 'transportista_natural' || typeQuery === 'transportista' || typeQuery === 'independent_driver') {
      return 'independent_driver';
    }
    if (typeQuery === 'shipper_company' || typeQuery === 'exportadora' || typeQuery === 'mype_ruc20') {
      return 'shipper_company';
    }
    if (typeQuery === 'transport_company' || typeQuery === 'empresa_transporte' || typeQuery === 'saas_multiflc') {
      return 'transport_company';
    }
    return 'casual';
  };

  const [orgType, setOrgType] = useState<'casual' | 'independent_driver' | 'shipper_company' | 'transport_company'>(initialType());
  const [step, setStep] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Document Upload States
  const [dniUrl, setDniUrl] = useState<string | null>(null);
  const [licenciaUrl, setLicenciaUrl] = useState<string | null>(null);
  const [tarjetaPropiedadUrl, setTarjetaPropiedadUrl] = useState<string | null>(null);
  const [soatUrl, setSoatUrl] = useState<string | null>(null);
  const [vehiculoFotoUrl, setVehiculoFotoUrl] = useState<string | null>(null);

  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationType: initialType(),
      nombre: '',
      email: '',
      telefono: '',
      password: '',
      documento: '',
      usaFrio: false,
      usaAduanas: false,
      almacenesPropios: false,
      patiosManiobras: false,
      talleresMantenimiento: false,
    },
  });

  // Watch orgType changes to keep form value synced
  useEffect(() => {
    setValue('organizationType', orgType);
  }, [orgType, setValue]);

  // Handle Google Sign-In as alternative
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (err) {
        handleFirestoreError(err, 'get', `users/${user.uid}`);
      }
      
      if (!userDoc?.exists()) {
        const isAdminEmail = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '');
        const newUser: UserType = {
          uid: user.uid,
          nombre: user.displayName || 'Usuario Google',
          tipoUsuario: isAdminEmail ? 'admin' : (orgType === 'casual' || orgType === 'shipper_company' ? 'comerciante' : 'transportista'),
          tipoCuenta: orgType === 'shipper_company' || orgType === 'transport_company' ? 'ruc20' : 'natural',
          documento: '',
          telefono: '',
          email: user.email || '',
          verificado: 'verificado',
          rating: 0,
          totalRatings: 0,
          sumRatings: 0,
          completedTrips: 0,
          indiceConfiabilidad: 100,
          createdAt: Date.now(),
          organizationType: orgType,
          documentosUrls: {
            dni: user.photoURL || '',
          },
        };

        try {
          await setDoc(doc(db, 'users', user.uid), cleanObject(newUser));
        } catch (err) {
          handleFirestoreError(err, 'write', `users/${user.uid}`);
        }
        setUser(cleanObject(newUser) as any);
      } else {
        setUser(userDoc.data() as any);
      }

      const freshUserDoc = userDoc?.exists() ? userDoc.data() : null;
      const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '') || freshUserDoc?.tipoUsuario === 'admin';
      
      if (isAdmin) {
        navigate('/admin');
      } else if (orgType === 'casual' || orgType === 'shipper_company') {
        navigate('/merchant/dashboard');
      } else {
        navigate('/carrier/dashboard');
      }
    } catch (err: any) {
      console.error('Error Google Sign-In:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Error al iniciar sesión con Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = (formErrors: any) => {
    console.error('Validation errors:', formErrors);
    const firstErrorKey = Object.keys(formErrors)[0];
    if (firstErrorKey) {
      const errorMsg = formErrors[firstErrorKey]?.message || 'Por favor, completa correctamente todos los campos obligatorios.';
      setError(`Error de validación: ${errorMsg}`);
    }
  };

  // Submit Handler for custom profile schemas
  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    const resolvedEmail = data.email || data.correoCorporativo || '';
    const isAdminEmail = resolvedEmail ? ADMIN_EMAILS.includes(resolvedEmail.toLowerCase()) : false;

    // Identity upload checking constraints
    if (orgType === 'independent_driver') {
      if (!dniUrl || !licenciaUrl || !tarjetaPropiedadUrl || !soatUrl) {
        setError('Debes cargar toda la documentación requerida (DNI, Licencia, Tarjeta de Propiedad, SOAT).');
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, resolvedEmail, data.password);
        user = userCredential.user;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          // Attempt sign in to gracefully capture fallback
          try {
            const userCredential = await signInWithEmailAndPassword(auth, resolvedEmail, data.password);
            user = userCredential.user;
          } catch (signInErr: any) {
            setError('Este correo electrónico ya está registrado. Por favor, recupera tu contraseña o usa uno diferente.');
            setIsLoading(false);
            return;
          }
        } else {
          throw authErr;
        }
      }

      if (!user) throw new Error('Error al inicializar el usuario de autenticación.');

      // 1. Build universal client-side backward compatible user object
      const resolvedTipoUsuario = orgType === 'casual' || orgType === 'shipper_company' ? 'comerciante' : 'transportista';
      const resolvedTipoCuenta = orgType === 'shipper_company' || orgType === 'transport_company' ? 'ruc20' : 'natural';
      const resolvedDocumento = orgType === 'shipper_company' || orgType === 'transport_company' ? data.ruc : data.documento;
      const resolvedName = orgType === 'shipper_company' || orgType === 'transport_company' ? data.razonSocial : data.nombre;

      const newUser: UserType = {
        uid: user.uid,
        nombre: resolvedName || data.nombre,
        tipoUsuario: isAdminEmail ? 'admin' : resolvedTipoUsuario,
        tipoCuenta: resolvedTipoCuenta as AccountType,
        documento: resolvedDocumento || '',
        telefono: data.telefono || data.telefonoCorporativo || '',
        email: data.email || data.correoCorporativo || '',
        verificado: isAdminEmail ? 'verificado' : 'pendiente',
        rating: 0,
        totalRatings: 0,
        sumRatings: 0,
        completedTrips: 0,
        indiceConfiabilidad: 100,
        createdAt: Date.now(),
        organizationId: (orgType === 'shipper_company' || orgType === 'transport_company') ? `${user.uid}_org` : undefined,
        organizationType: orgType,
        ruc: data.ruc || undefined,
        razonSocial: data.razonSocial || undefined,
        sector: data.sector as any || undefined,
        puertoPrincipal: data.puertoPrincipal as any || undefined,
        documentosUrls: {
          dni: dniUrl || '',
          licencia: licenciaUrl || '',
          tarjetaPropiedad: tarjetaPropiedadUrl || '',
          soat: soatUrl || '',
        }
      };

      // Drivers & Vehicles embedded attributes for quick fallback integrations
      if (orgType === 'independent_driver') {
        newUser.licenciaNumero = data.licenciaNumero;
        newUser.licenciaCategoria = data.licenciaCategoria;
        newUser.licenciaVencimiento = data.licenciaVencimiento;
        newUser.vehiculo = {
          tipo: data.tipoVehiculo || '',
          placa: data.placa || '',
          capacidad: data.capacidad || '',
        };
        newUser.vehiculoMarca = data.vehiculoMarca;
        newUser.vehiculoModelo = data.vehiculoModelo;
        newUser.vehiculoAno = data.vehiculoAno;
        newUser.rutasFrecuentes = data.rutasFrecuentes;
        newUser.disponibilidad = data.disponibilidad;
        newUser.tipoCargaAceptada = data.tipoCargaAceptada;
        newUser.zonasOperacion = data.rutasFrecuentes?.split(',').map(s => s.trim()) || [];
      }

      // Shipper company extra fields
      if (orgType === 'shipper_company') {
        newUser.nombreComercial = data.nombreComercial;
        newUser.tamanioEmpresa = data.tamanioEmpresa;
        newUser.usaFrio = data.usaFrio;
        newUser.usaAduanas = data.usaAduanas;
        newUser.frecuenciaDespachos = data.frecuenciaDespachos;
        newUser.nombreResponsable = data.nombreResponsable;
        newUser.cargoResponsable = data.cargoResponsable;
        newUser.cantidadUsuarios = data.cantidadUsuarios ? parseInt(data.cantidadUsuarios) : undefined;
        newUser.cantidadSedes = data.cantidadSedes ? parseInt(data.cantidadSedes) : undefined;
      }

      // Fleet multi-company extra fields
      if (orgType === 'transport_company') {
        newUser.nombreComercial = data.nombreComercial;
        newUser.anosOperacion = data.anosOperacion ? parseInt(data.anosOperacion) : undefined;
        newUser.cantidadVehiculos = data.cantidadVehiculos ? parseInt(data.cantidadVehiculos) : undefined;
        newUser.cantidadChoferes = data.cantidadChoferes ? parseInt(data.cantidadChoferes) : undefined;
        newUser.coberturaNacional = data.coberturaNacional;
        newUser.gerenteOperaciones = data.gerenteOperaciones;
        newUser.supervisorGps = data.supervisorGps;
        newUser.responsableDespacho = data.responsableDespacho;
      }

      // Write User profile backward-compatible doc
      try {
        await setDoc(doc(db, 'users', user.uid), cleanObject(newUser));
      } catch (err) {
        handleFirestoreError(err, 'write', `users/${user.uid}`);
      }

      // 2. Separate Firestore Architecture Structures as mandated (Zero redundancy decoupling)
      if (orgType === 'independent_driver') {
        // Create specialized /drivers/{userId}
        const driverDoc = {
          id: user.uid,
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono,
          licenciaNumero: data.licenciaNumero,
          licenciaCategoria: data.licenciaCategoria,
          licenciaVencimiento: data.licenciaVencimiento,
          rutasFrecuentes: data.rutasFrecuentes,
          disponibilidad: data.disponibilidad,
          tipoCargaAceptada: data.tipoCargaAceptada,
          status: 'activo',
          rating: 5.0,
          createdAt: Date.now()
        };
        try {
          await setDoc(doc(db, 'drivers', user.uid), cleanObject(driverDoc));
        } catch (err) {
          handleFirestoreError(err, 'write', `drivers/${user.uid}`);
        }

        // Create specialized /vehicles/{userId}_vehicle
        const vehicleDoc = {
          id: `${user.uid}_vehicle`,
          ownerId: user.uid,
          tipo: data.tipoVehiculo,
          placa: data.placa,
          capacidad: data.capacidad,
          marca: data.vehiculoMarca,
          modelo: data.vehiculoModelo,
          ano: data.vehiculoAno,
          status: 'activo',
          createdAt: Date.now()
        };
        try {
          await setDoc(doc(db, 'vehicles', `${user.uid}_vehicle`), cleanObject(vehicleDoc));
        } catch (err) {
          handleFirestoreError(err, 'write', `vehicles/${user.uid}_vehicle`);
        }
      }

      if (orgType === 'shipper_company') {
        // Create specialized /organizations/{userId}_org
        const shipperOrg = {
          id: `${user.uid}_org`,
          ruc: data.ruc,
          razonSocial: data.razonSocial,
          nombreComercial: data.nombreComercial,
          sector: data.sector,
          tamanioEmpresa: data.tamanioEmpresa,
          tipoCargaHabitual: data.tipoCargaHabitual,
          puertoPrincipal: data.puertoPrincipal,
          usaFrio: data.usaFrio,
          usaAduanas: data.usaAduanas,
          frecuenciaDespachos: data.frecuenciaDespachos,
          adminUser: user.uid,
          plan: 'business',
          status: 'activo',
          createdAt: Date.now()
        };
        try {
          await setDoc(doc(db, 'organizations', `${user.uid}_org`), cleanObject(shipperOrg));
        } catch (err) {
          handleFirestoreError(err, 'write', `organizations/${user.uid}_org`);
        }

        // Create specialized /operators/{userId} with exact RBAC Role
        const operatorDoc = {
          id: user.uid,
          organizationId: `${user.uid}_org`,
          nombre: data.nombreResponsable,
          cargo: data.cargoResponsable,
          email: data.correoCorporativo || data.email,
          telefono: data.telefonoCorporativo || data.telefono,
          role: 'logistics_manager', // RBAC Role
          status: 'activo',
          createdAt: Date.now()
        };
        try {
          await setDoc(doc(db, 'operators', user.uid), cleanObject(operatorDoc));
        } catch (err) {
          handleFirestoreError(err, 'write', `operators/${user.uid}`);
        }
      }

      if (orgType === 'transport_company') {
        // Create specialized /organizations/{userId}_org
        const transportOrg = {
          id: `${user.uid}_org`,
          ruc: data.ruc,
          razonSocial: data.razonSocial,
          nombreComercial: data.nombreComercial,
          anosOperacion: data.anosOperacion ? parseInt(data.anosOperacion) : undefined,
          cantidadVehiculos: data.cantidadVehiculos ? parseInt(data.cantidadVehiculos) : undefined,
          cantidadChoferes: data.cantidadChoferes ? parseInt(data.cantidadChoferes) : undefined,
          coberturaNacional: data.coberturaNacional,
          adminUser: user.uid,
          plan: 'enterprise_os',
          status: 'activo',
          createdAt: Date.now()
        };
        try {
          await setDoc(doc(db, 'organizations', `${user.uid}_org`), cleanObject(transportOrg));
        } catch (err) {
          handleFirestoreError(err, 'write', `organizations/${user.uid}_org`);
        }

        // Create fleet/ document
        const fleetDoc = {
          id: `${user.uid}_fleet`,
          organizationId: `${user.uid}_org`,
          unidadesEstimadas: data.cantidadVehiculos ? parseInt(data.cantidadVehiculos) : undefined,
          choferesEstimados: data.cantidadChoferes ? parseInt(data.cantidadChoferes) : undefined,
          hasAlmacenes: data.almacenesPropios,
          hasPatios: data.patiosManiobras,
          hasTalleres: data.talleresMantenimiento,
          gerenteOperaciones: data.gerenteOperaciones,
          supervisorGps: data.supervisorGps,
          responsableDespacho: data.responsableDespacho,
          status: 'activo',
          createdAt: Date.now()
        };
        try {
          await setDoc(doc(db, 'fleet', `${user.uid}_fleet`), cleanObject(fleetDoc));
        } catch (err) {
          handleFirestoreError(err, 'write', `fleet/${user.uid}_fleet`);
        }

        // Also create standard operator for administrator
        const transportOperator = {
          id: user.uid,
          organizationId: `${user.uid}_org`,
          nombre: data.gerenteOperaciones || data.nombre,
          cargo: 'Gerente de Operaciones',
          email: data.correoCorporativo || data.email,
          telefono: data.telefonoCorporativo || data.telefono,
          role: 'admin', // RBAC Role
          status: 'activo',
          createdAt: Date.now()
        };
        try {
          await setDoc(doc(db, 'operators', user.uid), cleanObject(transportOperator));
        } catch (err) {
          handleFirestoreError(err, 'write', `operators/${user.uid}`);
        }
      }

      if (!isAdminEmail) {
        const actionCodeSettings = {
          url: window.location.origin + '/login',
          handleCodeInApp: true,
        };
        await sendEmailVerification(user, actionCodeSettings);
        setIsRegistered(true);
      } else {
        setUser(cleanObject(newUser) as any);
        if (newUser.tipoUsuario === 'admin') navigate('/admin');
        else if (newUser.tipoUsuario === 'comerciante') navigate('/merchant/dashboard');
        else navigate('/carrier/dashboard');
      }
    } catch (err: any) {
      console.error('Error general de registro:', err);
      setError(err.message || 'Ocurrió un error al registrar la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine total steps according to the profile
  const getTotalSteps = () => {
    switch (orgType) {
      case 'casual': return 3;
      case 'independent_driver': return 6;
      case 'shipper_company': return 5;
      case 'transport_company': return 6;
    }
  };

  // Step transitions trigger strict dynamic validations
  const handleNextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormValues)[] = [];

    if (step === 1) {
      fieldsToValidate = ['organizationType'];
    } else {
      // Validate depending on organizationType and step
      if (orgType === 'casual') {
        if (step === 2) {
          fieldsToValidate = ['nombre', 'email', 'telefono', 'password'];
        }
      } else if (orgType === 'independent_driver') {
        if (step === 2) {
          fieldsToValidate = ['nombre', 'email', 'telefono', 'documento', 'password'];
        } else if (step === 3) {
          fieldsToValidate = ['licenciaNumero', 'licenciaCategoria', 'licenciaVencimiento'];
        } else if (step === 4) {
          fieldsToValidate = ['tipoVehiculo', 'placa', 'capacidad', 'vehiculoMarca', 'vehiculoModelo', 'vehiculoAno'];
        } else if (step === 5) {
          // Documents validation: Handled via state checking below
          if (!dniUrl || !licenciaUrl || !tarjetaPropiedadUrl || !soatUrl) {
            setError('Por favor, sube los 4 documentos requeridos para continuar.');
            return;
          }
          setError(null);
        }
      } else if (orgType === 'shipper_company') {
        if (step === 2) {
          fieldsToValidate = ['ruc', 'razonSocial', 'nombreComercial', 'sector', 'tamanioEmpresa'];
        } else if (step === 3) {
          fieldsToValidate = ['tipoCargaHabitual', 'puertoPrincipal', 'frecuenciaDespachos'];
        } else if (step === 4) {
          fieldsToValidate = ['nombreResponsable', 'cargoResponsable', 'correoCorporativo', 'telefonoCorporativo', 'password'];
        }
      } else if (orgType === 'transport_company') {
        if (step === 2) {
          fieldsToValidate = ['ruc', 'razonSocial', 'nombreComercial', 'anosOperacion'];
        } else if (step === 3) {
          fieldsToValidate = ['cantidadVehiculos', 'cantidadChoferes', 'coberturaNacional', 'tipoCargaEmpresa'];
        } else if (step === 4) {
          // Checkboxes are optional / layout validated
          fieldsToValidate = ['cantidadSedes'];
        } else if (step === 5) {
          fieldsToValidate = ['gerenteOperaciones', 'supervisorGps', 'responsableDespacho', 'email', 'telefono', 'password'];
        }
      }
    }

    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
    if (isValid) {
      setError(null);
      setStep(s => s + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'dni' | 'licencia' | 'tarjetaPropiedad' | 'soat' | 'vehiculoFoto') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 800, 800, 0.5);
        if (type === 'dni') setDniUrl(compressedBase64);
        if (type === 'licencia') setLicenciaUrl(compressedBase64);
        if (type === 'tarjetaPropiedad') setTarjetaPropiedadUrl(compressedBase64);
        if (type === 'soat') setSoatUrl(compressedBase64);
        if (type === 'vehiculoFoto') setVehiculoFotoUrl(compressedBase64);
      } catch (err) {
        setError('Error al procesar y comprimir la imagen.');
      }
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff04_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full text-center space-y-8 z-10"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-950 text-indigo-400 rotate-3 border border-indigo-900/30">
            <Mail className="h-10 w-10 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight">¡Verifica tu cuenta!</h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
              Hemos enviado un enlace de activación a tu correo de acceso corporativo. Revisa tu bandeja de entrada o spam.
            </p>
          </div>
          <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-900/40 text-left flex gap-3">
             <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
             <p className="text-[11px] font-bold text-emerald-300 leading-relaxed">
               Una vez verificado tu correo, tu acceso al SaaS se activará de forma inmediata para operar.
             </p>
          </div>
          <Button className="w-full h-14 text-sm font-black uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-blue-600" onClick={() => navigate('/login')}>
            Ir al Inicio de Sesión
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans bg-slate-950 text-slate-100">
      {/* Left Column - Custom Marketing Walls per Onboarding Context */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-900 overflow-hidden relative border-r border-slate-850">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px]"></div>
        
        {/* Top Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex hover:opacity-85 transition-opacity">
            <ChasquiLogo variant="white" />
          </Link>
        </div>

        {/* Dynamic Contextual Text reflecting selected OrgType */}
        <div className="relative z-10 space-y-8 max-w-md">
          <AnimatePresence mode="wait">
            {orgType === 'casual' && (
              <motion.div 
                key="casual_m" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-950/40 text-orange-400 border border-orange-900/30 text-[9px] font-black uppercase tracking-widest rounded-full">
                  <Package className="h-3 w-3" /> Cargas Casuales & Mudanzas
                </div>
                <h1 className="text-4xl font-extrabold text-white leading-tight uppercase">
                  Mueve tus bienes de forma <span className="text-orange-400 font-black">segura y rápida</span>
                </h1>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Conecta al instante con transportistas formales verificados. Custodia Escrow Chasqui protege el 100% de tus pagos de flete.
                </p>
              </motion.div>
            )}
            {orgType === 'independent_driver' && (
              <motion.div 
                key="driver_m" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 text-[9px] font-black uppercase tracking-widest rounded-full">
                  <Truck className="h-3 w-3" /> Conductores Independientes
                </div>
                <h1 className="text-4xl font-extrabold text-white leading-tight uppercase">
                  Consigue cargas directo <span className="text-emerald-400 font-black">sin comisiones absurdas</span>
                </h1>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Evita regresos vacíos de furgoneta. Consigue pagos asegurados depositados en custodia, listos para retirar al concluir tus entregas.
                </p>
              </motion.div>
            )}
            {orgType === 'shipper_company' && (
              <motion.div 
                key="shipper_m" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 text-[9px] font-black uppercase tracking-widest rounded-full">
                  <Building2 className="h-3 w-3" /> Distribución & Export / Import
                </div>
                <h1 className="text-4xl font-extrabold text-white leading-tight uppercase">
                  Torre de control digital para <span className="text-indigo-400 font-black">logística RUC-20</span>
                </h1>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Monitorea sensores IoT de cadena de frío en tiempo real, rastrea geocercas aduaneras e integra tu equipo en un solo pipeline omnicanal.
                </p>
              </motion.div>
            )}
            {orgType === 'transport_company' && (
              <motion.div 
                key="fleet_m" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/40 text-purple-400 border border-purple-900/30 text-[9px] font-black uppercase tracking-widest rounded-full">
                  <ShieldCheck className="h-3 w-3" /> Multi-Fleet Enterprise SaaS
                </div>
                <h1 className="text-4xl font-extrabold text-white leading-tight uppercase">
                  SaaS de control para <span className="text-purple-400 font-black">empresas de transporte</span>
                </h1>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  La solución definitiva ERP para flotas. Gestiona vehículos, despacha con guías de remisión, audita SOATs y asigna chóferes de forma masiva.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Key Value Checklist */}
          <div className="space-y-4 pt-6 border-t border-slate-850">
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-350 text-xs font-black">Certificación RUC y DNI Sunat integrada</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-350 text-xs font-black">Monitoreo satelital y telemetría fría IoT lista</span>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="relative z-10 flex justify-between items-center text-[10px] font-mono text-slate-500">
          <span>CHASQUI OS V2.8</span>
          <span>© 2026 CHASQUI LOGISTICS</span>
        </div>
      </div>

      {/* Right Column - Premium Wizard Form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16 bg-slate-950 overflow-y-auto">
        <div className="max-w-xl w-full mx-auto space-y-8">
          
          {/* Mobile Logo Fallback */}
          <div className="lg:hidden flex justify-center mb-4">
             <Link to="/"><ChasquiLogo size="sm" variant="white" /></Link>
          </div>

          {/* Stepper Header */}
          <div className="space-y-4 border-b border-slate-900 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Onboarding Chasqui</h2>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">— Completa tu registro de perfil logístico —</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paso {step} / {getTotalSteps()}</span>
                <div className="flex gap-1 mt-1.5">
                  {Array.from({ length: getTotalSteps() }).map((_, sIdx) => {
                    const currentPass = sIdx + 1;
                    return (
                      <div 
                        key={currentPass} 
                        className={cn(
                          "h-1 w-4 rounded-full transition-all duration-300", 
                          step >= currentPass ? "bg-indigo-500" : "bg-slate-800"
                        )} 
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-400 text-xs font-semibold flex gap-2.5"
                >
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Sign In option on step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 h-12 border border-slate-800 hover:border-slate-750 bg-slate-900 hover:bg-slate-900/80 rounded-xl px-4 transition-all"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-200">Onboarding Rápido con Google</span>
                </button>
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-550">
                  <div className="h-px flex-1 bg-slate-900"></div>
                  <span>o configurar pipeline de datos manual</span>
                  <div className="h-px flex-1 bg-slate-900"></div>
                </div>
              </div>
            )}

            {/* STEP 1: Professional Visual Role/Account Type selection */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase text-center">— Selecciona tu tipo de perfil logístico —</p>
                <div className="grid grid-cols-1 gap-3">
                  
                  {/* Account Type 1: Casual */}
                  <button 
                    type="button" 
                    onClick={() => setOrgType('casual')} 
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] w-full relative overflow-hidden group", 
                      orgType === 'casual' 
                        ? "border-orange-500/70 bg-orange-950/10" 
                        : "border-slate-900 hover:border-slate-800 bg-slate-900/40"
                    )}
                  >
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform", 
                      orgType === 'casual' ? "bg-orange-500 text-black font-extrabold" : "bg-slate-900 text-slate-400 group-hover:scale-105"
                    )}>
                      <Package className="h-5.5 w-5.5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase tracking-wider">Carga Casual / Mudanza</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60 tracking-widest">GRATIS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1 font-semibold">Pequeños comercios y mudanzas ocasionales. Rastreo simple y resguardo Escrow.</p>
                    </div>
                  </button>

                  {/* Account Type 2: Independent Driver */}
                  <button 
                    type="button" 
                    onClick={() => setOrgType('independent_driver')} 
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] w-full relative overflow-hidden group", 
                      orgType === 'independent_driver' 
                        ? "border-emerald-500/70 bg-emerald-950/10" 
                        : "border-slate-900 hover:border-slate-800 bg-slate-900/40"
                    )}
                  >
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform", 
                      orgType === 'independent_driver' ? "bg-emerald-500 text-black font-extrabold" : "bg-slate-900 text-slate-400 group-hover:scale-105"
                    )}>
                      <Truck className="h-5.5 w-5.5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase tracking-wider">Transportista Independiente</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60 tracking-widest">GRATIS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1 font-semibold">Conductor con vehículo propio. Evita regresos vacíos con pagos custodia garantizados.</p>
                    </div>
                  </button>

                  {/* Account Type 3: Shipper Company */}
                  <button 
                    type="button" 
                    onClick={() => setOrgType('shipper_company')} 
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] w-full relative overflow-hidden group", 
                      orgType === 'shipper_company' 
                        ? "border-indigo-500/70 bg-indigo-950/10" 
                        : "border-slate-900 hover:border-slate-800 bg-slate-900/40"
                    )}
                  >
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform", 
                      orgType === 'shipper_company' ? "bg-indigo-550 text-white font-extrabold" : "bg-slate-900 text-slate-400 group-hover:scale-105"
                    )}>
                      <Building2 className="h-5.5 w-5.5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase tracking-wider">Empresa Importadora / Exportadora</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-900/60 tracking-widest">BUSINESS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1 font-semibold">Empresas agro, importadoras y MYPE con RUC-20. Alertas termo IoT de frío & aduanas.</p>
                    </div>
                  </button>

                  {/* Account Type 4: Transport Company / Fleet SaaS */}
                  <button 
                    type="button" 
                    onClick={() => setOrgType('transport_company')} 
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] w-full relative overflow-hidden group", 
                      orgType === 'transport_company' 
                        ? "border-purple-500/70 bg-purple-950/10" 
                        : "border-slate-900 hover:border-slate-800 bg-slate-900/40"
                    )}
                  >
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform", 
                      orgType === 'transport_company' ? "bg-purple-550 text-white font-extrabold" : "bg-slate-900 text-slate-400 group-hover:scale-105"
                    )}>
                      <ShieldCheck className="h-5.5 w-5.5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase tracking-wider">Empresa de Transporte (Flotas)</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-900/60 tracking-widest">ENTERPRISE OS</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1 font-semibold">Operadores logísticos multi-vehículo. SaaS integral para chóferes, SOAT y despachos.</p>
                    </div>
                  </button>

                </div>

                <div className="flex justify-end pt-5 border-t border-slate-900">
                  <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs uppercase font-black tracking-wider bg-indigo-600 hover:bg-indigo-500 rounded-xl">
                    Continuar Onboarding <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* DYNAMIC PIPELINES STEPS ACCORDING TO USER ROLE */}
            
            {/* 1. CASUAL PIPELINE */}
            {orgType === 'casual' && (
              <>
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <Input label="Nombre Completo" placeholder="Juan Pérez" {...register('nombre')} error={errors.nombre?.message} className="bg-slate-900 border-slate-800 text-white" />
                    <Input label="Email de Acceso" type="email" placeholder="juan.perez@email.com" {...register('email')} error={errors.email?.message} className="bg-slate-900 border-slate-800 text-white" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Teléfono Celular" placeholder="999 888 777" {...register('telefono')} error={errors.telefono?.message} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="DNI o RUC (Opcional)" placeholder="40292819" {...register('documento')} error={errors.documento?.message} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <Input 
                      label="Contraseña" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Min. 8 caracteres, números y mayúscula" 
                      {...register('password')} 
                      error={errors.password?.message} 
                      className="bg-slate-900 border-slate-800 text-white animate-fade-in"
                      suffix={
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white transition-colors">
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      }
                    />

                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase tracking-wider bg-indigo-600 rounded-xl">Siguiente</Button>
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-850 flex flex-col items-center text-center space-y-4">
                      <Landmark className="h-8 w-8 text-orange-400" />
                      <h4 className="text-sm font-black uppercase text-white">Verificación Biométrica</h4>
                      <p className="text-[11px] text-slate-400 font-medium">Sube una foto clara de tu DNI o RUC. Esto aumenta la confianza con los transportistas certificados de la plataforma.</p>
                      <div className="w-full max-w-xs">
                        <UploadBox id="dni-casual" active={!!dniUrl} label="Foto del documento (Frente)" onChange={(e) => handleFileUpload(e, 'dni')} />
                      </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Retroceder</Button>
                      <Button type="submit" isLoading={isLoading} className="px-12 h-13 text-xs font-black uppercase tracking-widest bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl shadow-lg">Finalizar Envío</Button>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* 2. INDEPENDENT DRIVER PIPELINE */}
            {orgType === 'independent_driver' && (
              <>
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <Input label="Nombre del Conductor" placeholder="Alberto Rosales" {...register('nombre')} error={errors.nombre?.message} className="bg-slate-900 border-slate-800 text-white" />
                    <Input label="Correo Electrónico" type="email" placeholder="alberto@email.com" {...register('email')} error={errors.email?.message} className="bg-slate-900 border-slate-800 text-white" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Teléfono Celular" placeholder="945 224 112" {...register('telefono')} error={errors.telefono?.message} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="DNI del Titular" placeholder="29182394" {...register('documento')} error={errors.documento?.message} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <Input 
                      label="Contraseña de Acceso" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Min. 8 caracteres, números y mayúsculas" 
                      {...register('password')} 
                      error={errors.password?.message} 
                      className="bg-slate-900 border-slate-800 text-white"
                      suffix={
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white transition-colors">
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      }
                    />
                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl">Licencia de Conducir →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-emerald-400 tracking-widest mb-2">— Datos de Licencia MTC —</h3>
                    <Input label="Número de Licencia" placeholder="Q40291928" {...register('licenciaNumero')} error={errors.licenciaNumero?.message} className="bg-slate-900 border-slate-800 text-white" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Categoría (AIIb, AIIc, etc)" placeholder="AIIIc" {...register('licenciaCategoria')} error={errors.licenciaCategoria?.message} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Fecha de Vencimiento" type="date" {...register('licenciaVencimiento')} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl">Vehículo →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-emerald-400 tracking-widest mb-2">— Especificaciones del Vehículo —</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tipo de Carrocería</label>
                        <select {...register('tipoVehiculo')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="seco">Seco o General</option>
                          <option value="refrigerado">Refrigerado (Termo)</option>
                          <option value="isotermico">Isotérmico</option>
                          <option value="plataforma">Plataforma</option>
                          <option value="grua">Grúa</option>
                        </select>
                      </div>
                      <Input label="Placa del Vehículo" placeholder="F4T-829" {...register('placa')} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Capacidad de Carga" placeholder="8 Toneladas" {...register('capacidad')} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Marca del Unidad" placeholder="Volvo" {...register('vehiculoMarca')} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Modelo" placeholder="FMX" {...register('vehiculoModelo')} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Año de Fabricación" placeholder="2019" {...register('vehiculoAno')} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl">Cargar Archivos →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 5 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <h3 className="text-xs font-black uppercase text-emerald-400 tracking-widest mb-2">— Subir Documentación Obligatoria (Foto o PDF) —</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <UploadBox id="dni-driver" active={!!dniUrl} label="Cargar DNI" onChange={(e) => handleFileUpload(e, 'dni')} />
                      <UploadBox id="lic-driver" active={!!licenciaUrl} label="Licencia MTC" onChange={(e) => handleFileUpload(e, 'licencia')} />
                      <UploadBox id="tar-driver" active={!!tarjetaPropiedadUrl} label="Tarj. Propiedad" onChange={(e) => handleFileUpload(e, 'tarjetaPropiedad')} />
                      <UploadBox id="soat-driver" active={!!soatUrl} label="SOAT Vigente" onChange={(e) => handleFileUpload(e, 'soat')} />
                    </div>
                    <div className="pt-2">
                      <UploadBox id="veh-driver" size="small" active={!!vehiculoFotoUrl} label="Foto del Vehículo (Opcional)" onChange={(e) => handleFileUpload(e, 'vehiculoFoto')} />
                    </div>
                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl">Preferencias →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 6 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-emerald-400 tracking-widest mb-2">— Rutas y Disponibilidad —</h3>
                    <Input label="Rutas/Zonas Frecuentes (Separadas por comas)" placeholder="Lima, Chimbote, Trujillo" {...register('rutasFrecuentes')} className="bg-slate-900 border-slate-800 text-white" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Disponibilidad de Servicio</label>
                        <select {...register('disponibilidad')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="inmediata">Contacto Inmediato</option>
                          <option value="planificada">Solo Viajes Programados</option>
                          <option value="fines_de_semana">Fines de Semana</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Carga Aceptada</label>
                        <select {...register('tipoCargaAceptada')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="general_seco">Carga General / Seca</option>
                          <option value="refrigerado">Agro / Palta / Frío</option>
                          <option value="mudanzas_paquetes">Mudanzas y Paqueterías</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="submit" isLoading={isLoading} className="px-12 h-13 text-xs font-black uppercase bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-950/25">Finalizar Registro</Button>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* 3. SHIPPER COMPANY PIPELINE (RUC agro/import) */}
            {orgType === 'shipper_company' && (
              <>
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-1">— Registro Fiscal Sunat (RUC) —</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="RUC de Empresa" placeholder="20123456789" {...register('ruc')} error={errors.ruc?.message} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Razón Social" placeholder="Exportadora Agrícola del Norte S.A.C." {...register('razonSocial')} error={errors.razonSocial?.message} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <Input label="Nombre Comercial" placeholder="AgroNorte Export" {...register('nombreComercial')} className="bg-slate-900 border-slate-800 text-white" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-semibold">Sector Industrial</label>
                        <select {...register('sector')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="agroindustrial">Agroindustrial / Frutas / Vegetales</option>
                          <option value="alimentos_procesados">Alimentos Procesados</option>
                          <option value="metalmecanica">Metalmecánica / Maquinaria</option>
                          <option value="confecciones">Textil & Confecciones</option>
                          <option value="otro">Distribución Diversa</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tamaño de Empresa</label>
                        <select {...register('tamanioEmpresa')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="mype">Micro / Pequeña (1-20 personas)</option>
                          <option value="mediana">Mediana (21-100 personas)</option>
                          <option value="corporativa">Gran Empresa / Exportadora (+100)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl">Logística →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-1">— Operación Logística —</h3>
                    <Input label="Tipo de Mercadería Habitual" placeholder="Palta hass, espárragos frescos, conservas" {...register('tipoCargaHabitual')} className="bg-slate-900 border-slate-800 text-white" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left bg-slate-900 px-4 py-3 rounded-xl border border-slate-850 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-300">Cadena de Frío Termo IoT</span>
                        <input type="checkbox" {...register('usaFrio')} className="w-4.5 h-4.5 text-indigo-600 bg-slate-900 border-slate-800 rounded focus:ring-indigo-505" />
                      </div>
                      <div className="space-y-1.5 text-left bg-slate-900 px-4 py-3 rounded-xl border border-slate-850 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-300">Monitoreo aduanero geolocalizado</span>
                        <input type="checkbox" {...register('usaAduanas')} className="w-4.5 h-4.5 text-indigo-600 bg-slate-900 border-slate-800 rounded focus:ring-indigo-505" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Puerto Frecuente</label>
                        <select {...register('puertoPrincipal')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="callao">Puerto del Callao (APM/DPW)</option>
                          <option value="paita">Puerto de Paita</option>
                          <option value="matarani">Puerto de Matarani</option>
                          <option value="ilo">Puerto de Ilo</option>
                          <option value="otro">Ninguno / Operaciones Terrestres</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-semibold">Frecuencia Mensual de Despachos</label>
                        <select {...register('frecuenciaDespachos')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="esporadico">Menos de 10 fletes / mes</option>
                          <option value="frecuente">11 a 50 fletes / mes</option>
                          <option value="masivo">Más de 50 fletes / mes (Corporativo)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl font-black">Coordinador →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-1">— Responsable de Logística —</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Responsable de Operaciones" placeholder="Ernesto Silva" {...register('nombreResponsable')} error={errors.nombreResponsable?.message} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Cargo Corp." placeholder="Gerente de Logística" {...register('cargoResponsable')} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Email Corporativo" type="email" placeholder="esilva@agronorte.com" {...register('correoCorporativo')} error={errors.correoCorporativo?.message} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Celular Corporativo" placeholder="945 112 004" {...register('telefonoCorporativo')} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <Input 
                      // Field mapped to master password for authentication
                      label="Contraseña del Sistema" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Contraseña robusta para acceso multiusuario" 
                      {...register('password')} 
                      error={errors.password?.message} 
                      className="bg-slate-900 border-slate-800 text-white animate-fade-in"
                      suffix={
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white transition-colors">
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      }
                    />

                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl">SaaS Plan →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 5 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-widest mb-1">— Configuración SaaS Business —</h3>
                    <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-white uppercase tracking-wider">Plan Logístico: Chasqui Business SaaS</span>
                        <span className="text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-900/30 font-black text-[9px] tracking-widest">S/. 250 / mes</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">Acceso a torre de control Cold-Chain telemetry, generación PDF de remisión, reportes SUNAT de trazabilidad, simulador de rutas terrestres copiloto IA, multisedes y alertas instantáneas.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Usuarios Multiórgano Estimados</label>
                        <select {...register('cantidadUsuarios')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="5">Hasta 5 analistas logísticos</option>
                          <option value="15">Hasta 15 analistas logísticos</option>
                          <option value="unlimited">Ilimitado (SaaS Enterprise)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-semibold">Sedes Operativas / Sucursales</label>
                        <select {...register('cantidadSedes')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="1">1 Sede Principal (Almacén)</option>
                          <option value="3">Arriba de 3 sedes/plantas de empaque</option>
                          <option value="max">Control Multi-Sede Global</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="submit" isLoading={isLoading} className="px-12 h-13 text-xs font-black uppercase bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg shadow-indigo-950/25">Lanzar Sandbox Business</Button>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* 4. TRANSPORT ENTERPRISE MULTI-FLEET PIPELINE */}
            {orgType === 'transport_company' && (
              <>
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest mb-1">— Registro Fiscal OS (RUC) —</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="RUC Empresa de Transporte" placeholder="20123456789" {...register('ruc')} error={errors.ruc?.message} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Razón Social Corp." placeholder="Corporación de Transportes del Sur SAC" {...register('razonSocial')} error={errors.razonSocial?.message} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Nombre de Marca / Comercial" placeholder="Transportes Sur" {...register('nombreComercial')} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Años de Operación en el Mercado" placeholder="12" {...register('anosOperacion')} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl">Estimar Flota →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest mb-1">— Unidades & Personal en Plantilla —</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Cantidad de Camiones / Furgones" placeholder="18" {...register('cantidadVehiculos')} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Cantidad Choferes Activos" placeholder="20" {...register('cantidadChoferes')} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cobertura Geográfica</label>
                        <select {...register('coberturaNacional')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="nacional">Cobertura Todo el Perú</option>
                          <option value="costa">Ruta Especializada Costa / Panamericana</option>
                          <option value="sierra_selva">Ruta Especializada Sierra y Selva</option>
                          <option value="lima_callao">Solo Envíos Locales Lima & Callao</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Especialidad de Carga</label>
                        <select {...register('tipoCargaEmpresa')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="generales_pesados">Carga Seca Pesada / Contenedores</option>
                          <option value="refrigerados">Frío / Agroindustrial / Especializado</option>
                          <option value="quimico_peligrosos">Peligrosos / IQBF / Hidrocarburos</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl">Infraestructura →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                    <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest mb-1">— Infraestructura Física —</h3>
                    <Input label="Sedes Operativas Totales" placeholder="2" {...register('cantidadSedes')} className="bg-slate-900 border-slate-800 text-white" />
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between p-3.5 bg-slate-900 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-black uppercase text-slate-300">¿Cuenta con Almacenes Propios para Consolidación?</span>
                        <input type="checkbox" {...register('almacenesPropios')} className="w-4.5 h-4.5 text-purple-600 bg-slate-900 border-slate-800 rounded focus:ring-purple-505" />
                      </div>
                      <div className="flex items-center justify-between p-3.5 bg-slate-900 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-black uppercase text-slate-300">¿Cuenta con Patios de Maniobra Propios?</span>
                        <input type="checkbox" {...register('patiosManiobras')} className="w-4.5 h-4.5 text-purple-600 bg-slate-900 border-slate-800 rounded focus:ring-purple-505" />
                      </div>
                      <div className="flex items-center justify-between p-3.5 bg-slate-900 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-black uppercase text-slate-300">¿Cuenta con Talleres de Mantenimiento / Correctivos?</span>
                        <input type="checkbox" {...register('talleresMantenimiento')} className="w-4.5 h-4.5 text-purple-600 bg-slate-900 border-slate-800 rounded focus:ring-purple-505" />
                      </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl">Personal →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 5 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest mb-1">— Cargos Logísticos Clave —</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input label="Gerente de Operaciones" placeholder="Raúl Mendoza" {...register('gerenteOperaciones')} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Supervisor GPS" placeholder="Carlos Gómez" {...register('supervisorGps')} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Responsable Despacho" placeholder="Hugo Torres" {...register('responsableDespacho')} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Correo y Telefono aligned with Auth system variables */}
                      <Input label="Email de Acceso Empresa" type="email" placeholder="operaciones@transportsur.com" {...register('email')} error={errors.email?.message} className="bg-slate-900 border-slate-800 text-white" />
                      <Input label="Celular Corporativo" placeholder="990 123 008" {...register('telefono')} error={errors.telefono?.message} className="bg-slate-900 border-slate-800 text-white" />
                    </div>
                    <Input 
                      label="Contraseña Corporativa" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Indroduce la clave robusta del sistema" 
                      {...register('password')} 
                      error={errors.password?.message} 
                      className="bg-slate-900 border-slate-800 text-white animate-fade-in"
                      suffix={
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white transition-colors">
                          {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                      }
                    />

                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="button" onClick={handleNextStep} className="px-10 h-12 text-xs font-black uppercase bg-indigo-600 rounded-xl">Consola Matrix →</Button>
                    </div>
                  </motion.div>
                )}
                {step === 6 && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-purple-400 tracking-widest mb-1">— Configuración SaaS Enterprise —</h3>
                    <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-white uppercase tracking-wider">Sujeto a: Plan Enterprise OS SaaS</span>
                        <span className="text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-900/30 font-black text-[9px] tracking-widest">S/. 490 / mes</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">Modulo GPS masivo omnicanal, alertas operativas críticas MTC de SOAT/Placas vencidos, control de odómetros preventivos, despacho masivo telemático con firmas de entrega telemática y soporte dedicado RUC-20.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Monitoristas Dedicados estimas</label>
                        <select {...register('monitoristasCantidad')} className="w-full h-11 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none">
                          <option value="2">Hasta 2 Monitoristas GPS activos</option>
                          <option value="5">Hasta 5 Monitoristas GPS activos</option>
                          <option value="unlimited">Centro de Monitoreo GPS Completo (+10)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 text-left border-dashed border border-slate-850 p-2 rounded-xl flex items-center justify-center">
                        <p className="text-[9px] text-center text-slate-500 font-bold uppercase">Consola de Control Multi-Sede & Conductores Habilitado por RUC</p>
                      </div>
                    </div>
                    <div className="flex justify-between pt-6 border-t border-slate-900">
                      <Button type="button" variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-white font-black text-xs uppercase">Atrás</Button>
                      <Button type="submit" isLoading={isLoading} className="px-12 h-13 text-xs font-black uppercase bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl shadow-lg shadow-purple-950/25">Lanzar Sandbox Enterprise</Button>
                    </div>
                  </motion.div>
                )}
              </>
            )}

          </form>

          <p className="text-center text-xs font-bold text-slate-500 pt-3">
            ¿Ya eres miembro? <Link to="/login" className="font-black text-indigo-400 hover:text-indigo-300 underline uppercase tracking-wider text-[11px] ml-1">Inicia sesión</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

// Internal sub-component UploadBox for document styling
const UploadBox = ({ id, label, active, size = "large", onChange }: { id: string; label: string; active: boolean; size?: "small" | "large"; onChange: (e: any) => void }) => (
  <div className="w-full flex flex-col items-center gap-1.5 font-sans">
    <input type="file" accept="image/*" onChange={onChange} className="hidden" id={id} />
    <label 
      htmlFor={id} 
      className={cn(
        "flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all w-full", 
        size === "small" ? "h-20" : "h-24 bg-slate-900 border-slate-800", 
        active 
          ? "border-emerald-500/70 bg-emerald-950/15" 
          : "border-slate-805 hover:border-slate-700"
      )}
    >
      {active ? (
        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
      ) : (
        <Upload className="h-5.5 w-5.5 text-slate-550 group-hover:text-slate-400" />
      )}
      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-2 text-center px-2">{label}</span>
      {active && <span className="text-[7px] text-emerald-500 font-extrabold tracking-tight mt-0.5">CARGADO</span>}
    </label>
  </div>
);
