package utils

import (
	"github.com/ajaysingh2003/vortex-stream/internal/modules/folders/dto"
	"gorm.io/gorm"
)

// Helper to apply common dynamic filters safely across your models
func ApplyContentFilters(filter *dto.FilterOptions) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if filter == nil {
			return db
		}

		// 1. Visibility Filter (e.g., 'public', 'private')
		// if filter.Visibility != nil && *filter.Visibility != "" {
		//     db = db.Where("visibility = ?", *filter.Visibility)
		// }

		// 2. Date ranges filtering (e.g., 'today', '7days', '30days')
		if filter.Date != nil && *filter.Date != "" {
			switch *filter.Date {
			case "today":
				db = db.Where("created_at >= NOW() - INTERVAL '1 day'")
			case "7_day":
				db = db.Where("created_at >= NOW() - INTERVAL '7 days'")
			case "30_days":
				db = db.Where("created_at >= NOW() - INTERVAL '30 days'")
			case "this_month":
				db = db.Where("created_at >= DATE_TRUNC('month', CURRENT_DATE)")
			}
		}

		// 3. Dynamic Sorting
		if filter.Sort != nil && *filter.Sort != "" {
			switch *filter.Sort {
			case "name_asc":
				db = db.Order("name ASC, id ASC") // Folders typically use name, adjust for Video title column
			case "name_desc":
				db = db.Order("name DESC, id DESC")
			case "created_asc":
				db = db.Order("created_at ASC, id ASC")
			case "created_desc":
				db = db.Order("created_at DESC, id DESC") // Default fallback sequence
			default:
				db = db.Order("created_at ASC, id ASC")
			}
		} else {
			db = db.Order("created_at DESC, id DESC")
		}

		return db
	}
}
