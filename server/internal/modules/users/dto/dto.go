package dto

import "github.com/google/uuid"

type OTPRequest struct {
		ID       uuid.UUID
        Email    string
        Name string
        Password string
        Role     string
		OTP      string
}