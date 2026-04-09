import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
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
import { History } from './pages/History';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './components/ui/NotificationProvider';
import { AdminDashboard } from './pages/AdminDashboard';


export default function App() {
  useAuth();

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