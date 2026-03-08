package main

import (
	"fmt"
	"os"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract is the main chaincode struct
type SmartContract struct {
	contractapi.Contract
}

func main() {
	landChaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error creating land registry chaincode: %v", err)
		os.Exit(1)
	}

	if err := landChaincode.Start(); err != nil {
		fmt.Fprintf(os.Stderr, "Error starting land registry chaincode: %v", err)
		os.Exit(1)
	}
}
