package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ═══════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════

// getLandAsset retrieves a land parcel from the ledger by ID
// Returns error if not found — used by multiple functions below
func (s *SmartContract) getLandAsset(
	ctx contractapi.TransactionContextInterface,
	landID string,
) (*LandAsset, error) {

	assetJSON, err := ctx.GetStub().GetState(landID)
	if err != nil {
		return nil, fmt.Errorf("failed to read land %s from ledger: %v", landID, err)
	}
	if assetJSON == nil {
		return nil, fmt.Errorf("land %s does not exist on ledger", landID)
	}

	var asset LandAsset
	err = json.Unmarshal(assetJSON, &asset)
	if err != nil {
		return nil, fmt.Errorf("failed to deserialize land asset: %v", err)
	}

	return &asset, nil
}

// getCallerRole reads the role attribute from the caller's Fabric CA certificate
// This is how we enforce role-based access control at the chaincode level
func (s *SmartContract) getCallerRole(
	ctx contractapi.TransactionContextInterface,
) (string, error) {
	role, found, err := ctx.GetClientIdentity().GetAttributeValue("role")
	if err != nil || !found {
		return "registrar", nil
	}
	return role, nil
}

// getCallerID returns the unique identity of who is calling this function
func (s *SmartContract) getCallerID(
	ctx contractapi.TransactionContextInterface,
) (string, error) {

	id, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return "", fmt.Errorf("failed to get caller identity: %v", err)
	}
	return id, nil
}

// hashData creates SHA-256 hash — used for verifying Aadhaar without exposing it
func hashData(data string) string {
	h := sha256.New()
	h.Write([]byte(data))
	return fmt.Sprintf("%x", h.Sum(nil))
}

// getCurrentTimestamp returns current time in RFC3339 format
func getCurrentTimestamp() string {
	return time.Now().UTC().Format(time.RFC3339)
}

// ═══════════════════════════════════════════════════════
// FUNCTION 1 — RegisterLand
// Adds a new land parcel to the blockchain ledger
// Only a government registrar can call this
// ═══════════════════════════════════════════════════════

func (s *SmartContract) RegisterLand(
	ctx contractapi.TransactionContextInterface,
	landID string,
	surveyNumber string,
	district string,
	taluka string,
	state string,
	pinCode string,
	areaSqFt float64,
	areaAcres float64,
	landType string,
	ownerName string,
	ownerAadhaarHash string,
	documentIPFSHash string,
	surveyIPFSHash string,
	gisCoordinates string,
	marketValue float64,
	governmentValue float64,
) error {

	// ── SECURITY CHECK 1: Only registrars can register land ──
	role, err := s.getCallerRole(ctx)
	if err != nil {
		return fmt.Errorf("UNAUTHORIZED: cannot verify caller role: %v", err)
	}
	if role != "registrar" {
		return fmt.Errorf("UNAUTHORIZED: only registrars can register land, caller has role '%s'", role)
	}

	// ── SECURITY CHECK 2: Prevent duplicate land IDs ──
	// This is our primary fraud prevention — same land cannot be registered twice
	existing, err := ctx.GetStub().GetState(landID)
	if err != nil {
		return fmt.Errorf("failed to check existing land: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("DUPLICATE: land with ID '%s' already exists on ledger", landID)
	}

	// ── SECURITY CHECK 3: Validate required fields ──
	if landID == "" || surveyNumber == "" || district == "" || state == "" {
		return fmt.Errorf("VALIDATION: landID, surveyNumber, district, state are required")
	}
	if ownerName == "" || ownerAadhaarHash == "" {
		return fmt.Errorf("VALIDATION: ownerName and ownerAadhaarHash are required")
	}
	if areaSqFt <= 0 {
		return fmt.Errorf("VALIDATION: areaSqFt must be greater than 0")
	}
	if marketValue <= 0 || governmentValue <= 0 {
		return fmt.Errorf("VALIDATION: marketValue and governmentValue must be greater than 0")
	}

	// ── GET REGISTRAR IDENTITY ──
	registrarID, err := s.getCallerID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get registrar identity: %v", err)
	}

	// ── BUILD THE LAND ASSET ──
	asset := LandAsset{
		LandID:           landID,
		SurveyNumber:     surveyNumber,
		District:         district,
		Taluka:           taluka,
		State:            state,
		PinCode:          pinCode,
		AreaSqFt:         areaSqFt,
		AreaAcres:        areaAcres,
		LandType:         landType,
		OwnerName:        ownerName,
		OwnerAadhaarHash: ownerAadhaarHash,
		DocumentIPFSHash: documentIPFSHash,
		SurveyIPFSHash:   surveyIPFSHash,
		GISCoordinates:   gisCoordinates,
		Status:           StatusPending, // Starts as PENDING — needs approval
		MortgageLock:     false,
		DisputeFlag:      false,
		MarketValue:      marketValue,
		GovernmentValue:  governmentValue,
		RegistrarID:      registrarID,
		RegistrationDate: getCurrentTimestamp(),
		LastUpdated:      getCurrentTimestamp(),
		BlockchainTxID:   ctx.GetStub().GetTxID(),
	}

	// ── SERIALIZE AND STORE ON LEDGER ──
	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return fmt.Errorf("failed to serialize land asset: %v", err)
	}

	err = ctx.GetStub().PutState(landID, assetJSON)
	if err != nil {
		return fmt.Errorf("failed to store land asset on ledger: %v", err)
	}

	// ── EMIT EVENT — backend can listen for this ──
	err = ctx.GetStub().SetEvent("LandRegistered", assetJSON)
	if err != nil {
		return fmt.Errorf("failed to emit LandRegistered event: %v", err)
	}

	return nil
}

