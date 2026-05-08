package pkg

import (
	"fmt"
	"log"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"gorm.io/gorm"
)


func ResetDatabase(db *gorm.DB) {
    err := db.Migrator().DropTable(
        &domain.VideoDomain{},
        &domain.VideoResolution{},
        &domain.Video{},
        &domain.Workspaces{},
        &domain.User{},
    )

    if err != nil {
        log.Fatalf("Could not drop tables: %v", err)
		return
    }
    
    fmt.Println("Database wiped clean.")
}