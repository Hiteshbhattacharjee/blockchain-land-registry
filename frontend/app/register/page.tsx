'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export default function RegisterLand() {
  const router = useRouter();
  const { token, mounted, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
    propertySubType: 'PLOT',
    ownerName: '',
    ownerAadhaarHash: '',
    documentIpfsHash: '',
    surveyIpfsHash: '',
    photoIpfsHash: '',
    latitude: '',
    longitude: '',
    gisCoordinates: '',
    marketValue: '',
    governmentValue: '',
    floorNumber: '',
    totalFloors: '',
    builtUpArea: '',
    facing: 'EAST',
  });

  const [docFile, setDocFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [uploadedDocUrl, setUploadedDocUrl] = useState('');
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'latitude' || e.target.name === 'longitude') {
      updated.gisCoordinates = `${updated.latitude}N${updated.longitude}E`;
    }
    setForm(updated);
  };

  const handleDocUpload = async () => {
    if (!docFile) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('landId', form.landId || 'new');
      const res = await axios.post(`${API_BASE}/upload/document`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm(prev => ({ ...prev, documentIpfsHash: res.data.data.ipfsHash }));
      setUploadedDocUrl(res.data.data.url);
    } catch {
      setError('Document upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFiles.length) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      photoFiles.forEach(f => formData.append('files', f));
      formData.append('landId', form.landId || 'new');
      const res = await axios.post(`${API_BASE}/upload/multiple`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const firstHash = res.data.data[0].ipfsHash;
      setForm(prev => ({ ...prev, photoIpfsHash: firstHash, surveyIpfsHash: firstHash }));
      setUploadedPhotoUrl(res.data.data[0].url);
    } catch {
      setError('Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE}/land/register`, {
        landId: form.landId,
        surveyNumber: form.surveyNumber,
        district: form.district,
        taluka: form.taluka,
        state: form.state,
        pinCode: form.pinCode,
        areaSqFt: Number(form.areaSqFt),
        areaAcres: Number(form.areaAcres),
        landType: form.landType,
        ownerName: form.ownerName,
        ownerAadhaarHash: form.ownerAadhaarHash,
        documentIpfsHash: form.documentIpfsHash || 'QmPlaceholder',
        surveyIpfsHash: form.surveyIpfsHash || 'QmPlaceholder',
        gisCoordinates: form.gisCoordinates || `${form.latitude}N${form.longitude}E`,
        marketValue: Number(form.marketValue),
        governmentValue: Number(form.governmentValue),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`${form.landId} registered successfully on blockchain!`);
      setTimeout(() => router.push(`/land/${form.landId}`), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const propertySubTypes: Record<string, string[]> = {
    RESIDENTIAL: ['PLOT', 'FLAT', 'APARTMENT', 'VILLA', 'BUNGALOW', 'ROW_HOUSE', 'PENTHOUSE'],
    COMMERCIAL: ['SHOP', 'OFFICE', 'SHOWROOM', 'WAREHOUSE', 'MALL_SPACE'],
    AGRICULTURAL: ['FARMLAND', 'ORCHARD', 'PLANTATION', 'PASTURE'],
    INDUSTRIAL: ['FACTORY', 'PLANT', 'SHED', 'WORKSHOP'],
  };

  const showFloorFields = ['FLAT', 'APARTMENT', 'PENTHOUSE', 'OFFICE', 'SHOP'].includes(form.propertySubType);

  if (mounted && !user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 text-lg mb-4">Login required to register land</p>
          <button onClick={() => router.push('/login')} className="bg-blue-700 text-white px-6 py-2 rounded-lg">Login as Registrar</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-blue-200 hover:text-white">← Back</button>
          <div>
            <h1 className="text-2xl font-bold">Register New Property</h1>
            <p className="text-blue-200 text-sm">Submit to Hyperledger Fabric Blockchain</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📋 Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Land ID *</label>
              <input name="landId" value={form.landId} onChange={handleChange} placeholder="e.g. LAND004" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Survey Number *</label>
              <input name="surveyNumber" value={form.surveyNumber} onChange={handleChange} placeholder="e.g. SRV-2024-004" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Property Type *</label>
              <select name="landType" value={form.landType} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>RESIDENTIAL</option>
                <option>COMMERCIAL</option>
                <option>AGRICULTURAL</option>
                <option>INDUSTRIAL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Property Sub-Type *</label>
              <select name="propertySubType" value={form.propertySubType} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {(propertySubTypes[form.landType] || []).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Owner Name *</label>
              <input name="ownerName" value={form.ownerName} onChange={handleChange} placeholder="Full name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Aadhaar Hash (SHA-256) *</label>
              <input name="ownerAadhaarHash" value={form.ownerAadhaarHash} onChange={handleChange} placeholder="64-char hex" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Floor Details for Flats/Apartments */}
        {showFloorFields && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">🏢 Floor Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Floor Number</label>
                <input name="floorNumber" value={form.floorNumber} onChange={handleChange} placeholder="e.g. 5" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Total Floors</label>
                <input name="totalFloors" value={form.totalFloors} onChange={handleChange} placeholder="e.g. 12" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Facing</label>
                <select name="facing" value={form.facing} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>EAST</option>
                  <option>WEST</option>
                  <option>NORTH</option>
                  <option>SOUTH</option>
                  <option>NORTH_EAST</option>
                  <option>NORTH_WEST</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📍 Location Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">District *</label>
              <input name="district" value={form.district} onChange={handleChange} placeholder="e.g. Pune" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Taluka *</label>
              <input name="taluka" value={form.taluka} onChange={handleChange} placeholder="e.g. Haveli" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">State *</label>
              <input name="state" value={form.state} onChange={handleChange} placeholder="e.g. Maharashtra" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">PIN Code *</label>
              <input name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="e.g. 411001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Latitude</label>
              <input name="latitude" value={form.latitude} onChange={handleChange} placeholder="e.g. 18.5204" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Longitude</label>
              <input name="longitude" value={form.longitude} onChange={handleChange} placeholder="e.g. 73.8567" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {form.latitude && form.longitude && (
            <div className="mt-4 rounded-lg overflow-hidden border border-gray-200">
              <iframe
                width="100%"
                height="250"
                src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`}
                className="border-0"
              />
            </div>
          )}
        </div>

        {/* Area & Valuation */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📐 Area & Valuation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Area (sq.ft) *</label>
              <input name="areaSqFt" value={form.areaSqFt} onChange={handleChange} placeholder="e.g. 1200" type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Area (acres) *</label>
              <input name="areaAcres" value={form.areaAcres} onChange={handleChange} placeholder="e.g. 0.3" type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Market Value (₹) *</label>
              <input name="marketValue" value={form.marketValue} onChange={handleChange} placeholder="e.g. 5000000" type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Government Value (₹) *</label>
              <input name="governmentValue" value={form.governmentValue} onChange={handleChange} placeholder="e.g. 4200000" type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📄 Document Upload (IPFS)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Property Document (PDF/Image)</label>
              <div className="flex gap-3 items-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                />
                <button
                  onClick={handleDocUpload}
                  disabled={!docFile || uploadingDoc}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50"
                >
                  {uploadingDoc ? 'Uploading...' : '⬆️ Upload'}
                </button>
              </div>
              {uploadedDocUrl && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg">
                  <p className="text-green-700 text-xs font-semibold">✅ Uploaded to IPFS!</p>
                  <p className="text-green-600 text-xs font-mono break-all">{form.documentIpfsHash}</p>
                  <a href={uploadedDocUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline">View on IPFS ↗</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📸 Property Photos (IPFS)</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Upload Photos (max 10)</label>
            <div className="flex gap-3 items-center">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
              />
              <button
                onClick={handlePhotoUpload}
                disabled={!photoFiles.length || uploadingPhoto}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 disabled:opacity-50"
              >
                {uploadingPhoto ? 'Uploading...' : '⬆️ Upload'}
              </button>
            </div>
            {photoFiles.length > 0 && (
              <p className="text-gray-500 text-xs mt-1">{photoFiles.length} file(s) selected</p>
            )}
            {uploadedPhotoUrl && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg">
                <p className="text-green-700 text-xs font-semibold">✅ Photos uploaded to IPFS!</p>
                <a href={uploadedPhotoUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline">View on IPFS ↗</a>
              </div>
            )}
            {uploadedPhotoUrl && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <img src={uploadedPhotoUrl} alt="Property" className="rounded-lg w-full h-24 object-cover border" />
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
        {success && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg font-semibold">{success}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 text-lg"
        >
          {loading ? '⏳ Submitting to Blockchain...' : '⛓️ Register Property on Blockchain'}
        </button>
      </div>
    </main>
  );
}