import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Truck, Package, ShieldCheck, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { ADMIN_EMAILS } from '../lib/constants';

export const Home = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
      if (user.tipoUsuario === 'admin' || isAdmin) {
        navigate('/admin');
      } else if (user.tipoUsuario === 'comerciante') {
        navigate('/merchant/dashboard');
      } else if (user.tipoUsuario === 'transportista') {
        navigate('/carrier/dashboard');
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col items-center justify-center space-y-20 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900">
            Transporte de carga <span className="text-blue-600">inteligente</span> en Perú
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Conectamos comerciantes con transportistas verificados. Tú propones el precio, ellos ofertan. Sin intermediarios, sin complicaciones.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/register?role=comerciante">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8">
              Soy Comerciante
            </Button>
          </Link>
          <Link to="/register?role=transportista">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8">
              Soy Transportista
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
        <FeatureCard
          icon={<Package className="h-8 w-8 text-blue-600" />}
          title="Publica tu Carga"
          description="Sube los detalles de tu envío y propón un precio justo. Recibe múltiples ofertas en minutos."
        />
        <FeatureCard
          icon={<ShieldCheck className="h-8 w-8 text-blue-600" />}
          title="Transportistas Verificados"
          description="Todos nuestros conductores pasan por un riguroso proceso de validación de documentos."
        />
        <FeatureCard
          icon={<MapPin className="h-8 w-8 text-blue-600" />}
          title="Seguimiento en Vivo"
          description="Monitorea la ubicación de tu carga en tiempo real desde que sale hasta que llega a su destino."
        />
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 rounded-3xl p-12 w-full max-w-7xl mx-auto text-white flex flex-col md:flex-row items-center justify-around gap-8">
        <StatItem label="Viajes Completados" value="+10,000" />
        <StatItem label="Transportistas Activos" value="+500" />
        <StatItem label="Ahorro Promedio" value="25%" />
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center">
    <div className="text-4xl font-bold mb-1">{value}</div>
    <div className="text-blue-100 text-sm font-medium uppercase tracking-wider">{label}</div>
  </div>
);
