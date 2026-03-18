'use client';

import { useState } from 'react';
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">🏛️ Blockchain Land Registry</h1>
            <p className="text-blue-200">Government of India — Decentralized Property Registration</p>
          </div>
          <div>
            {mounted && (user ? (
              <div className="flex items-center gap-3">
                <span className="text-blue-200 text-sm">👤 {user.name}</span>
                <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">Logout</button>
              </div>
            ) : (
              <button onClick={() => router.push('/login')} className="bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50">Login</button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Search Land Records</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter Land ID (e.g. LAND001) or leave empty to view all"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            {mounted && user?.role === 'registrar' && (
              <button
                onClick={() => router.push('/register')}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                + Register
              </button>
            )}
          </div>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>

        {searched && (
          <div>
            <h3 className="text-gray-600 mb-4 font-medium">{lands.length} record(s) found</h3>
            <div className="grid gap-4">
              {lands.map((land) => (
                <div
                  key={land.landId}
                  onClick={() => router.push(`/land/${land.landId}`)}
                  className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition border border-gray-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-blue-800 text-lg">{land.landId}</p>
                      <p className="text-gray-700 font-medium">{land.ownerName}</p>
                      <p className="text-gray-500 text-sm">{land.district}, {land.state} — {land.landType}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(land.status)}`}>
                      {land.status}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-4 text-sm text-gray-500">
                    <span>📐 {land.areaSqFt} sq.ft</span>
                    <span>💰 ₹{Number(land.marketValue).toLocaleString('en-IN')}</span>
                    {land.mortgageLock && <span className="text-red-500">🔒 Mortgaged</span>}
                    {land.disputeFlag && <span className="text-orange-500">⚠️ Disputed</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!searched && (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-5xl mb-4">🗺️</p>
            <p className="text-lg">Enter a Land ID to search or click Search to view all records</p>
          </div>
        )}
      </div>
    </main>
  );
}