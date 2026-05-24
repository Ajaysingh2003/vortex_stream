package utils

import (
	"crypto/rand"
	// "fmt"
	"math/big"
)

func GenerateSecureOTP(length int) (string, error) {
	// 1. Define our numeric base character set
	const digits = "0123456789"
	otp := make([]byte, length)

	for i := 0; i < length; i++ {
		// 2. Select a secure random index between [0, 10)
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		otp[i] = digits[num.Int64()]
	}

	return string(otp), nil
}