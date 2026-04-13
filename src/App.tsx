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
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './components/ui/NotificationProvider';

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
        <Router>
          <div className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Merchant Routes */}
                <Route element={<ProtectedRoute allowedRoles={['comerciante']} />}>
                  <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
                  <Route path="/merchant/post-cargo" element={<PostCargo />} />
                  <Route path="/merchant/cargo/:id" element={<MerchantCargoDetails />} />
                </Route>

                {/* Carrier Routes */}
                <Route element={<ProtectedRoute allowedRoles={['transportista']} />}>
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
