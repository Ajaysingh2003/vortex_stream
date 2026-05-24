package dto

import "github.com/google/uuid"

// "os/user"
// "uuid"


type OTPRequest struct {
		ID       uuid.UUID
        Email    string
        Password string
        Role     string
		OTP      string
        // IsActive: true,
}