package main

// ═══════════════════════════════════════════════════════
// ENUMS — Think of these like database ENUM types
// ═══════════════════════════════════════════════════════

// LandStatus — every land parcel is always in one of these 5 states
type LandStatus string

const (
	StatusActive    LandStatus = "ACTIVE"    // Normal — can be transferred
	StatusFrozen    LandStatus = "FROZEN"    // Govt freeze — cannot be touched
	StatusDisputed  LandStatus = "DISPUTED"  // Court stay order — locked
	StatusMortgaged LandStatus = "MORTGAGED" // Bank lien — transfer blocked
	StatusPending   LandStatus = "PENDING"   // Registered, awaiting registrar approval
)

// TransferType — how did ownership change hands?
type TransferType string

const (
	TransferSale        TransferType = "SALE"
	TransferGift        TransferType = "GIFT"
	TransferInheritance TransferType = "INHERITANCE"
	TransferCourtOrder  TransferType = "COURT_ORDER"
	TransferAuction     TransferType = "AUCTION"
)

// ═══════════════════════════════════════════════════════
// LAND ASSET — Primary state object on the ledger
// ═══════════════════════════════════════════════════════

type LandAsset struct {
	// --- Identity ---
	LandID       string `json:"landId"` // MH-PUNE-HAVELI-123
	SurveyNumber string `json:"surveyNumber"`
	District     string `json:"district"`
	Taluka       string `json:"taluka"`
	State        string `json:"state"`
	PinCode      string `json:"pinCode"`

	// --- Physical details ---
	AreaSqFt  float64 `json:"areaSqFt"`
	AreaAcres float64 `json:"areaAcres"`
	LandType  string  `json:"landType"` // RESIDENTIAL|COMMERCIAL|AGRICULTURAL

	// --- Ownership ---
	// SECURITY RULE: We store SHA-256 hash of Aadhaar, NEVER the raw number
	// If blockchain is ever read by attacker, no Aadhaar numbers are exposed
	OwnerID          string `json:"ownerId"` // Fabric CA certificate CN
	OwnerName        string `json:"ownerName"`
	OwnerAadhaarHash string `json:"ownerAadhaarHash"` // SHA-256(aadhaar)

	// --- IPFS Document Storage ---
	// Large files live on IPFS, blockchain only stores the content hash (CID)
	// This keeps blockchain lean — storing PDFs on-chain would be insane
	DocumentIPFSHash string `json:"documentIpfsHash"` // Title deed CID
	SurveyIPFSHash   string `json:"surveyIpfsHash"`   // Survey map CID
	GISCoordinates   string `json:"gisCoordinates"`   // GeoJSON polygon

	// --- Status & Locks ---
	Status       LandStatus `json:"status"`
	MortgageLock bool       `json:"mortgageLock"` // True = bank lien active
	DisputeFlag  bool       `json:"disputeFlag"`  // True = court stay order

	// --- Financial ---
	MarketValue     float64 `json:"marketValue"`
	GovernmentValue float64 `json:"governmentValue"` // Circle rate for stamp duty

	// --- SBT Certificate ---
	NFTTokenID string `json:"nftTokenId"` // Soulbound token — non-transferable

	// --- Audit Trail ---
	RegistrarID      string `json:"registrarId"`
	RegistrationDate string `json:"registrationDate"` // RFC3339
	LastUpdated      string `json:"lastUpdated"`
	BlockchainTxID   string `json:"blockchainTxId"`
}

// ═══════════════════════════════════════════════════════
// TRANSFER RECORD — Builds the "chain of title" history
// Every transfer is a permanent, immutable record
// ═══════════════════════════════════════════════════════

type TransferRecord struct {
	TransferID   string       `json:"transferId"`
	LandID       string       `json:"landId"`
	FromOwnerID  string       `json:"fromOwnerId"`
	ToOwnerID    string       `json:"toOwnerId"`
	TransferType TransferType `json:"transferType"`

	// Financial details
	SaleAmount      float64 `json:"saleAmount"`
	StampDutyPaid   float64 `json:"stampDutyPaid"`
	RegistrationFee float64 `json:"registrationFee"`

	// Multi-signature — ALL THREE must sign for transfer to be valid
	// This is our fraud prevention — no single party can push a transfer
	SellerSignature    string `json:"sellerSignature"`
	BuyerSignature     string `json:"buyerSignature"`
	RegistrarSignature string `json:"registrarSignature"`

	// AI Fraud Detection result — computed BEFORE submitting to blockchain
	FraudScore float64  `json:"fraudScore"` // 0.0=clean, 1.0=high risk
	FraudFlags []string `json:"fraudFlags"` // ["PRICE_ANOMALY","RAPID_FLIP"]

	// Document proof on IPFS
	IPFSDocHash string `json:"ipfsDocHash"`

	// Audit
	Timestamp string `json:"timestamp"` // RFC3339
	TxID      string `json:"txId"`      // Fabric transaction ID
}

// ═══════════════════════════════════════════════════════
// DISPUTE RECORD — Our custom module (Recommendation #3)
// Handles court stay orders with 90-day arbitration lock
// ═══════════════════════════════════════════════════════

type DisputeRecord struct {
	DisputeID string `json:"disputeId"`
	LandID    string `json:"landId"`

	// Who is fighting whom
	ComplainantID string `json:"complainantId"` // Who raised dispute
	RespondentID  string `json:"respondentId"`  // Current owner

	// Dispute details
	DisputeType string `json:"disputeType"` // BOUNDARY|OWNERSHIP|FRAUD|INHERITANCE
	Description string `json:"description"`

	// Court order stored on IPFS
	CourtOrderIPFSHash string `json:"courtOrderIpfsHash"`

	// 90-day arbitration deadline — after this, system auto-flags for resolution
	ArbitrationDeadline string `json:"arbitrationDeadline"` // RFC3339, FiledAt + 90 days

	// Lifecycle
	Status     string `json:"status"`     // FILED|UNDER_REVIEW|RESOLVED|DISMISSED
	Resolution string `json:"resolution"` // Final outcome text
	FiledAt    string `json:"filedAt"`
	ResolvedAt string `json:"resolvedAt"`

	// Who handled it
	ArbitratorID string `json:"arbitratorId"` // Registrar who resolved
}

// ═══════════════════════════════════════════════════════
// MORTGAGE RECORD — Stored on mortgage-channel ONLY
// Banks can see this, citizens and survey dept cannot
// ═══════════════════════════════════════════════════════

type MortgageRecord struct {
	MortgageID   string  `json:"mortgageId"`
	LandID       string  `json:"landId"`
	BankID       string  `json:"bankId"` // Bank's Fabric CA identity
	LoanID       string  `json:"loanId"` // Bank's internal loan reference
	LoanAmount   float64 `json:"loanAmount"`
	InterestRate float64 `json:"interestRate"`
	LienType     string  `json:"lienType"` // MORTGAGE|EQUITABLE|LEGAL

	// Lifecycle
	Status     string `json:"status"` // ACTIVE|RELEASED|DEFAULTED
	PlacedAt   string `json:"placedAt"`
	ReleasedAt string `json:"releasedAt"`

	// Document proof
	LoanAgreementIPFSHash string `json:"loanAgreementIpfsHash"`
}
