import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { Footer } from "./components/layout/Footer";
import { DashboardPage } from "./pages/DashboardPage";
import { MapPage } from "./pages/MapPage";
import { ProgramsPage } from "./pages/ProgramsPage";
import { IntelligencePage } from "./pages/IntelligencePage";
import { useSanctionsData } from "./hooks/useSanctionsData";

function AppLayout() {
  const { meta } = useSanctionsData();

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Header meta={meta} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/intelligence" element={<IntelligencePage />} />
          </Routes>
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