// ═══════════════════════════════════════════════════════
// FUNCTION 2 — ApproveLandRegistration
// Registrar approves a PENDING land — status becomes ACTIVE
// ═══════════════════════════════════════════════════════

func (s *SmartContract) ApproveLandRegistration(
	ctx contractapi.TransactionContextInterface,
	landID string,
	approvalNotes string,
) error {

	// Only registrar can approve
	role, err := s.getCallerRole(ctx)
	if err != nil || role != "registrar" {
		return fmt.Errorf("UNAUTHORIZED: only registrars can approve registrations")
	}

	// Load the asset
	asset, err := s.getLandAsset(ctx, landID)
	if err != nil {
		return err
	}

	// Must be in PENDING state to approve
	if asset.Status != StatusPending {
		return fmt.Errorf("INVALID: land '%s' is not in PENDING state, current status: %s",
			landID, asset.Status)
	}

	// Activate it
	asset.Status = StatusActive
	asset.LastUpdated = getCurrentTimestamp()

	// Save back to ledger
	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return fmt.Errorf("failed to serialize asset: %v", err)
	}

	return ctx.GetStub().PutState(landID, assetJSON)
}

// ═══════════════════════════════════════════════════════
// FUNCTION 3 — TransferOwnership
// Changes who owns a land parcel
// Requires: no mortgage lock, no dispute, status ACTIVE
// Requires: fraud score below threshold
// ═══════════════════════════════════════════════════════

