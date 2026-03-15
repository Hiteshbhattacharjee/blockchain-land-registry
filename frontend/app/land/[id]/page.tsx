'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLand, LandRecord } from '@/lib/api';

export default function LandDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [land, setLand] = useState<LandRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      getLand(id as string)
        .then(setLand)
        .catch(() => setError('Land record not found'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DISPUTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'MORTGAGED': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading from blockchain...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button onClick={() => router.push('/')} className="bg-blue-700 text-white px-6 py-2 rounded-lg">
          Go Back
        </button>
      </div>
    </div>
  );

  if (!land) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-blue-200 hover:text-white">← Back</button>
          <div>
            <h1 className="text-2xl font-bold">Land Record — {land.landId}</h1>
            <p className="text-blue-200 text-sm">Verified on Hyperledger Fabric Blockchain</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Status Banner */}
        <div className={`border rounded-xl p-4 flex items-center justify-between ${getStatusColor(land.status)}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {land.status === 'ACTIVE' ? '✅' : land.status === 'PENDING' ? '⏳' : land.status === 'DISPUTED' ? '⚠️' : '🔒'}
            </span>
            <div>
              <p className="font-bold text-lg">{land.status}</p>
              <p className="text-sm opacity-75">Current Registration Status</p>
            </div>
          </div>
          <div className="text-right text-sm">
            {land.mortgageLock && <p className="font-semibold">🔒 Mortgage Lock Active</p>}
            {land.disputeFlag && <p className="font-semibold">⚠️ Dispute Filed</p>}
          </div>
        </div>

        {/* Owner Info */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">👤 Owner Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Owner Name</p>
              <p className="font-semibold text-gray-800">{land.ownerName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Land Type</p>
              <p className="font-semibold text-gray-800">{land.landType}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Registration Date</p>
              <p className="font-semibold text-gray-800">{new Date(land.registrationDate).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Last Updated</p>
              <p className="font-semibold text-gray-800">{new Date(land.lastUpdated).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">📍 Location Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Survey Number</p>
              <p className="font-semibold text-gray-800">{land.surveyNumber}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">District</p>
              <p className="font-semibold text-gray-800">{land.district}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Taluka</p>
              <p className="font-semibold text-gray-800">{land.taluka}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">State</p>
              <p className="font-semibold text-gray-800">{land.state}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">PIN Code</p>
              <p className="font-semibold text-gray-800">{land.pinCode}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">GIS Coordinates</p>
              <p className="font-semibold text-gray-800">{land.gisCoordinates}</p>
            </div>
          </div>
        </div>

        {/* Area & Valuation */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">📐 Area & Valuation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Area (sq.ft)</p>
              <p className="font-semibold text-gray-800">{land.areaSqFt} sq.ft</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Area (acres)</p>
              <p className="font-semibold text-gray-800">{land.areaAcres} acres</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Market Value</p>
              <p className="font-bold text-green-700 text-lg">₹{Number(land.marketValue).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Government Value</p>
              <p className="font-bold text-blue-700 text-lg">₹{Number(land.governmentValue).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Blockchain Info */}
        <div className="bg-gray-900 rounded-xl p-6 text-white">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">⛓️ Blockchain Verification</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Transaction ID</p>
              <p className="font-mono text-green-400 text-sm break-all">{land.blockchainTxId}</p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <p className="text-green-400 text-sm font-semibold">Verified on Hyperledger Fabric 2.5.9</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
