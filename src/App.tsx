import MedicalRenewals from "./pages/dashboard/MedicalRenewals";
import MedicalPrescriptions from "./pages/dashboard/MedicalPrescriptions";
import MedicalScheduling from "./pages/dashboard/MedicalScheduling";
import TunisiaInfo from "./pages/info/tunisia";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ExamGenerator from "./pages/dashboard/ExamGenerator";
import Medical from "./pages/dashboard/Medical";
import Notifications from "./pages/dashboard/Notifications";
import Agenda from "./pages/dashboard/Agenda";
import Chat from "./pages/dashboard/Chat";
import UserManagement from "./pages/dashboard/UserManagement";
import Social from "./pages/dashboard/Social";
import SOS from "./pages/dashboard/SOS";
import Information from "./pages/dashboard/Information";
import Documentation from "./pages/Documentation";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";
import Cloud from "./pages/dashboard/Cloud";
import NotFound from "./pages/NotFound";
import TunisiaInfoPage from './pages/info/tunisia';
import { Toaster } from "./components/ui/toaster";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="donia-theme">
      <AuthProvider>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/education/exam" element={<ExamGenerator />} />
                <Route path="/dashboard/medical" element={<Medical />} />
                <Route path="/dashboard/notifications" element={<Notifications />} />
                <Route path="/dashboard/agenda" element={<Agenda />} />
                <Route path="/dashboard/chat" element={<Chat />} />
                <Route path="/dashboard/users" element={<UserManagement />} />
                <Route path="/dashboard/social" element={<Social />} />
                <Route path="/dashboard/sos" element={<SOS />} />
                <Route path="/dashboard/information" element={<Information />} />
                <Route path="/dashboard/profile" element={<Profile />} />
                <Route path="/dashboard/settings" element={<Settings />} />
                <Route path="/dashboard/cloud" element={<Cloud />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/medical" element={<Medical />} />
                <Route path="/medical/scheduling" element={<MedicalScheduling />} />
                <Route path="/medical/calculators" element={<Medical />} />
                <Route path="/medical/prescriptions" element={<MedicalPrescriptions />} />
                <Route path="/medical/renewals" element={<MedicalRenewals />} />
                <Route path="/info/tunisia" element={<TunisiaInfoPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
