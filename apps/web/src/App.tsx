import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Repositories from './pages/Repositories';
import Timeline from './pages/Timeline';
import Investigation from './pages/Investigation';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="repositories" element={<Repositories />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="investigate" element={<Investigation />} />
      </Route>
    </Routes>
  );
}
