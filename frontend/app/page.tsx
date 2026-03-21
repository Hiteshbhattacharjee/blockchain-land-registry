'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getAllLands, LandRecord } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [searchId, setSearchId] = useState('');
  const [lands, setLands] = useState<LandRecord[]>([]);
  const { user, logout, mounted } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const handleSearch = async () => {
    if (searchId.trim()) {
      router.push(`/land/${searchId.trim()}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getAllLands();
      setLands(data);
      setSearched(true);
      setStats({
        total: data.length,
        active: data.filter((l) => l.status === 'ACTIVE').length,
        pending: data.filter((l) => l.status === 'PENDING').length,
      });
    } catch {
      setError('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'DISPUTED': return 'bg-red-100 text-red-800';
      case 'MORTGAGED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const bg = darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900';
  const cardBg = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  return (
    <main className={`min-h-screen transition-colors duration-300 ${bg}`}>

      {/* Navbar */}
      <nav className={`border-b ${darkMode ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white'} sticky top-0 z-50`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <div>
              <p className="font-bold text-sm">Blockchain Land Registry</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Government of India</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            {mounted && (user ? (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>👤 {user.name}</span>
                <button onClick={logout} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700">Logout</button>
              </div>
            ) : (
              <button onClick={() => router.push('/login')} className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-800">Login</button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900'} text-white py-16 px-4`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Powered by Hyperledger Fabric 2.5.9
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Decentralized Land Registry
          </h1>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
            Immutable, transparent and secure property registration on blockchain. Every transaction permanently recorded, instantly verifiable.
          </p>

          {/* Search Bar */}
          <div className="flex gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Enter Land ID (e.g. LAND001) or leave empty to view all"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-white text-blue-900 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 disabled:opacity-50 transition"
            >
              {loading ? '...' : '🔍 Search'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg mx-auto">
            {[
              { label: 'Total Records', value: '3+', icon: '📋' },
              { label: 'Blockchain Channels', value: '3', icon: '⛓️' },
              { label: 'Smart Contracts', value: '8', icon: '📄' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur border border-white/10">
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-blue-200 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex gap-3 flex-wrap">
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-50 transition"
        >
          {loading ? 'Loading...' : '📋 View All Records'}
        </button>
        {mounted && user?.role === 'registrar' && (
          <button
            onClick={() => router.push('/register')}
            className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            ➕ Register Property
          </button>
        )}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Results */}
      {searched && (
        <div className="max-w-4xl mx-auto px-4 pb-12">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'blue' },
              { label: 'Active', value: stats.active, color: 'green' },
              { label: 'Pending', value: stats.pending, color: 'yellow' },
            ].map((s) => (
              <div key={s.label} className={`${cardBg} border rounded-xl p-4`}>
                <p className={`text-2xl font-bold ${s.color === 'green' ? 'text-green-600' : s.color === 'yellow' ? 'text-yellow-600' : 'text-blue-600'}`}>{s.value}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.label} Records</p>
              </div>
            ))}
          </div>

          <h3 className={`mb-4 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{lands.length} record(s) found</h3>

          <div className="grid gap-4">
            {lands.map((land) => (
              <div
                key={land.landId}
                onClick={() => router.push(`/land/${land.landId}`)}
                className={`${cardBg} border rounded-xl p-5 cursor-pointer hover:shadow-lg transition`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-blue-600 text-lg">{land.landId}</p>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{land.ownerName || (land as unknown as Record<string, string>).owner_name}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {land.district}, {land.state} — {land.landType || (land as unknown as Record<string, string>).land_type}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(land.status)}`}>
                    {land.status}
                  </span>
                </div>
                <div className={`mt-3 flex gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>📐 {land.areaSqFt || (land as unknown as Record<string, string>).area_sqft} sq.ft</span>
                  <span>💰 ₹{Number(land.marketValue || (land as unknown as Record<string, string>).market_value).toLocaleString('en-IN')}</span>
                  {(land.mortgageLock || (land as unknown as Record<string, boolean>).mortgage_lock) && <span className="text-red-500">🔒 Mortgaged</span>}
                  {(land.disputeFlag || (land as unknown as Record<string, boolean>).dispute_flag) && <span className="text-orange-500">⚠️ Disputed</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!searched && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔍', title: 'Search Records', desc: 'Find any land record instantly by ID or browse all registered properties' },
              { icon: '📝', title: 'Register Property', desc: 'Register land, flats, apartments with IPFS document storage' },
              { icon: '🔄', title: 'Transfer Ownership', desc: 'Immutable ownership transfers with full chain of title history' },
            ].map((feature) => (
              <div key={feature.title} className={`${cardBg} border rounded-xl p-6`}>
                <p className="text-3xl mb-3">{feature.icon}</p>
                <p className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{feature.title}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} py-6 px-4 mt-8`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Built on Hyperledger Fabric 2.5.9 • 9 Docker containers • 3 channels
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            By Hitesh Bhattacharjee
          </p>
        </div>
      </footer>
    </main>
  );
}