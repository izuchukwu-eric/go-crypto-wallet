package main

import (
	"context"
	"encoding/asn1"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/decred/dcrd/dcrec/secp256k1/v4"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"

	// "github.com/ethereum/go-ethereum/rlp"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

type Wallet struct {
	Address string `json:"address"`
	KeyID   string `json:"keyId"`
}
type SignTransactionRequest struct {
	WalletAddress string `json:"walletAddress"`
	KeyID         string `json:"keyId"`
	Nonce         string `json:"nonce"`
	To            string `json:"to"`
	Value         string `json:"value"`
	GasLimit      string `json:"gasLimit"`
	GasPrice      string `json:"gasPrice"`
	Data          string `json:"data"`
	ChainID       int64  `json:"chainId"`
}
type ecdsaSignature struct {
	R, S *big.Int
}

var wallets []Wallet
var kmsClient *kms.Client

const SigningAlgorithmSpecEcdsaSha256 = "ECDSA_SHA_256"

func main() {
	// Load AWS credentials and region from environment variables
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(os.Getenv("AWS_REGION")),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			os.Getenv("AWS_ACCESS_KEY_ID"),
			os.Getenv("AWS_SECRET_ACCESS_KEY"),
			"",
		)),
	)
	if err != nil {
		log.Fatalf("Unable to load SDK config, %v", err)
	}
	kmsClient = kms.NewFromConfig(cfg)

	r := mux.NewRouter()

	r.HandleFunc("/", healthCheck).Methods("GET")
	r.HandleFunc("/wallet", createWallet).Methods("POST")
	r.HandleFunc("/wallets", listWallets).Methods("GET")
	r.HandleFunc("/sign", signTransaction).Methods("POST")

	// Add CORS support
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	log.Fatal(http.ListenAndServe(":8080", handler))
}

func createWallet(w http.ResponseWriter, r *http.Request) {
	// Create a new KMS key
	createKeyInput := &kms.CreateKeyInput{
		Description: aws.String("Wallet key"),
		KeyUsage:    "SIGN_VERIFY",
		KeySpec:     "ECC_SECG_P256K1",
	}
	createKeyOutput, err := kmsClient.CreateKey(context.TODO(), createKeyInput)
	if err != nil {
		log.Printf("Failed to create KMS key: %v", err)
		http.Error(w, "Failed to create KMS key", http.StatusInternalServerError)
		return
	}

	// Get the public key
	getPublicKeyInput := &kms.GetPublicKeyInput{
		KeyId: createKeyOutput.KeyMetadata.KeyId,
	}
	getPublicKeyOutput, err := kmsClient.GetPublicKey(context.TODO(), getPublicKeyInput)
	if err != nil {
		log.Printf("Failed to get public key: %v", err)
		http.Error(w, "Failed to get public key", http.StatusInternalServerError)
		return
	}

	// Get the DER-encoded public key
	pubKeyBytes := getPublicKeyOutput.PublicKey

	// Log the public key in hex for debugging
	log.Printf("Public Key (hex): %s", hex.EncodeToString(pubKeyBytes))

	// Generate Ethereum address from the public key
	pubKeyHash := crypto.Keccak256(pubKeyBytes[1:])
	address := "0x" + hex.EncodeToString(pubKeyHash[12:])

	newWallet := Wallet{
		Address: address,
		KeyID:   *createKeyOutput.KeyMetadata.KeyId,
	}
	wallets = append(wallets, newWallet)

	json.NewEncoder(w).Encode(newWallet)
}

func listWallets(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(wallets)
}

// Helper function to parse the transaction and prepare it for signing
func prepareTransaction(req *SignTransactionRequest) (*types.Transaction, error) {
	nonce, ok := new(big.Int).SetString(req.Nonce, 10)
	if !ok {
		return nil, errors.New("invalid nonce")
	}

	value, ok := new(big.Int).SetString(req.Value, 10)
	if !ok {
		return nil, errors.New("invalid value")
	}

	gasLimit, ok := new(big.Int).SetString(req.GasLimit, 10)
	if !ok {
		return nil, errors.New("invalid gas limit")
	}

	gasPrice, ok := new(big.Int).SetString(req.GasPrice, 10)
	if !ok {
		return nil, errors.New("invalid gas price")
	}

	// Prepare the EVM transaction object
	toAddress := common.HexToAddress(req.To)
	tx := types.NewTransaction(
		nonce.Uint64(),
		toAddress,
		value,
		gasLimit.Uint64(),
		gasPrice,
		common.FromHex(req.Data),
	)

	return tx, nil
}

