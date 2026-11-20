import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';
import { Navbar } from './components/Navbar';
import { ProtectedStaffRoute } from './components/ProtectedStaffRoute';

// 7 Route Pages
import { Home } from './pages/Home';
import { JoinQueue } from './pages/JoinQueue';
import { MyStatus } from './pages/MyStatus';
import { ReceptionDashboard } from './pages/ReceptionDashboard';
import { BarberView } from './pages/BarberView';
import { WaitingAreaDisplay } from './pages/WaitingAreaDisplay';
import { OwnerAdmin } from './pages/OwnerAdmin';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <QueueProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-gray-800 text-gray-100 flex flex-col font-sans">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* 4 Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/join" element={<JoinQueue />} />
                  <Route path="/status/:id" element={<MyStatus />} />
                  <Route path="/display" element={<WaitingAreaDisplay />} />

                  {/* 3 Protected Staff Routes (PIN 1234) */}
                  <Route
                    path="/reception"
                    element={
                      <ProtectedStaffRoute>
                        <ReceptionDashboard />
                      </ProtectedStaffRoute>
                    }
                  />
                  <Route
                    path="/barber/:name"
                    element={
                      <ProtectedStaffRoute>
                        <BarberView />
                      </ProtectedStaffRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedStaffRoute>
                        <OwnerAdmin />
                      </ProtectedStaffRoute>
                    }
                  />

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </QueueProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