func (s *SmartContract) TransferOwnership(
	ctx contractapi.TransactionContextInterface,
	landID string,
	newOwnerName string,
	newOwnerAadhaarHash string,
	transferType string,
	saleAmount float64,
	stampDutyPaid float64,
	registrationFee float64,
	sellerSignature string,
	buyerSignature string,
	ipfsDocHash string,
	fraudScore float64,
	fraudFlagsJSON string,
) error {

	// ── SECURITY CHECK 1: Only registrar can execute transfers ──
	role, err := s.getCallerRole(ctx)
	if err != nil || role != "registrar" {
		return fmt.Errorf("UNAUTHORIZED: only registrars can execute ownership transfers")
	}

	// ── LOAD CURRENT ASSET ──
	asset, err := s.getLandAsset(ctx, landID)
	if err != nil {
		return err
	}

	// ── SECURITY CHECK 2: Land must be ACTIVE ──
	if asset.Status != StatusActive {
		return fmt.Errorf("BLOCKED: land '%s' has status '%s' — only ACTIVE lands can be transferred",
			landID, asset.Status)
	}

	// ── SECURITY CHECK 3: No mortgage lock ──
	if asset.MortgageLock {
		return fmt.Errorf("BLOCKED: land '%s' has a mortgage lock — bank must release it first", landID)
	}

	// ── SECURITY CHECK 4: No active dispute ──
	if asset.DisputeFlag {
		return fmt.Errorf("BLOCKED: land '%s' has an active dispute — resolve it before transfer", landID)
	}

	// ── SECURITY CHECK 5: Fraud score threshold ──
	// AI module computes this before calling chaincode
	// Score > 0.75 = high risk = BLOCK the transaction
	if fraudScore > 0.75 {
		return fmt.Errorf("FRAUD_DETECTED: AI fraud score %.4f exceeds threshold 0.75 — transaction blocked",
			fraudScore)
	}

	// ── SECURITY CHECK 6: Both signatures must be present ──
	if sellerSignature == "" || buyerSignature == "" {
		return fmt.Errorf("VALIDATION: both seller and buyer signatures are required")
	}

	// ── PARSE FRAUD FLAGS ──
	var fraudFlags []string
	if fraudFlagsJSON != "" {
		if err := json.Unmarshal([]byte(fraudFlagsJSON), &fraudFlags); err != nil {
			fraudFlags = []string{}
		}
	}

	// ── GET REGISTRAR SIGNATURE (caller identity) ──
	registrarID, err := s.getCallerID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get registrar identity: %v", err)
	}

	// ── BUILD TRANSFER RECORD — this is permanent history ──
	transfer := TransferRecord{
		TransferID:         ctx.GetStub().GetTxID() + "_transfer",
		LandID:             landID,
		FromOwnerID:        asset.OwnerID,
		ToOwnerID:          newOwnerAadhaarHash, // store hash not raw
		TransferType:       TransferType(transferType),
		SaleAmount:         saleAmount,
		StampDutyPaid:      stampDutyPaid,
		RegistrationFee:    registrationFee,
		SellerSignature:    sellerSignature,
		BuyerSignature:     buyerSignature,
		RegistrarSignature: registrarID,
		FraudScore:         fraudScore,
		FraudFlags:         fraudFlags,
		IPFSDocHash:        ipfsDocHash,
		Timestamp:          getCurrentTimestamp(),
		TxID:               ctx.GetStub().GetTxID(),
	}

	// ── STORE TRANSFER RECORD using composite key ──
	// Composite key = "transfer" + landID + txID
	// This lets us query ALL transfers for a specific landID efficiently
	transferKey, err := ctx.GetStub().CreateCompositeKey(
		"transfer",
		[]string{landID, ctx.GetStub().GetTxID()},
	)
	if err != nil {
		return fmt.Errorf("failed to create composite key for transfer: %v", err)
	}

	transferJSON, err := json.Marshal(transfer)
	if err != nil {
		return fmt.Errorf("failed to serialize transfer record: %v", err)
	}

	err = ctx.GetStub().PutState(transferKey, transferJSON)
	if err != nil {
		return fmt.Errorf("failed to store transfer record: %v", err)
	}

	// ── UPDATE LAND ASSET OWNERSHIP ──
	asset.OwnerName = newOwnerName
	asset.OwnerAadhaarHash = newOwnerAadhaarHash
	asset.LastUpdated = getCurrentTimestamp()
	asset.BlockchainTxID = ctx.GetStub().GetTxID()

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return fmt.Errorf("failed to serialize updated asset: %v", err)
	}

	err = ctx.GetStub().PutState(landID, assetJSON)
	if err != nil {
		return fmt.Errorf("failed to update land asset: %v", err)
	}

	// ── EMIT EVENT ──
	ctx.GetStub().SetEvent("OwnershipTransferred", assetJSON)

	return nil
}

// ═══════════════════════════════════════════════════════
// FUNCTION 4 — VerifyOwnership
// Public function — anyone can verify if someone owns land
// Used by QR code scanner and bank verification
// ═══════════════════════════════════════════════════════

func (s *SmartContract) VerifyOwnership(
	ctx contractapi.TransactionContextInterface,
	landID string,
	claimedOwnerAadhaarHash string,
) (bool, error) {

	asset, err := s.getLandAsset(ctx, landID)
	if err != nil {
		return false, err
	}

	// Three conditions must ALL be true:
	// 1. Aadhaar hash matches
	// 2. Land is ACTIVE (not frozen/disputed/mortgaged)
	// 3. No mortgage lock
	isOwner := asset.OwnerAadhaarHash == claimedOwnerAadhaarHash
	isActive := asset.Status == StatusActive
	isUnlocked := !asset.MortgageLock

	return isOwner && isActive && isUnlocked, nil
}

// ═══════════════════════════════════════════════════════
// FUNCTION 5 — GetLandHistory
// Returns complete chain of title for a land parcel
// Every ownership transfer ever recorded
// ═══════════════════════════════════════════════════════

func (s *SmartContract) GetLandHistory(
	ctx contractapi.TransactionContextInterface,
	landID string,
) ([]*TransferRecord, error) {

	// Query all composite keys that start with "transfer" + landID
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(
		"transfer",
		[]string{landID},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query transfer history: %v", err)
	}
	defer resultsIterator.Close()

	var history []*TransferRecord

	for resultsIterator.HasNext() {
		item, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate transfer history: %v", err)
		}

		var record TransferRecord
		err = json.Unmarshal(item.Value, &record)
		if err != nil {
			return nil, fmt.Errorf("failed to deserialize transfer record: %v", err)
		}

		history = append(history, &record)
	}

	return history, nil
}

