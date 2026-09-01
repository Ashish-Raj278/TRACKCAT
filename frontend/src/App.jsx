import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AssetsList from './pages/AssetsList';
import AssetDetail from './pages/AssetDetail';
import Rentals from './pages/Rentals';
import Terminal from './pages/Terminal';
import Analytics from './pages/Analytics';
import Telematics from './pages/Telematics';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/assets" element={<AssetsList />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/terminal" element={<Terminal />} />
          <Route path="/checkout" element={<Terminal />} />
          <Route path="/checkin" element={<Terminal />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/telematics" element={<Telematics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
