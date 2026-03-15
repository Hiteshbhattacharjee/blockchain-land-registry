import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export interface LandRecord {
  landId: string;
  land_id?: string;
  surveyNumber: string;
  survey_number?: string;
  district: string;
  taluka: string;
  state: string;
  pinCode: string;
  pin_code?: string;
  areaSqFt: number;
  area_sqft?: number;
  areaAcres: number;
  area_acres?: number;
  landType: string;
  land_type?: string;
  ownerName: string;
  owner_name?: string;
  status: string;
  mortgageLock: boolean;
  mortgage_lock?: boolean;
  disputeFlag: boolean;
  dispute_flag?: boolean;
  marketValue: number;
  market_value?: number;
  governmentValue: number;
  government_value?: number;
  blockchainTxId: string;
  blockchain_tx_id?: string;
  registrationDate: string;
  registration_date?: string;
  lastUpdated: string;
  last_updated?: string;
}

function normalize(data: LandRecord): LandRecord {
  return {
    ...data,
    landId: data.landId || data.land_id || '',
    surveyNumber: data.surveyNumber || data.survey_number || '',
    pinCode: data.pinCode || data.pin_code || '',
    areaSqFt: data.areaSqFt || data.area_sqft || 0,
    areaAcres: data.areaAcres || data.area_acres || 0,
    landType: data.landType || data.land_type || '',
    ownerName: data.ownerName || data.owner_name || '',
    mortgageLock: data.mortgageLock ?? data.mortgage_lock ?? false,
    disputeFlag: data.disputeFlag ?? data.dispute_flag ?? false,
    marketValue: data.marketValue || data.market_value || 0,
    governmentValue: data.governmentValue || data.government_value || 0,
    blockchainTxId: data.blockchainTxId || data.blockchain_tx_id || '',
    registrationDate: data.registrationDate || data.registration_date || '',
    lastUpdated: data.lastUpdated || data.last_updated || '',
  };
}

export async function getLand(landId: string): Promise<LandRecord> {
  const res = await axios.get(`${API_BASE}/land/${landId}`);
  return normalize(res.data.data);
}

export async function getAllLands(filters?: Record<string, string>): Promise<LandRecord[]> {
  const res = await axios.get(`${API_BASE}/land/`, { params: filters });
  return res.data.data.map(normalize);
}

export async function registerLand(data: Partial<LandRecord>): Promise<{ success: boolean; landId: string }> {
  const res = await axios.post(`${API_BASE}/land/register`, data);
  return res.data.data;
}