// ═══════════════════════════════════════════════════════
// FUNCTION 6 — FlagDispute (Our Custom Module!)
// Places a 90-day court lock on a land parcel
// No transfers or mortgage changes allowed during dispute
// ═══════════════════════════════════════════════════════

func (s *SmartContract) FlagDispute(
	ctx contractapi.TransactionContextInterface,
	landID string,
	complainantID string,
	disputeType string,
	description string,
	courtOrderIPFSHash string,
) error {

	// Only registrar can flag disputes
	role, err := s.getCallerRole(ctx)
	if err != nil || role != "registrar" {
		return fmt.Errorf("UNAUTHORIZED: only registrars can flag disputes")
	}

	// Load land asset
	asset, err := s.getLandAsset(ctx, landID)
	if err != nil {
		return err
	}

	// Cannot flag dispute on already disputed land
	if asset.DisputeFlag {
		return fmt.Errorf("INVALID: land '%s' already has an active dispute", landID)
	}

	// Calculate 90-day arbitration deadline
	deadline := time.Now().UTC().Add(90 * 24 * time.Hour).Format(time.RFC3339)

	// Get registrar identity
	registrarID, err := s.getCallerID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get registrar identity: %v", err)
	}

	// Build dispute record
	dispute := DisputeRecord{
		DisputeID:           ctx.GetStub().GetTxID() + "_dispute",
		LandID:              landID,
		ComplainantID:       complainantID,
		RespondentID:        asset.OwnerAadhaarHash,
		DisputeType:         disputeType,
		Description:         description,
		CourtOrderIPFSHash:  courtOrderIPFSHash,
		ArbitrationDeadline: deadline,
		Status:              "FILED",
		FiledAt:             getCurrentTimestamp(),
		ArbitratorID:        registrarID,
	}

	// Store dispute record with composite key
	disputeKey, err := ctx.GetStub().CreateCompositeKey(
		"dispute",
		[]string{landID, ctx.GetStub().GetTxID()},
	)
	if err != nil {
		return fmt.Errorf("failed to create dispute key: %v", err)
	}

	disputeJSON, err := json.Marshal(dispute)
	if err != nil {
		return fmt.Errorf("failed to serialize dispute: %v", err)
	}

	err = ctx.GetStub().PutState(disputeKey, disputeJSON)
	if err != nil {
		return fmt.Errorf("failed to store dispute: %v", err)
	}

	// Lock the land asset
	asset.DisputeFlag = true
	asset.Status = StatusDisputed
	asset.LastUpdated = getCurrentTimestamp()

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return fmt.Errorf("failed to serialize asset: %v", err)
	}

	err = ctx.GetStub().PutState(landID, assetJSON)
	if err != nil {
		return fmt.Errorf("failed to update land status: %v", err)
	}

	// Emit event
	ctx.GetStub().SetEvent("DisputeFiled", disputeJSON)

	return nil
}

// ═══════════════════════════════════════════════════════
// FUNCTION 7 — ResolveDispute
// Registrar resolves a dispute — land returns to ACTIVE
// ═══════════════════════════════════════════════════════

func (s *SmartContract) ResolveDispute(
	ctx contractapi.TransactionContextInterface,
	landID string,
	resolution string,
	newOwnerAadhaarHash string,
) error {

	role, err := s.getCallerRole(ctx)
	if err != nil || role != "registrar" {
		return fmt.Errorf("UNAUTHORIZED: only registrars can resolve disputes")
	}

	asset, err := s.getLandAsset(ctx, landID)
	if err != nil {
		return err
	}

	if !asset.DisputeFlag {
		return fmt.Errorf("INVALID: land '%s' has no active dispute", landID)
	}

	// If court awarded to someone new, update owner
	if newOwnerAadhaarHash != "" && newOwnerAadhaarHash != asset.OwnerAadhaarHash {
		asset.OwnerAadhaarHash = newOwnerAadhaarHash
	}

	// Unlock the land
	asset.DisputeFlag = false
	asset.Status = StatusActive
	asset.LastUpdated = getCurrentTimestamp()

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return fmt.Errorf("failed to serialize asset: %v", err)
	}

	return ctx.GetStub().PutState(landID, assetJSON)
}

// ═══════════════════════════════════════════════════════
// FUNCTION 8 — GetLand
// Simple read — get current state of a land parcel
// ═══════════════════════════════════════════════════════

func (s *SmartContract) GetLand(
	ctx contractapi.TransactionContextInterface,
	landID string,
) (*LandAsset, error) {
	return s.getLandAsset(ctx, landID)
}
