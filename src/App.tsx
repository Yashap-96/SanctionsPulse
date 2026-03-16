import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { Footer } from "./components/layout/Footer";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { DashboardPage } from "./pages/DashboardPage";
import { MapPage } from "./pages/MapPage";
import { ProgramsPage } from "./pages/ProgramsPage";
import { IntelligencePage } from "./pages/IntelligencePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ScreeningPage } from "./pages/ScreeningPage";
import { useSanctionsData } from "./hooks/useSanctionsData";

function AppLayout() {
  const { meta } = useSanctionsData();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Header meta={meta} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/programs" element={<ProgramsPage />} />
              <Route path="/intelligence" element={<IntelligencePage />} />
              <Route path="/screening" element={<ScreeningPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
