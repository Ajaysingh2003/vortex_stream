package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	workspaceRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	config "github.com/ajaysingh2003/vortex-stream/internal/shared/config/redis"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserServiceInterface interface {

	Register (ctx context.Context, user *domain.User) (error)
	VerifyOTP (ctx context.Context, email string, otp string) (*domain.User, error)
	Login (ctx context.Context,email string,password string) (*domain.User,error)
	GetUser (ctx context.Context,id uuid.UUID) (*domain.User,error)
	FindOrCreateGoogleUser (ctx context.Context, email string, name string,picture string,googleSub string)(*domain.User,error)
	GetUserByEmail (ctx context.Context,email string) (*domain.User,error)
}

type userServiceRepo struct {
	
	userRepo repository.UserRepository
	jwtToken   *utils.JwtMaker
	workspaceRepo workspaceRepo.WorkshopRepository 
	db *gorm.DB
	accountRepo repository.AccountRepository
	
}

func NewUserService(userRepo repository.UserRepository,jwtToken *utils.JwtMaker,workspaceRepo workspaceRepo.WorkshopRepository,db *gorm.DB,accountRepo repository.AccountRepository)UserServiceInterface {
	return &userServiceRepo{userRepo:userRepo,jwtToken:jwtToken,workspaceRepo: workspaceRepo,db: db,accountRepo :accountRepo}
}

func (r *userServiceRepo) Register (ctx context.Context, user *domain.User) (error) {

    existing, _ := r.userRepo.GetByEmail(ctx, user.Email)
    if existing != nil {
        return utils.New(409, "Email already exists")
    }


    // hash password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
    if err != nil {
        return utils.New(500, err.Error())
    }

    if user.Role == "" {
        user.Role = "User"
    }

   
	dataKey:=fmt.Sprintf("otp_%s", user.Email)

	attemptKey:=fmt.Sprintf("otp_attempt_%s", user.Email)
	
	attempt, err := config.RedisClient.Get(ctx, attemptKey).Int()
    if err != nil {
        if errors.Is(err, redis.Nil) {
            attempt = 0 
        } else {
            fmt.Println("Real Redis Connection Error:", err)
            return &utils.ApiError{
                Code:    500,
                Message: "Internal cache lookup failure",
            }
        }
    }

    // Now your print statement will print 0 for new users instead of crashing
    fmt.Println(attempt, "lol")
	

	if attempt>5{
		return &utils.ApiError{
			Code: 429,
			Message: "Too many OTP attempts. Please try again later.",
		}
	}

	
	
	otp, err := utils.GenerateSecureOTP(6)
	if err != nil {
		fmt.Sprintf("OTP generation error:", err)
		return &utils.ApiError{
			Code: 500,
			Message: err.Error(),
		}
	}

	 userPayload := &dto.OTPRequest{
        ID:       uuid.New(),
		Name: *user.Name,
        Email:    user.Email,
        Password: string(hashedPassword),
        Role:     string(user.Role),
		OTP: otp,
    }

	jsonData, err := json.Marshal(userPayload)

	if err != nil {
		return err
	}

	err=config.RedisClient.SetEX(ctx, dataKey, jsonData,90*time.Minute).Err()

	if err != nil {
		// fmt.Sprintf("Redis set error:", err)	
		return &utils.ApiError{
			Code: 500,
			Message: err.Error(),
		}
	}

	err = utils.SendEmail(user.Email, userPayload.OTP)
	if err != nil {
		fmt.Sprintf("Email sending error:", err)
		return &utils.ApiError{
			Code: 500,
			Message: err.Error(),
		}
	}
	
	return  nil




}

func (r *userServiceRepo) Login (ctx context.Context,email string,password string) (*domain.User,error) {

	existing_user,err:=r.userRepo.GetByEmail(ctx,email)

	if (err!=nil ) {
		return nil,&utils.ApiError{
			Code: 404,
			Message: "User is not Found !",
		}
	}

	if existing_user == nil {
		return nil, &utils.ApiError{
			Code:    404,
			Message: "User not found",
		}
	}

	if (existing_user.IsActive==false) {
		return nil,&utils.ApiError{
			Code: 403,
			Message: "User is Not Active",
		}
	}
	if existing_user.Password == "" {
		account,err:=r.accountRepo.GetByUserID(ctx, existing_user.ID)
		if err != nil {
			return nil, utils.New(500, err.Error())
		}
		if account == nil {
			return nil, utils.New(404, "Account not found")
		}

		if account.Provider != "email" {
			errorMessage := "Please login using " + account.Provider + " Sign-In"
			return nil, &utils.ApiError{
				Code:    400,
				Message: string(errorMessage),
			}
		}

	}
	
	if bcrypt.CompareHashAndPassword([]byte(existing_user.Password), []byte(password)) != nil {
		return nil,&utils.ApiError{
			Code: 401,
			Message: "Invalid Credentials!",
		}
	}

	return existing_user,nil
}

