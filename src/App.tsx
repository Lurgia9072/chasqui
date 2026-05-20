import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/useAuthStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MerchantDashboard } from './pages/merchant/Dashboard';
import { CarrierDashboard } from './pages/carrier/Dashboard';
import { PostCargo } from './pages/merchant/PostCargo';
import { MerchantCargoDetails } from './pages/merchant/CargoDetails';
import { CarrierCargoDetails } from './pages/carrier/CargoDetails';
import { TripDetails } from './pages/TripDetails';
import { AdminDashboard } from './pages/AdminDashboard';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { PublicTracking } from './pages/PublicTracking';
import { EnterpriseDashboard } from './pages/enterprise/EnterpriseDashboard';
import { FleetERP } from './pages/enterprise/FleetERP';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './components/ui/NotificationProvider';
import { SupportWidget } from './pages/Support';
import { Demos } from './pages/demos';

export default function App() {
  useAuth();
  const { user } = useAuthStore();

  // Location tracking for carriers
  useEffect(() => {
    if (user?.tipoUsuario === 'transportista') {
      const updateLocation = async () => {
        // Simulate a location near Lima
        const lat = -12.046374 + (Math.random() - 0.5) * 0.05;
        const lng = -77.042793 + (Math.random() - 0.5) * 0.05;
        
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            currentLocation: { lat, lng, updatedAt: Date.now() }
          });
        } catch (err) {
          console.error('Error updating carrier location:', err);
        }
      };

      updateLocation();
      const interval = setInterval(updateLocation, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.uid, user?.tipoUsuario]);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <div className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
            <Navbar />
            <SupportWidget />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/publicar-carga" element={<PostCargo requireAuth={false} />} />
                <Route path="/track/:id" element={<PublicTracking />} />
                <Route path="/demos" element={<Demos />} />

                {/* Shipper Company / Enterprise Routes */}
                <Route element={<ProtectedRoute allowedOrgTypes={['shipper_company']} />}>
                  <Route path="/enterprise" element={<EnterpriseDashboard />} />
                  <Route path="/shipper-os" element={<EnterpriseDashboard />} />
                  <Route path="/control-tower" element={<EnterpriseDashboard />} />
                </Route>

                {/* Transport Company / Fleet Routes */}
                <Route element={<ProtectedRoute allowedOrgTypes={['transport_company']} />}>
                  <Route path="/fleet-os" element={<FleetERP />} />
                  <Route path="/transport-company" element={<FleetERP />} />
                  <Route path="/fleet-control" element={<FleetERP />} />
                </Route>

                {/* Merchant / Casual Routes */}
                <Route element={<ProtectedRoute allowedOrgTypes={['casual']} />}>
                  <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
                  <Route path="/merchant/post-cargo" element={<PostCargo />} />
                  <Route path="/merchant/cargo/:id" element={<MerchantCargoDetails />} />
                </Route>

                {/* Independent Driver / Carrier Routes */}
                <Route element={<ProtectedRoute allowedOrgTypes={['independent_driver']} />}>
                  <Route path="/carrier/dashboard" element={<CarrierDashboard />} />
                  <Route path="/carrier/cargo/:id" element={<CarrierCargoDetails />} />
                </Route>

                {/* Shared Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/trip/:id" element={<TripDetails />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:id" element={<Profile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
