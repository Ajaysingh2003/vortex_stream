package db

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	// "github.com/ajaysingh2003/vortex-stream/pkg"
	"github.com/joho/godotenv"
	"gorm.io/gorm/schema"
)

var DB *gorm.DB

func InitDb() *gorm.DB {

	err := godotenv.Load()

	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	fmt.Printf(os.Getenv("DB_HOST"), 78)

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		// The deployed database contains legacy rows that do not satisfy every
		// newly inferred relationship (for example, orphaned lead forms). Do not
		// make application startup destructive or fail while AutoMigrate tries to
		// add those constraints. Existing database constraints are untouched.
		DisableForeignKeyConstraintWhenMigrating: true,
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "",   // no prefix (e.g., "tbl_")
			SingularTable: true, // 🔥 disables pluralization: user_models → user_model
		},
	})
	if err != nil {
		log.Fatal("Connection to DB failed:", err)
	}
	fmt.Print("starting the database")
	// pkg.ResetDatabase(db)

	// err = db.Exec(`
	//     DROP TABLE IF EXISTS video_domains CASCADE;
	//     DROP TABLE IF EXISTS video_resolutions CASCADE;
	//     DROP TABLE IF EXISTS videos CASCADE;
	//     DROP TABLE IF EXISTS workspaces CASCADE;
	//     DROP TABLE IF EXISTS users CASCADE;
	// `).Error

	fmt.Print("hii")

	err = db.AutoMigrate(
		&domain.Workspaces{},
		&domain.Folder{},
		&domain.User{},
		&domain.Video{},
		&domain.Channel{},
		&domain.ChannelVideo{},
		&domain.FavoriteVideo{},
		&domain.Account{},
		&domain.PlayerSettings{},
		&domain.VideoResolution{},
		&domain.VideoDomain{},
		&domain.Subscription{},
		&domain.UserUsageCounters{},
		&domain.LeadForm{},
		&domain.LeadFormField{},
		&domain.LeadFormFieldOption{},
		&domain.VideoEndScreen{},
		&domain.VideoSubtitle{},
		&domain.VideoChapters{},
		&domain.VideoCtaSetting{},
		
		&domain.UserStorageUsage{},
		&domain.UserUsageCounters{},
		&domain.BandwidthUsageEvent{},
	)

	if err != nil {
		log.Fatal("❌ Migration  failed: for db ", err)
	}

	DB = db
	fmt.Println("✅ Database connection established successfully!")

	return DB
}
