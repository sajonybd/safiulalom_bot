import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Entities from "./pages/Entities";
import Accounts from "./pages/Accounts";
import Lenden from "./pages/Lenden";
import Reports from "./pages/Reports";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Docs from "./pages/Docs";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { AuthGuard } from "@/components/AuthGuard";
import { SettingsProvider } from "@/contexts/SettingsContext";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <SettingsProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
              <Route path="/entities" element={<AuthGuard><Entities /></AuthGuard>} />
              <Route path="/people" element={<AuthGuard><Entities /></AuthGuard>} />
              <Route path="/accounts" element={<AuthGuard><Accounts /></AuthGuard>} />
              <Route path="/lenden" element={<AuthGuard><Lenden /></AuthGuard>} />
              <Route path="/reports" element={<AuthGuard><Reports /></AuthGuard>} />
              <Route path="/team" element={<AuthGuard><Team /></AuthGuard>} />
              <Route path="/docs" element={<AuthGuard><Docs /></AuthGuard>} />
              <Route path="/logs" element={<AuthGuard><Logs /></AuthGuard>} />
              <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </SettingsProvider>
  </ThemeProvider>
);

export default App;
