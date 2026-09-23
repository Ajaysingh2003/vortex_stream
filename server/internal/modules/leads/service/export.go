package service

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const MaxExportRows = 50000

func SafeCSV(value string) string {
	trimmed := strings.TrimLeft(value, " \t\r\n")
	if len(trimmed) > 0 && strings.ContainsRune("=+-@", rune(trimmed[0])) {
		return "'" + value
	}
	return value
}
func (s *Service) ExportCount(ctx context.Context, videoID uuid.UUID, f Filter) (int64, error) {
	var count int64
	err := filtered(s.DB.WithContext(ctx), videoID, f).Count(&count).Error
	if count > MaxExportRows {
		return count, bad(422, "Exports are limited to 50,000 responses. Narrow the date range or filters.")
	}
	return count, err
}
func (s *Service) WriteCSV(ctx context.Context, writer io.Writer, videoID uuid.UUID, f Filter, fields []Field) error {
	csvWriter := csv.NewWriter(writer)
	headers := []string{"Submission ID", "Submitted at (UTC)", "Status", "Form version", "Placement"}
	for _, field := range fields {
		headers = append(headers, SafeCSV(fieldHeader(field)))
	}
	headers = append(headers, "Original answer snapshots (JSON)")
	if err := csvWriter.Write(headers); err != nil {
		return err
	}
	var lastTime *time.Time
	var lastID uuid.UUID
	for {
		query := filtered(s.DB.WithContext(ctx), videoID, f).Order("created_at DESC,id DESC").Limit(250).Preload("Answers", func(db *gorm.DB) *gorm.DB { return db.Order("position ASC,id ASC") })
		if lastTime != nil {
			query = query.Where("(created_at,id) < (?,?)", *lastTime, lastID)
		}
		items := []domain.LeadFormSubmission{}
		if err := query.Find(&items).Error; err != nil {
			return err
		}
		if len(items) == 0 {
			break
		}
		normalizeAnswers(items)
		for _, item := range items {
			status := "Completed"
			if item.Skipped {
				status = "Skipped"
			}
			row := []string{item.ID.String(), item.CreatedAt.UTC().Format(time.RFC3339Nano), status, strconv.Itoa(item.FormVersion), item.Placement}
			answers := map[uuid.UUID]string{}
			for _, answer := range item.Answers {
				answers[answer.FieldID] = answer.Value
			}
			for _, field := range fields {
				row = append(row, SafeCSV(answers[field.ID]))
			}
			snapshots, _ := json.Marshal(item.Answers)
			row = append(row, string(snapshots))
			if err := csvWriter.Write(row); err != nil {
				return err
			}
		}
		csvWriter.Flush()
		if err := csvWriter.Error(); err != nil {
			return err
		}
		last := items[len(items)-1]
		lastTime = &last.CreatedAt
		lastID = last.ID
	}
	csvWriter.Flush()
	return csvWriter.Error()
}
