'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLand, getLandHistory, LandRecord } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

interface TransferRecord {
  transferId: string;
  landId: string;
  toOwnerId: string;
  transferType: string;
  saleAmount: number;
  stampDutyPaid: number;
  registrationFee: number;
  sellerSignature: string;
  buyerSignature: string;
  fraudScore: number;
  ipfsDocHash: string;
  timestamp: string;
  txId: string;
}

export default function LandDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token, mounted } = useAuth();
  const [land, setLand] = useState<LandRecord | null>(null);
  const [history, setHistory] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'transfer'>('details');
  const [approving, setApproving] = useState(false);
  const [approveMsg, setApproveMsg] = useState('');

  const [transferForm, setTransferForm] = useState({
    newOwnerName: '',
    newOwnerAadhaarHash: '',
    transferType: 'SALE',
    saleValue: '',
    stampDuty: '',
    registrationFee: '',
    sellerSignature: '',
    buyerSignature: '',
    ipfsDocHash: '',
    fraudScore: '0.1',
    fraudFlags: '[]',
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  useEffect(() => {
    if (id) {
      Promise.all([
        getLand(id as string),
        getLandHistory(id as string),
      ])
        .then(([landData, historyData]) => {
          setLand(landData);
          setHistory(historyData as TransferRecord[]);
        })
        .catch(() => setError('Land record not found'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleApprove = async () => {
    setApproving(true);
    setApproveMsg('');
    try {
      await axios.post(`${API_BASE}/land/approve`,
        { landId: id, approvalNotes: 'Approved by registrar' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApproveMsg('✅ Land approved successfully! Refreshing...');
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      setApproveMsg('❌ Approval failed. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const handleTransfer = async () => {
    setTransferLoading(true);
    setTransferError('');
    setTransferSuccess('');
    try {
      await axios.post(`${API_BASE}/land/transfer`,
        { landId: id, ...transferForm, saleValue: Number(transferForm.saleValue), stampDuty: Number(transferForm.stampDuty), registrationFee: Number(transferForm.registrationFee), fraudScore: Number(transferForm.fraudScore) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransferSuccess(`Ownership transferred to ${transferForm.newOwnerName} on blockchain!`);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transfer failed';
      setTransferError(msg);
    } finally {
      setTransferLoading(false);
    }
  };

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
        <button onClick={() => router.push('/')} className="bg-blue-700 text-white px-6 py-2 rounded-lg">Go Back</button>
      </div>
    </div>
  );

  if (!land) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="text-blue-200 hover:text-white">← Back</button>
            <div>
              <h1 className="text-2xl font-bold">Land Record — {land.landId}</h1>
              <p className="text-blue-200 text-sm">Verified on Hyperledger Fabric Blockchain</p>
            </div>
          </div>
          {mounted && user && (
            <span className="text-blue-200 text-sm">👤 {user.name}</span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Status Banner */}
        <div className={`border rounded-xl p-4 flex items-center justify-between mb-4 ${getStatusColor(land.status)}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {land.status === 'ACTIVE' ? '✅' : land.status === 'PENDING' ? '⏳' : '⚠️'}
            </span>
            <div>
              <p className="font-bold text-lg">{land.status}</p>
              <p className="text-sm opacity-75">Current Registration Status</p>
            </div>
          </div>
          <div className="text-right text-sm font-semibold">
            <p>👤 {land.ownerName}</p>
            {land.mortgageLock && <p className="text-red-600">🔒 Mortgaged</p>}
            {land.disputeFlag && <p className="text-orange-600">⚠️ Disputed</p>}
          </div>
        </div>

        {/* Approve Button for Registrar */}
        {mounted && user?.role === 'registrar' && land.status === 'PENDING' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-yellow-800">⏳ Pending Approval</p>
              <p className="text-yellow-600 text-sm">This land is awaiting registrar approval</p>
            </div>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {approving ? 'Approving...' : '✅ Approve Land'}
            </button>
          </div>
        )}
        {approveMsg && (
          <p className="text-sm p-3 rounded-lg mb-4 bg-green-50 text-green-700 font-semibold">{approveMsg}</p>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {(['details', 'history', 'transfer'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold capitalize rounded-t-lg transition ${
                activeTab === tab
                  ? 'bg-white border border-b-white text-blue-700 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'details' ? '📋 Details' : tab === 'history' ? `📜 History (${history.length})` : '🔄 Transfer'}
            </button>
          ))}
        </div>

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">👤 Owner Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-gray-500 text-sm">Owner Name</p><p className="font-semibold text-gray-900">{land.ownerName}</p></div>
                <div><p className="text-gray-500 text-sm">Land Type</p><p className="font-semibold text-gray-900">{land.landType}</p></div>
                <div><p className="text-gray-500 text-sm">Registration Date</p><p className="font-semibold text-gray-900">{new Date(land.registrationDate).toLocaleDateString('en-IN')}</p></div>
                <div><p className="text-gray-500 text-sm">Last Updated</p><p className="font-semibold text-gray-900">{new Date(land.lastUpdated).toLocaleDateString('en-IN')}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📍 Location Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-gray-500 text-sm">Survey Number</p><p className="font-semibold text-gray-900">{land.surveyNumber}</p></div>
                <div><p className="text-gray-500 text-sm">District</p><p className="font-semibold text-gray-900">{land.district}</p></div>
                <div><p className="text-gray-500 text-sm">Taluka</p><p className="font-semibold text-gray-900">{land.taluka}</p></div>
                <div><p className="text-gray-500 text-sm">State</p><p className="font-semibold text-gray-900">{land.state}</p></div>
                <div><p className="text-gray-500 text-sm">PIN Code</p><p className="font-semibold text-gray-900">{land.pinCode}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">📐 Area & Valuation</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-gray-500 text-sm">Area (sq.ft)</p><p className="font-semibold text-gray-900">{land.areaSqFt} sq.ft</p></div>
                <div><p className="text-gray-500 text-sm">Area (acres)</p><p className="font-semibold text-gray-900">{land.areaAcres} acres</p></div>
                <div><p className="text-gray-500 text-sm">Market Value</p><p className="font-bold text-green-700 text-lg">₹{Number(land.marketValue).toLocaleString('en-IN')}</p></div>
                <div><p className="text-gray-500 text-sm">Government Value</p><p className="font-bold text-blue-700 text-lg">₹{Number(land.governmentValue).toLocaleString('en-IN')}</p></div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 text-white">
              <h2 className="font-bold mb-4 border-b border-gray-700 pb-2">⛓️ Blockchain Verification</h2>
              <div>
                <p className="text-gray-400 text-sm">Transaction ID</p>
                <p className="font-mono text-green-400 text-sm break-all">{land.blockchainTxId}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-green-400 text-sm font-semibold">Verified on Hyperledger Fabric 2.5.9</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
                <p className="text-4xl mb-3">📜</p>
                <p className="text-lg">No transfer history yet</p>
                <p className="text-sm mt-1">This land has not been transferred since registration</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((record, index) => (
                  <div key={record.transferId} className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">Transfer #{index + 1}</span>
                        <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">{record.transferType}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{new Date(record.timestamp).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-gray-500">Sale Amount</p><p className="font-bold text-green-700">₹{Number(record.saleAmount).toLocaleString('en-IN')}</p></div>
                      <div><p className="text-gray-500">Stamp Duty</p><p className="font-semibold text-gray-900">₹{Number(record.stampDutyPaid).toLocaleString('en-IN')}</p></div>
                      <div><p className="text-gray-500">Registration Fee</p><p className="font-semibold text-gray-900">₹{Number(record.registrationFee).toLocaleString('en-IN')}</p></div>
                      <div><p className="text-gray-500">Fraud Score</p>
                        <p className={`font-semibold ${record.fraudScore > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                          {record.fraudScore} {record.fraudScore > 0.5 ? '⚠️' : '✅'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-gray-500 text-xs">Transaction ID</p>
                      <p className="font-mono text-xs text-blue-600 break-all">{record.txId}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRANSFER TAB */}
        {activeTab === 'transfer' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-gray-700 mb-1">🔄 Transfer Ownership</h2>
            <p className="text-gray-400 text-sm mb-6">This action is permanent and recorded on blockchain</p>

            {!mounted || !user ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-700 font-semibold">⚠️ Login required to transfer ownership</p>
                <button onClick={() => router.push('/login')} className="mt-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Login as Registrar</button>
              </div>
            ) : land.status !== 'ACTIVE' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-700 font-semibold">⚠️ Land must be ACTIVE to transfer</p>
                <p className="text-yellow-600 text-sm">Current status: {land.status}</p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'New Owner Name *', key: 'newOwnerName', placeholder: 'Full name' },
                { label: 'New Owner Aadhaar Hash *', key: 'newOwnerAadhaarHash', placeholder: '64-char hex' },
                { label: 'Sale Value (₹) *', key: 'saleValue', placeholder: 'e.g. 5500000' },
                { label: 'Stamp Duty (₹)', key: 'stampDuty', placeholder: 'e.g. 55000' },
                { label: 'Registration Fee (₹)', key: 'registrationFee', placeholder: 'e.g. 11000' },
                { label: 'Seller Signature', key: 'sellerSignature', placeholder: 'SELLER_SIG' },
                { label: 'Buyer Signature', key: 'buyerSignature', placeholder: 'BUYER_SIG' },
                { label: 'IPFS Document Hash', key: 'ipfsDocHash', placeholder: 'Qm...' },
                { label: 'Fraud Score (0-1)', key: 'fraudScore', placeholder: '0.1' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="text"
                    value={transferForm[key as keyof typeof transferForm]}
                    onChange={(e) => setTransferForm({ ...transferForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Transfer Type</label>
                <select
                  value={transferForm.transferType}
                  onChange={(e) => setTransferForm({ ...transferForm, transferType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                >
                  <option>SALE</option>
                  <option>GIFT</option>
                  <option>INHERITANCE</option>
                  <option>COURT_ORDER</option>
                </select>
              </div>
            </div>

            {transferError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mt-4">{transferError}</p>}
            {transferSuccess && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg mt-4 font-semibold">{transferSuccess}</p>}

            <button
              onClick={handleTransfer}
              disabled={transferLoading || land.status !== 'ACTIVE' || !user}
              className="w-full mt-6 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50 text-lg"
            >
              {transferLoading ? '⏳ Submitting to Blockchain...' : '⛓️ Transfer Ownership on Blockchain'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}