func (r *userServiceRepo) GetUser (ctx context.Context ,id uuid.UUID) (*domain.User,error){

	userData,err:=r.userRepo.GetByID(ctx,id)

	if (err!=nil){
		return nil, err;

	}

	return userData,nil
}

func (r *userServiceRepo) FindOrCreateGoogleUser ( ctx context.Context, email string, name string,picture string,googleSub string) (*domain.User,error)  {
	
	existAccount,err:=r.accountRepo.FindByProviderAndID("google",googleSub)
	
	if err!=nil{
		return nil,utils.New(500,err.Error())
	}
	
	if existAccount != nil {


	existingUser, err := r.userRepo.GetByID(ctx,existAccount.UserID)

	if err!=nil{
		return nil,utils.New(409,err.Error())
	}

	
	
	return existingUser,nil

	}

	userByEmail, err := r.userRepo.GetByEmail(ctx ,email)

	if err != nil {
		return nil, utils.New(500, err.Error())
	}

	if userByEmail != nil {
		return nil, utils.New(409,"This email is already registered. Please login using email & password")
	}

	userPayload:=&domain.User{
		ID: uuid.New(),
		Name: &name,
		Avatar: &picture,
		Role: "User",
		Email: email,
		IsActive: true,
	}
	
	var userData *domain.User
	err=r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		data,err:=r.userRepo.CreateTx(ctx , tx, userPayload)

		if err != nil {
			return err
		}

		_,err=r.accountRepo.CreateTx(ctx, tx , &domain.Account{
			UserID: data.ID,
			ID: uuid.New(),
		Provider: "google",
		ProviderID: googleSub,
		CreatedAt: time.Now(),
		})

		if err != nil {
			return  err
		}

		 workspacePayload := &domain.Workspaces{
            ID:        uuid.New(),
            Name:      "My Workspace",
            UserID:    data.ID,
            IsDefault: true,
        }

		_,err=r.workspaceRepo.CreateTx(ctx ,tx,workspacePayload)

		if err != nil {
			return err
		}

		userData=data

		return nil

	})

	if err != nil {
		return nil, err
	}

	return  userData,nil
	
}

func (r userServiceRepo) GetUserByEmail (ctx context.Context,email string) (*domain.User,error){

	userData,err:=r.userRepo.GetByEmail(ctx, email)

	if (err!=nil){
		return nil, err;
	}

	return userData,nil

}

func (r *userServiceRepo) VerifyOTP (ctx context.Context, email string, otp string) (*domain.User, error) {

	existing_user,err:=r.userRepo.GetByEmail(ctx, email)

	if err != nil || existing_user !=nil {
		return nil, &utils.ApiError{
			Code: 400,
			Message: "User already exist !",
		}
	}

	dataKey:=fmt.Sprintf("otp_%s", email)


	// data:= config.RedisClient.Get(ctx, dataKey)
	

	cachedBytes, err := config.RedisClient.Get(ctx, dataKey).Bytes()
	
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, errors.New("verification token has expired or is invalid")
		}
		return nil, err
	}

	var mappedData dto.OTPRequest

	err = json.Unmarshal(cachedBytes, &mappedData)
	if err != nil {
		log.Printf("Failed to unmarshal data payload structure: %v", err)
		return nil, err
	}

	if otp!=mappedData.OTP{
		return  nil,&utils.ApiError{
			Code: 403,
			Message: "The verification code provided is invalid or has expired.",
		}
	}

	userPayload:=&domain.User{
		Email: mappedData.Email,
		Password: mappedData.Password,
		Role: domain.UserRole(mappedData.Role),
		ID: mappedData.ID,
		Name: &mappedData.Name,
	}
	
    var createdUser *domain.User

    err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

        // create user
        data, err := r.userRepo.CreateTx(ctx, tx, userPayload)
        if err != nil {
            return err
        }

        // create default workspace
        workspace := &domain.Workspaces{
            ID:        uuid.New(),
            Name:      "My Workspace",
            UserID:    data.ID,
            IsDefault: true,
        }

        _, err = r.workspaceRepo.CreateTx(ctx, tx, workspace)
        if err != nil {
            return err // auto rollback
        }

		accountPayload:=&domain.Account{
			ID: uuid.New(),
			UserID: data.ID,
			Provider: "email",
			ProviderID: data.Email,
		}

		_,err=r.accountRepo.CreateTx(ctx, tx, accountPayload)

		if err != nil {
			return err
		}

        createdUser = data
        return nil
    })

    if err != nil {
        log.Println("Create user error:", err.Error())
        return nil, utils.New(500, err.Error())
    }

    return createdUser, nil
}