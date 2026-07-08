import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { ConsentPage } from "./components/auth/ConsentPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { BookletsPage } from "./components/booklets/BookletsPage";
import { CampaignsPage } from "./components/campaigns/CampaignsPage";
import { CalendarPage } from "./components/calendar/CalendarPage";
import { ReferencesPage } from "./components/references/ReferencesPage";
import { BrandPage } from "./components/brand/BrandPage";
import { ProfilePage } from "./components/profile/ProfilePage";
import { NfpPage } from "./components/nfp/NfpPage";
import { RealTablaturaPage } from "./components/real-tablatura/RealTablaturaPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  // if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/registrar" element={<RegisterPage />} />
            <Route path="/consentimento" element={<ConsentPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="nfp" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="booklets" element={<BookletsPage />} />
              <Route path="campanhas" element={<CampaignsPage />} />
              <Route path="calendario" element={<CalendarPage />} />
              <Route path="referencias" element={<ReferencesPage />} />
              <Route path="brand" element={<BrandPage />} />
              <Route path="perfil" element={<ProfilePage />} />
              <Route path="nfp" element={<NfpPage />} />
              <Route path="tablatura" element={<RealTablaturaPage />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
