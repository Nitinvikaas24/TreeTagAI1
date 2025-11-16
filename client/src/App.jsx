import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// User Pages
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './components/UserDashboard';
import PlantIdentificationPage from './pages/PlantIdentificationPage';
import ResultsPage from './pages/ResultsPage';
import Receipt from './pages/Receipt';

// Marketplace Components
import OfficerDashboard from './components/marketplace/OfficerDashboard';
import FarmerDashboard from './components/marketplace/FarmerDashboard';

// User Sub-pages (Placeholders for now)
const BrowsePlants = () => <div className="min-h-screen bg-gray-50 p-8"><h1 className="text-2xl font-bold">Browse Plants - Coming Soon</h1></div>;
const PurchaseHistory = () => <div className="min-h-screen bg-gray-50 p-8"><h1 className="text-2xl font-bold">Purchase History - Coming Soon</h1></div>;
const WishlistPage = () => <div className="min-h-screen bg-gray-50 p-8"><h1 className="text-2xl font-bold">Wishlist - Coming Soon</h1></div>;
const OrdersPage = () => <div className="min-h-screen bg-gray-50 p-8"><h1 className="text-2xl font-bold">Orders - Coming Soon</h1></div>;
const TransactionsPage = () => <div className="min-h-screen bg-gray-50 p-8"><h1 className="text-2xl font-bold">Transactions - Coming Soon</h1></div>;
const PlantDetails = () => <div className="min-h-screen bg-gray-50 p-8"><h1 className="text-2xl font-bold">Plant Details - Coming Soon</h1></div>;

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ExcelImport from './pages/ExcelImport';
import PlantsManagement from './pages/PlantsManagement';
import Analytics from './pages/Analytics';
import GenerateReceipt from './pages/GenerateReceipt';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* User Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/user/identify" element={<PlantIdentificationPage />} />
          <Route path="/user/results" element={<ResultsPage />} />
          <Route path="/user/cart" element={<GenerateReceipt />} />
          <Route path="/user/receipt" element={<Receipt />} />
          <Route path="/user/browse" element={<BrowsePlants />} />
          <Route path="/user/history" element={<PurchaseHistory />} />
          <Route path="/user/wishlist" element={<WishlistPage />} />
          <Route path="/user/orders" element={<OrdersPage />} />
          <Route path="/user/transactions" element={<TransactionsPage />} />
          <Route path="/user/plants/:id" element={<PlantDetails />} />
          
          {/* Marketplace Routes */}
          <Route path="/officer" element={<OfficerDashboard />} />
          <Route path="/farmer" element={<FarmerDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/plants" element={<PlantsManagement />} />
          <Route path="/admin/excel-import" element={<ExcelImport />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/receipts" element={<Receipt />} />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