// Enforce low S value to prevent signature malleability
func enforceLowS(s *big.Int) *big.Int {
	n := secp256k1.S256().N
	halfOrder := new(big.Int).Div(n, big.NewInt(2))

	// If S is greater than N/2, replace S with N - S
	if s.Cmp(halfOrder) == 1 {
		s.Sub(n, s)
	}
	return s
}

func signTransaction(w http.ResponseWriter, r *http.Request) {
	var req SignTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// var SepoliaChainID int64 = req.ChainID
	log.Printf("Received transaction payload: %+v", req)
	log.Printf("Received Chain ID: %+v", req.ChainID)

	// Retrieve the public key from KMS
	getPublicKeyInput := &kms.GetPublicKeyInput{
		KeyId: aws.String(req.KeyID),
	}
	getPublicKeyOutput, err := kmsClient.GetPublicKey(context.TODO(), getPublicKeyInput)
	if err != nil {
		log.Printf("Failed to get public key: %v", err)
		http.Error(w, "Failed to get public key", http.StatusInternalServerError)
		return
	}

	// Derive the Ethereum address from the public key
	pubKeyBytes := getPublicKeyOutput.PublicKey
	pubKeyHash := crypto.Keccak256(pubKeyBytes[1:])
	derivedAddress := "0x" + hex.EncodeToString(pubKeyHash[12:])

	// Verify that the derived address matches the WalletAddress
	if derivedAddress != req.WalletAddress {
		http.Error(w, "KeyID does not match WalletAddress", http.StatusUnauthorized)
		return
	}

	// Prepare the transaction object
	tx, err := prepareTransaction(&req)
	if err != nil {
		http.Error(w, "Failed to prepare transaction: "+err.Error(), http.StatusInternalServerError)
		return
	}
	log.Printf("Raw Transaction: %v", hex.EncodeToString(tx.Hash().Bytes()))

	// Chain ID for Sepolia testnet
	chainID := big.NewInt(req.ChainID)
	log.Printf("Sepolia Chain ID: %+v", chainID.String())

	// Creates a new transaction hash with the given chain ID
	txHash := types.NewEIP155Signer(chainID).Hash(tx)
	log.Printf("Transaction hash: %x", txHash)

	// Sign the transaction using KMS
	signInput := &kms.SignInput{
		KeyId:            aws.String(req.KeyID),
		Message:          txHash[:],
		SigningAlgorithm: SigningAlgorithmSpecEcdsaSha256,
	}
	signOutput, err := kmsClient.Sign(context.TODO(), signInput)
	if err != nil {
		log.Printf("Failed to sign transaction: %v", err)
		http.Error(w, "Failed to sign transaction", http.StatusInternalServerError)
		return
	}

	// Decode the DER-encoded signature
	var ecdsaSig ecdsaSignature
	_, err = asn1.Unmarshal(signOutput.Signature, &ecdsaSig)
	if err != nil {
		log.Printf("Failed to decode DER signature: %v", err)
		http.Error(w, "Failed to decode DER signature", http.StatusInternalServerError)
		return
	}

	// Enforce low S value to prevent malleability
	ecdsaSig.S = enforceLowS(ecdsaSig.S)

	// Ensure that the signature components r and s are 32 bytes each
	rBytes := ecdsaSig.R.Bytes()
	sBytes := ecdsaSig.S.Bytes()

	if len(rBytes) != 32 {
		rBytes = append(make([]byte, 32-len(rBytes)), rBytes...)
	}
	if len(sBytes) != 32 {
		sBytes = append(make([]byte, 32-len(sBytes)), sBytes...)
	}

	// Calculate the v value (EIP-155)
	v := uint8(chainID.Uint64()*2 + 35)

	// Create the signed transaction signature
	signature := append(rBytes, sBytes...)
	signature = append(signature, byte(v))

	signedTx, err := tx.WithSignature(types.NewEIP155Signer(chainID), signature)
	if err != nil {
		http.Error(w, "Failed to apply signature to transaction", http.StatusInternalServerError)
		return
	}

	// RLP-encode the signed transaction signature to return it
	// rawTxBytes, err := rlp.EncodeToBytes(signedTx)
	// if err != nil {
	// 	http.Error(w, "Failed to encode transaction", http.StatusInternalServerError)
	// 	return
	// }
	data, err := signedTx.MarshalBinary()
	if err != nil {
		http.Error(w, "Failed to encode transaction", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(fmt.Sprintf(`{"signedTransaction":"0x%s"}`, hexutil.Encode(data))))

	// // Return the signed transaction signature
	// w.Header().Set("Content-Type", "application/json")
	// w.Write([]byte(fmt.Sprintf(`{"signedTransaction":"0x%s"}`, hex.EncodeToString(rawTxBytes))))
}

// Health check handler
func healthCheck(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{"message": "hello world"}
	json.NewEncoder(w).Encode(response)
}
