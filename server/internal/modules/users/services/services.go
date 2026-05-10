package services

import (
	"context"
	// "errors"
	"log"
	workspaceRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	// "gorm.io/gorm"
)

type UserServiceInterface interface {
	Create(ctx context.Context, user *domain.User) (*domain.User, error)
	Login(ctx context.Context,email string,password string) (*domain.User,error)
	GetUser(ctx context.Context,id uuid.UUID) (*domain.User,error)
}

type userServiceRepo struct {
	userRepo repository.UserRepository
	jwtToken   *utils.JwtMaker
	workspaceRepo workspaceRepo.WorkshopRepository 
	db *gorm.DB
}


func NewUserService(userRepo repository.UserRepository,jwtToken *utils.JwtMaker,workspaceRepo workspaceRepo.WorkshopRepository,db *gorm.DB)UserServiceInterface {
	return &userServiceRepo{userRepo:userRepo,jwtToken:jwtToken,workspaceRepo: workspaceRepo,db: db}
}

func (r *userServiceRepo) Create(ctx context.Context, user *domain.User) (*domain.User, error) {

    existing, _ := r.userRepo.GetByEmail(ctx, user.Email)
    if existing != nil {
        return nil, utils.New(409, "Email already exists")
    }

    // hash password
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
    if err != nil {
        return nil, utils.New(500, err.Error())
    }

    if user.Role == "" {
        user.Role = "User"
    }

    userPayload := &domain.User{
        Email:    user.Email,
        Password: string(hashedPassword),
        Role:     user.Role,
        ID:       uuid.New(),
        IsActive: true,
    }

    var createdUser *domain.User

    err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

        // create user
        data, err := r.userRepo.CreateTx(ctx, tx, userPayload)
        if err != nil {
            return err // auto rollback
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

        createdUser = data
        return nil // auto commit
    })

    if err != nil {
        log.Println("Create user error:", err.Error())
        return nil, utils.New(500, err.Error())
    }

    return createdUser, nil
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
