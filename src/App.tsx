import { useState } from "react";
import { isUnlocked } from "@/lib/crypto";
import { LockScreen } from "@/components/LockScreen";
import { AppShell } from "@/components/AppShell";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Dashboard from "./pages/Dashboard";
import PatientsList from "./pages/PatientsList";
import PatientEdit from "./pages/PatientEdit";
import PatientDetail from "./pages/PatientDetail";
import SessionsList from "./pages/SessionsList";
import SessionEdit from "./pages/SessionEdit";
import TemplatesLibrary from "./pages/TemplatesLibrary";
import TemplateDetail from "./pages/TemplateDetail";
import SlidesList from "./pages/SlidesList";
import SlideNew from "./pages/SlideNew";
import SlideEditor from "./pages/SlideEditor";
import SlidePresent from "./pages/SlidePresent";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [unlocked, setUnlocked] = useState(isUnlocked());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!unlocked ? (
          <LockScreen onUnlocked={() => setUnlocked(true)} />
        ) : (
          <BrowserRouter>
            <AppShell onLock={() => setUnlocked(false)}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/patienten" element={<PatientsList />} />
                <Route path="/patienten/neu" element={<PatientEdit />} />
                <Route path="/patienten/:id" element={<PatientDetail />} />
                <Route path="/patienten/:id/edit" element={<PatientEdit />} />
                <Route path="/sessions" element={<SessionsList />} />
                <Route path="/sessions/neu" element={<SessionEdit />} />
                <Route path="/sessions/:id" element={<SessionEdit />} />
                <Route path="/templates" element={<TemplatesLibrary />} />
                <Route path="/templates/:id" element={<TemplateDetail />} />
                <Route path="/slides" element={<SlidesList />} />
                <Route path="/slides/neu" element={<SlideNew />} />
                <Route path="/slides/:id" element={<SlideEditor />} />
                <Route path="/slides/:id/praesentieren" element={<SlidePresent />} />
                <Route path="/einstellungen" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
