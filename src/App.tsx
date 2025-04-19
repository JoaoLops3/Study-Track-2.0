import { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Page from './pages/Page';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

const App = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    document.title = 'Study Track';
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-primary-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Protected Routes */}
      {user ? (
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/board/:id" element={<Board />} />
          <Route path="/page/:id" element={<Page />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      ) : (
        <>
          <Route element={<AuthLayout />}>
            <Route path="/auth" element={<Auth />} />
          </Route>
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </>
      )}
    </Routes>
  );
};

export default App;