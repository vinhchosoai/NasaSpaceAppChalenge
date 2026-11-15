import { useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BodyMap } from './pages/BodyMap';
import { CheckIn } from './pages/CheckIn';
import { CrewOverview } from './pages/CrewOverview';
import { Dashboard } from './pages/Dashboard';
import { Learn } from './pages/Learn';
import { Report } from './pages/Report';
import { Trends } from './pages/Trends';
import { useAppStore } from './store/useAppStore';

export function App() {
  const hydrateFromDb = useAppStore((s) => s.hydrateFromDb);

  useEffect(() => {
    void hydrateFromDb();
  }, [hydrateFromDb]);

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/body" element={<BodyMap />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/crew" element={<CrewOverview />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
