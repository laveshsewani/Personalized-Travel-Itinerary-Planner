import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { TripBuilderPage } from './pages/TripBuilderPage';
import { ItineraryViewPage } from './pages/ItineraryViewPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';

export default function App() {
  const initTheme = useThemeStore((state) => state.initTheme);
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initTheme();
    initAuth();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/builder" element={<TripBuilderPage />} />
            <Route path="/trips" element={<MyTripsPage />} />
            <Route path="/trips/:id" element={<ItineraryViewPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toast />

        {/* Global Footer */}
        <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} YatraAI — Personalized Travel Itinerary Planner. Engineered for Bharat.</p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>All prices estimated in ₹ (INR)</span>
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
