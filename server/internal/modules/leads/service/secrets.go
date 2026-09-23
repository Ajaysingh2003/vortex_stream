package service

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"os"
)

type SecretBox struct{ aead cipher.AEAD }

func NewSecretBox() *SecretBox { box, _ := secretBox(os.Getenv("LEAD_INTEGRATION_KEY")); return box }
func secretBox(encoded string) (*SecretBox, error) {
	key, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil || len(key) != 32 {
		return &SecretBox{}, errors.New("LEAD_INTEGRATION_KEY must be a base64-encoded 32-byte key")
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	return &SecretBox{aead: aead}, err
}
func (b *SecretBox) Ready() bool { return b != nil && b.aead != nil }
func (b *SecretBox) Seal(value string) (string, error) {
	if !b.Ready() {
		return "", bad(503, "CRM connections need the server encryption key configured first.")
	}
	nonce := make([]byte, b.aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(b.aead.Seal(nonce, nonce, []byte(value), []byte("lead-integration:v1"))), nil
}
func (b *SecretBox) Open(encoded string) (string, error) {
	if !b.Ready() {
		return "", errors.New("Integration encryption key unavailable")
	}
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil || len(data) < b.aead.NonceSize() {
		return "", errors.New("Invalid encrypted integration secret")
	}
	plain, err := b.aead.Open(nil, data[:b.aead.NonceSize()], data[b.aead.NonceSize():], []byte("lead-integration:v1"))
	if err != nil {
		return "", errors.New("Unable to decrypt integration secret; check the server key")
	}
	return string(plain), nil
}
