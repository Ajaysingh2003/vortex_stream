package utils

import (
	// "bytes"
	"fmt"
	// "internal/coverage/rtcov"
	// "go/token"
	"time"

	// "github.com/goccy/go-yaml/token"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	// "github.com/vickydev03/algo-trading/services/user-service/internal/domain/entity"
	// "github.com/vickydev03/algo-trading/internal/domain/entity"
)
type JwtMaker struct {
	secretKey string
}
type Claims struct{
	Id    uuid.UUID  `json:"id"`
	Email string `json:"email"`
	SessionId string 
	Role  domain.UserRole  `json:"role"`
	Duration time.Duration
	jwt.RegisteredClaims
}

func NewJwtMaker(secretKey string) *JwtMaker {
	return &JwtMaker{secretKey}
}

func (h *JwtMaker) GenerateJwt(claims *Claims) (string,*Claims,error) {
	newClaims,err:=NewUserClaims(claims.Id,claims.Email,claims.Role,claims.Duration,claims.SessionId)
	if err!=nil {
		return "",nil,err
	}

	 token:=jwt.NewWithClaims(jwt.SigningMethodHS256,newClaims)
	 tokenStrr,err:=token.SignedString([]byte(h.secretKey))

	 if (err!=nil){
		return "",nil,err
	 }
	 return tokenStrr,newClaims,nil
}


func NewUserClaims(id uuid.UUID,email string ,role domain.UserRole,duration time.Duration,sessionId string) (*Claims,error){
	tokenId,err:=uuid.NewRandom()

	if (err!=nil){
		return nil,fmt.Errorf("error generating token")
	}

	return &Claims{
		Email: email,
		Role: role,
		Id: id,
		SessionId:sessionId,
		RegisteredClaims: jwt.RegisteredClaims{
			ID: tokenId.String(),
			Subject: email,
			IssuedAt: jwt.NewNumericDate(time.Now()),
			ExpiresAt:jwt.NewNumericDate(time.Now().Add(duration)) ,
		},
	},nil
}



func (h *JwtMaker) VerifyToken(tokenStrr string) (*Claims,error){

	token,err:=jwt.ParseWithClaims(tokenStrr,&Claims{},func (token *jwt.Token)(interface{},error)  {
		// verify the signInMethod
		_,ok:=token.Method.(*jwt.SigningMethodHMAC)

		if !ok{
			return nil,fmt.Errorf("invalid token signin method")
		}
		return []byte(h.secretKey),nil
	})
	
		// token.Claims()
		if err!=nil{
			return nil,fmt.Errorf("error while parsing the token")
		}
		claim,ok:= token.Claims.(*Claims)
		if !ok{
			return nil,fmt.Errorf("invalid token claims")
		}

		return claim,nil


}