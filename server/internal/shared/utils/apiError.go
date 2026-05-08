package utils

import "fmt"

type ApiError struct {
	Code    int
	Message string
}

func (e *ApiError) Error() string {
	return fmt.Sprintf(e.Message)
}


func New(code int ,message string) *ApiError{
	return &ApiError{Code: code,Message: message}
}




var (
	ErrEmailExists  = New(409, "Email already registered,Plz Login!")
	ErrOtpNotFound  = New(404, "OTP not found or expired")
	ErrOtpMismatch  = New(401, "Incorrect OTP")
	ErrServerError  = New(500, "Something went wrong")
	ErrSessionNotFound = New(404, "Session not found") 
	ErrSessionAlreadyExists = New(409, "Session already exists")
	ErrRefreshTokenFailed = New(409, "Failed to Create Refresh Token")
	ErrSessionFailed = New(409, "Failed to Create Session")



	ErrUserNotExist = New(409, "User does not exist!")
	ErrAccountBlocked = New(403, "Account is blocked!")
	ErrAccountDeactivated=New(409,"Your Account is Deactivated.")
	ErrInvalidCredentials=New(401,"Invalid Credentials!")
	ErrAccountLocked=New(403,"Account is locked due to multiple failed login attempts. Please try again later.")
	ErrSecurityNotFound   = New(403,"security profile not found")
	ErrUnauthorized = New(401,"Unauthorized Access")
	ErrTokenExpired=New(401,"The Token has Expired.")
	ErrTokenRevoked=New(401,"The Token has Revoked.")
	ErrSessionVerifyFailed=New(402,"Session Verification Failed.")
	ErrNoSessionFound=New(401,"No session found for following user.")
)
