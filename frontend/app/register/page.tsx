'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerLand } from '@/lib/api';

export default function RegisterLand() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    landId: '',
    surveyNumber: '',
    district: '',
    taluka: '',
    state: '',
    pinCode: '',
    areaSqFt: '',
    areaAcres: '',
    landType: 'RESIDENTIAL',
    ownerName: '',
    ownerAadhaarHash: '',
    documentIpfsHash: '',
    surveyIpfsHash: '',
    gisCoordinates: '',
    marketValue: '',
    governmentValue: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await registerLand({
        ...form,
        areaSqFt: Number(form.areaSqFt),
        areaAcres: Number(form.areaAcres),
        marketValue: Number(form.marketValue),
        governmentValue: Number(form.governmentValue),
      });
      setSuccess(`Land ${form.landId} registered successfully on blockchain!`);
      setTimeout(() => router.push(`/land/${form.landId}`), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder = '' }: { label: string; name: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name as keyof typeof form]}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-blue-200 hover:text-white">← Back</button>
          <div>
            <h1 className="text-2xl font-bold">Register New Land</h1>
            <p className="text-blue-200 text-sm">Submit to Hyperledger Fabric Blockchain</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow p-6 space-y-6">

          {/* Basic Info */}
          <div>
            <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📋 Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Land ID *" name="landId" placeholder="e.g. LAND002" />
              <Field label="Survey Number *" name="surveyNumber" placeholder="e.g. SRV-2024-002" />
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Land Type *</label>
                <select
                  name="landType"
                  value={form.landType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option>RESIDENTIAL</option>
                  <option>COMMERCIAL</option>
                  <option>AGRICULTURAL</option>
                  <option>INDUSTRIAL</option>
                </select>
              </div>
              <Field label="Owner Name *" name="ownerName" placeholder="Full name" />
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📍 Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="District *" name="district" placeholder="e.g. Pune" />
              <Field label="Taluka *" name="taluka" placeholder="e.g. Haveli" />
              <Field label="State *" name="state" placeholder="e.g. Maharashtra" />
              <Field label="PIN Code *" name="pinCode" placeholder="e.g. 411001" />
              <Field label="GIS Coordinates" name="gisCoordinates" placeholder="e.g. 18.5204N73.8567E" />
            </div>
          </div>

          {/* Area & Value */}
          <div>
            <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📐 Area & Valuation</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Area (sq.ft) *" name="areaSqFt" type="number" placeholder="e.g. 1200" />
              <Field label="Area (acres) *" name="areaAcres" type="number" placeholder="e.g. 0.3" />
              <Field label="Market Value (₹) *" name="marketValue" type="number" placeholder="e.g. 5000000" />
              <Field label="Government Value (₹) *" name="governmentValue" type="number" placeholder="e.g. 4200000" />
            </div>
          </div>

          {/* Documents */}
          <div>
            <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📄 Document Hashes</h2>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Owner Aadhaar Hash (SHA-256) *" name="ownerAadhaarHash" placeholder="64-char hex hash" />
              <Field label="Document IPFS Hash" name="documentIpfsHash" placeholder="Qm..." />
              <Field label="Survey IPFS Hash" name="surveyIpfsHash" placeholder="Qm..." />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
          {success && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg font-semibold">{success}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 text-lg"
          >
            {loading ? '⏳ Submitting to Blockchain...' : '⛓️ Register on Blockchain'}
          </button>
        </div>
      </div>
    </main>
  );
}
