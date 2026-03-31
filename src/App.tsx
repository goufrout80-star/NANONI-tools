import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/providers/SidebarProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

// Public pages
import Index from "./pages/Index";
import Waitlist from "./pages/Waitlist";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminWaitlist from "./pages/admin/AdminWaitlist";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTools from "./pages/admin/AdminTools";
import AdminSettings from "./pages/admin/AdminSettings";

// User pages
import UserDashboard from "./pages/dashboard/UserDashboard";
import ToolsSelection from "./pages/dashboard/ToolsSelection";
import FaceSwap from "./pages/dashboard/FaceSwap";
import AIGenerate from "./pages/dashboard/AIGenerate";
import VibeSwap from "./pages/dashboard/VibeSwap";
import UserSettings from "./pages/dashboard/UserSettings";
import History from "./pages/dashboard/History";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SidebarProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Public routes — use landing Layout */}
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/waitlist" element={<Layout><Waitlist /></Layout>} />
              <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
              <Route path="/terms" element={<Layout><Terms /></Layout>} />
              <Route path="/login" element={<Layout><Login /></Layout>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/waitlist" element={<ProtectedRoute requiredRole="admin"><AdminWaitlist /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/tools" element={<ProtectedRoute requiredRole="admin"><AdminTools /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />

              {/* User dashboard routes */}
              <Route path="/dashboard" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/tools" element={<ProtectedRoute requiredRole="user"><ToolsSelection /></ProtectedRoute>} />
              <Route path="/dashboard/faceswap" element={<ProtectedRoute requiredRole="user"><FaceSwap /></ProtectedRoute>} />
              <Route path="/dashboard/ai-generate" element={<ProtectedRoute requiredRole="user"><AIGenerate /></ProtectedRoute>} />
              <Route path="/dashboard/vibe-swap" element={<ProtectedRoute requiredRole="user"><VibeSwap /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute requiredRole="user"><UserSettings /></ProtectedRoute>} />
              <Route path="/dashboard/history" element={<ProtectedRoute requiredRole="user"><History /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
