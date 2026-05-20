import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { 
  History, AlertCircle, Menu, X, User, LogOut, Package, 
  Globe, ChevronDown, Building2, ShieldCheck, Play, ArrowRight, Truck, Plus 
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { NotificationBell } from './NotificationBell';
import { ADMIN_EMAILS } from '../lib/constants';
import { ChasquiLogo } from './ChasquiLogo';
import { cn } from '../lib/utils';

export const Navbar = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isDemosOpen, setIsDemosOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const demosDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isAdmin = user && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const orgType = user ? (user.organizationType || (user.tipoUsuario === 'comerciante' ? 'casual' : 'independent_driver')) : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSolutionsOpen(false);
      }
      if (demosDropdownRef.current && !demosDropdownRef.current.contains(event.target as Node)) {
        setIsDemosOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to scroll to hash anchor on home page
  const handleScrollToAnchor = (id: string) => {
    setIsMenuOpen(false);
    setIsSolutionsOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + id);
    } else {
      const element = document.getElementById(id.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/95 backdrop-blur-md text-slate-150 shadow-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center shrink-0">
          <ChasquiLogo variant="white" size="sm" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 animate-fade-in text-slate-300">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-1 text-xs font-black uppercase text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              
              {orgType === 'casual' && (
                <>
                  <Link
                    to="/merchant/dashboard"
                    className="text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
                  >
                    Panel Operativo Carga Casual
                  </Link>
                  <Link
                    to="/merchant/post-cargo"
                    className="text-xs font-black uppercase text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Publicar Carga
                  </Link>
                </>
              )}

              {orgType === 'independent_driver' && (
                <Link
                  to="/carrier/dashboard"
                  className="text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
                >
                  Bolsa de Cargas (Fletes)
                </Link>
              )}

              {orgType === 'shipper_company' && (
                <>
                  <Link
                    to="/shipper-os"
                    className="text-xs font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors flex items-center space-x-1"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span>Torre de Control (Shipper)</span>
                  </Link>
                  <Link
                    to="/merchant/post-cargo"
                    className="text-xs font-black uppercase text-slate-300 hover:text-white transition-colors text-xs"
                  >
                    Nueva Carga Industrial
                  </Link>
                </>
              )}

              {orgType === 'transport_company' && (
                <>
                  <Link
                    to="/fleet-os"
                    className="text-xs font-black uppercase text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                    <span>ERP Flota OS</span>
                  </Link>
                </>
              )}

              <Link
                to="/history"
                className="flex items-center space-x-1 text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
              >
                <History className="h-4 w-4 text-slate-400" />
                <span>Historial</span>
              </Link>

              <NotificationBell />

              <div className="flex items-center space-x-3 border-l border-slate-800 lg:pl-6 pl-4">
                <div className="flex flex-col items-end">
                  <Link to="/profile" className="text-xs font-bold text-slate-100 hover:text-indigo-400 transition-colors">
                    {user.nombre}
                  </Link>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                    {isAdmin ? 'SYS ADMIN' : (orgType === 'shipper_company' ? 'Empresa Exportadora' : orgType === 'transport_company' ? 'Empresa de Transporte' : orgType === 'independent_driver' ? 'Conductor Independiente' : 'Carga Casual')}
                  </span>
                </div>
                <Link to="/profile" className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center hover:border-indigo-400 transition-all">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.nombre} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="h-4 w-4 text-indigo-400" />
                  )}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Premium Segmented Navigation */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSolutionsOpen(!isSolutionsOpen)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-colors focus:outline-none py-2",
                    isSolutionsOpen ? "text-indigo-400" : "text-slate-300 hover:text-slate-100"
                  )}
                >
                  <span>Soluciones</span>
                  <ChevronDown className={cn("h-4.5 w-4.5 transition-transform duration-250", isSolutionsOpen ? "rotate-180 text-indigo-450" : "")} />
                </button>

                {/* Dropdown Menu */}
                {isSolutionsOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[520px] bg-slate-950/98 border border-slate-850 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-fade-in grid grid-cols-2 gap-3 z-50">
                    <div className="col-span-2 pb-2 mb-2 border-b border-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      — Soluciones a tu medida
                    </div>
                    
                    {/* card 1 */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 hover:border-orange-500/40 transition-all flex flex-col justify-between group">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-950/50 border border-orange-900/40 text-[9px] font-black text-orange-400 mb-2">
                          🌱 OCASIONAL
                        </span>
                        <h4 className="text-xs font-black text-white mb-1">📦 Comerciantes y MYPES</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed leading-snug">
                          Publica cargas, encuentra transporte seguro y monitorea tus envíos.
                        </p>
                      </div>
                      <Link 
                        to="/register" 
                        onClick={() => setIsSolutionsOpen(false)}
                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-orange-400 hover:text-orange-350 transition-colors"
                      >
                        <span>Ver solución</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* card 2 */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-900/40 text-[9px] font-black text-emerald-400 mb-2">
                          🚛 FLETES DIRECTOS
                        </span>
                        <h4 className="text-xs font-black text-white mb-1">🚛 Transportistas</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed leading-snug">
                          Consigue cargas constantes, postula rápido y evita retornos vacíos.
                        </p>
                      </div>
                      <Link 
                        to="/register" 
                        onClick={() => setIsSolutionsOpen(false)}
                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 hover:text-emerald-350 transition-colors"
                      >
                        <span>Ver solución</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* card 3 */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 hover:border-indigo-500/40 transition-all flex flex-col justify-between group">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-950/50 border border-indigo-900/40 text-[9px] font-black text-indigo-400 mb-2">
                          🏢 LOGISTICS OS
                        </span>
                        <h4 className="text-xs font-black text-white mb-1">🏢 Import / Export</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed leading-snug">
                          Centraliza operaciones de envío corporativos y auditables.
                        </p>
                      </div>
                      <Link 
                        to="/register" 
                        onClick={() => setIsSolutionsOpen(false)}
                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-350 transition-colors"
                      >
                        <span>Ver solución empresarial</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* card 4 */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 hover:border-purple-500/40 transition-all flex flex-col justify-between group">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/50 border border-purple-900/40 text-[9px] font-black text-purple-400 mb-2">
                          🚚 CORPORATIVO SAAS
                        </span>
                        <h4 className="text-xs font-black text-white mb-1">🚚 Empresas de Flotas</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed leading-snug">
                          Administra flotas terrestres, choferes y telemetría fría IoT.
                        </p>
                      </div>
                      <Link 
                        to="/register" 
                        onClick={() => setIsSolutionsOpen(false)}
                        className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-purple-400 hover:text-purple-350 transition-colors"
                      >
                        <span>Ver plataforma SaaS</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleScrollToAnchor('#planes')}
                className="text-xs font-black uppercase tracking-widest text-slate-350 hover:text-white transition-colors"
              >
                Planes
              </button>

              {/* Demos Dropdown */}
              <div className="relative" ref={demosDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDemosOpen(!isDemosOpen)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-colors focus:outline-none py-2",
                    isDemosOpen ? "text-pink-400" : "text-slate-300 hover:text-slate-100"
                  )}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></div>
                  <span>Demos</span>
                  <ChevronDown className={cn("h-4 transition-transform duration-250", isDemosOpen ? "rotate-180 text-pink-450" : "")} />
                </button>

                {isDemosOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[480px] bg-slate-950/98 border border-slate-850 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-fade-in grid grid-cols-2 gap-3 z-50">
                    <div className="col-span-2 pb-2 mb-1 border-b border-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      — Selecciona una demo por industria
                    </div>
                    
                    {/* Demo 1 */}
                    <Link 
                      to="/demos?type=comerciante" 
                      onClick={() => setIsDemosOpen(false)}
                      className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 hover:border-orange-500/40 transition-all text-left"
                    >
                      <h4 className="text-xs font-black text-white mb-0.5">📦 Demo Comerciante / MYPE</h4>
                      <p className="text-[9px] text-slate-400 font-medium leading-tight">Cargas casuales y tracking simple.</p>
                    </Link>

                    {/* Demo 2 */}
                    <Link 
                      to="/demos?type=transportista" 
                      onClick={() => setIsDemosOpen(false)}
                      className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 hover:border-emerald-500/40 transition-all text-left"
                    >
                      <h4 className="text-xs font-black text-white mb-0.5">🚛 Demo Transportista</h4>
                      <p className="text-[9px] text-slate-400 font-medium leading-tight">Bolsa de carga y ganancias.</p>
                    </Link>

                    {/* Demo 3 */}
                    <Link 
                      to="/demos?type=exportadora" 
                      onClick={() => setIsDemosOpen(false)}
                      className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 hover:border-indigo-500/40 transition-all text-left"
                    >
                      <h4 className="text-xs font-black text-white mb-0.5">🌎 Demo Exportadora</h4>
                      <p className="text-[9px] text-slate-400 font-medium leading-tight">Frío IoT, contenedores y Copilot IA.</p>
                    </Link>

                    {/* Demo 4 */}
                    <Link 
                      to="/demos?type=empresa_transporte" 
                      onClick={() => setIsDemosOpen(false)}
                      className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 hover:border-purple-500/40 transition-all text-left"
                    >
                      <h4 className="text-xs font-black text-white mb-0.5">🚚 Demo Empresa Transporte</h4>
                      <p className="text-[9px] text-slate-400 font-medium leading-tight">Flotas, choferes y SOAT.</p>
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3.5 border-l border-slate-800 pl-4">
                <Link to="/login">
                  <Button variant="ghost" className="text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-900 px-3 py-1.5 h-auto">
                    Ingresar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="text-xs font-black uppercase tracking-widest bg-indigo-650 hover:bg-slate-900 active:scale-95 text-white px-4 py-2.5 h-auto rounded-xl shadow-lg shadow-indigo-600/25">
                    🚀 Probar Chasqui
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center space-x-3">
          {user && <NotificationBell />}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-slate-400 hover:bg-slate-900 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-900 bg-slate-950 animate-in slide-in-from-top duration-200 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div className="space-y-1 p-4 pb-10">
            {user ? (
              <>
                <div className="flex items-center space-x-3 p-3 bg-slate-900 rounded-2xl mb-4">
                  <div className="h-10 w-10 rounded-full bg-slate-955 overflow-hidden shrink-0 border border-slate-800">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={user.nombre} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-950">
                        <User className="h-5 w-5 text-indigo-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.nombre}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-black">
                      {isAdmin ? 'SYS ADMIN' : (orgType === 'shipper_company' ? 'Empresa Exportadora' : orgType === 'transport_company' ? 'Empresa de Transporte' : orgType === 'independent_driver' ? 'Conductor Independiente' : 'Carga Casual')}
                    </p>
                  </div>
                </div>

                {orgType === 'casual' && (
                  <>
                    <Link 
                      to="/merchant/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-900 rounded-xl font-bold"
                    >
                      <Package className="h-5 w-5 text-orange-400" />
                      <span>Panel Cargas Casuales</span>
                    </Link>
                    <Link 
                      to="/merchant/post-cargo"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 text-orange-400 hover:bg-slate-900 rounded-xl font-bold"
                    >
                      <Plus className="h-5 w-5 text-orange-450" />
                      <span>Publicar Carga</span>
                    </Link>
                  </>
                )}

                {orgType === 'independent_driver' && (
                  <Link 
                    to="/carrier/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-900 rounded-xl font-bold"
                  >
                    <Truck className="h-5 w-5 text-emerald-400" />
                    <span>Bolsa de Fletes</span>
                  </Link>
                )}

                {orgType === 'shipper_company' && (
                  <>
                    <Link 
                      to="/shipper-os"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 text-indigo-400 hover:bg-slate-900 rounded-xl font-bold"
                    >
                      <Building2 className="h-5 w-5 text-indigo-400" />
                      <span>Torre de Control Shipper</span>
                    </Link>
                    <Link 
                      to="/merchant/post-cargo"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-900 rounded-xl font-bold"
                    >
                      <Plus className="h-5 w-5 text-slate-400" />
                      <span>Nueva Carga Industrial</span>
                    </Link>
                  </>
                )}

                {orgType === 'transport_company' && (
                  <Link 
                    to="/fleet-os"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 p-3 text-purple-400 hover:bg-slate-900 rounded-xl font-bold"
                  >
                    <Truck className="h-5 w-5 text-purple-400" />
                    <span>ERP Flota OS</span>
                  </Link>
                )}

                <Link 
                  to="/history"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-900 rounded-xl font-bold"
                >
                  <History className="h-5 w-5 text-slate-400" />
                  <span>Historial de Viajes</span>
                </Link>

                {isAdmin && (
                  <Link 
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 p-3 text-purple-400 hover:bg-slate-900 rounded-xl font-bold"
                  >
                    <AlertCircle className="h-5 w-5" />
                    <span>Panel Admin Global</span>
                  </Link>
                )}

                <Link 
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 p-3 text-slate-300 hover:bg-slate-900 rounded-xl font-bold"
                >
                  <User className="h-5 w-5 text-indigo-400" />
                  <span>Mi Perfil</span>
                </Link>

                <div className="pt-4 mt-4 border-t border-slate-900">
                  <button 
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="flex items-center space-x-3 w-full p-3 text-red-400 hover:bg-red-950/20 rounded-xl font-bold"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-550">— SOLUCIONES —</p>
                  
                  <Link 
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-3 text-orange-400 hover:bg-slate-900 rounded-xl font-bold text-xs"
                  >
                    <span>📦 Comerciantes y MYPES</span>
                    <span className="text-[9px] bg-orange-950 text-orange-400 px-1.5 py-0.5 rounded">OCASIONAL</span>
                  </Link>

                  <Link 
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-3 text-emerald-400 hover:bg-slate-900 rounded-xl font-bold text-xs"
                  >
                    <span>🚛 Transportistas Independientes</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded">GRATIS</span>
                  </Link>

                  <Link 
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-3 text-indigo-400 hover:bg-slate-900 rounded-xl font-bold text-xs"
                  >
                    <span>🏢 Empresas Import / Export</span>
                    <span className="text-[9px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded">BUSINESS</span>
                  </Link>

                  <Link 
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-3 text-purple-400 hover:bg-slate-900 rounded-xl font-bold text-xs"
                  >
                    <span>🚚 Empresas de Flotas (SaaS)</span>
                    <span className="text-[9px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded">SaaS OS</span>
                  </Link>

                  <div className="pt-2 mt-2 border-t border-slate-900">
                    <button 
                      onClick={() => { handleScrollToAnchor('#planes'); setIsMenuOpen(false); }}
                      className="flex items-center text-left space-x-2 w-full p-3 text-slate-300 hover:bg-slate-900 rounded-xl font-bold text-xs"
                    >
                      <span>🔮 Planes de Suscripción</span>
                    </button>
                    <Link 
                      to="/demos"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 p-3 text-pink-400 hover:bg-slate-900 rounded-xl font-bold text-xs"
                    >
                      <span>💻 Demos por Industria</span>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-900">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-slate-800 text-slate-300 bg-transparent hover:bg-slate-900 py-2.5 h-auto font-black text-xs uppercase tracking-wider">
                      Ingresar
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-indigo-650 hover:bg-slate-900 text-white py-2.5 h-auto font-black text-xs uppercase tracking-widest">
                      Probar Chasqui
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
