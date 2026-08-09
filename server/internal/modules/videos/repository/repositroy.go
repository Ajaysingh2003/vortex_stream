package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	folderdto "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/videos/dto"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type VideoRepository interface {
	Create(ctx context.Context, video *domain.Video) (*domain.Video, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Video, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]domain.Video, error)
	Update(ctx context.Context, video *domain.Video) error
	GetByIdAndUserId(ctx context.Context, Id uuid.UUID, userId uuid.UUID) (*domain.Video, error)
	AddResolution(ctx context.Context, res *domain.VideoResolution) error
	AddAllowedDomain(ctx context.Context, dom *domain.VideoDomain) error
	Delete(ctx context.Context, id uuid.UUID) error

	GetVideosPaginated(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID, cursorID **uuid.UUID, limit int, filterOptions *dto.FilterOptions) ([]domain.Video, error)

	GetByFolderIdPaginated(ctx context.Context, folderID *uuid.UUID, workspaceID uuid.UUID, afterID string, remaining int, filterOptions *folderdto.FilterOptions) ([]domain.Video, error)

	GetEndScreenByVideoID(ctx context.Context, videoID uuid.UUID) (*domain.VideoEndScreen, error)

	DeleteSubtitle(ctx context.Context, id uuid.UUID) error
	CountByFolderID(ctx context.Context, folderID *uuid.UUID) (int64, error)
	DeleteEndScreen(ctx context.Context, videoId uuid.UUID) error
	DeleteVideoChapter(ctx context.Context, id uuid.UUID) error
	UpsertVideoEndScreen(ctx context.Context, endScreen *domain.VideoEndScreen) error

	// subtitle

	GetSubtitleByVideoID(ctx context.Context, VideoID uuid.UUID) ([]domain.VideoSubtitle, error)
	GetChaptersVideoID(ctx context.Context, VideoID uuid.UUID) ([]domain.VideoChapters, error)

	UpsertSubtitles(ctx context.Context, videoID uuid.UUID, items []dto.SubtitleItemInput) error
	UpsertVideosChapter(ctx context.Context, videoID uuid.UUID, items []dto.VideoChapterInput) error

	UpsertVideosCta(ctx context.Context, videoID uuid.UUID, items []dto.VideoCtaInput) error
	DeleteVideoCta(ctx context.Context, id uuid.UUID) error
	GetVideoCta(cta context.Context, videoID uuid.UUID) ([]domain.VideoCtaSetting, error)
}

type postgresVideoRepository struct {
	db *gorm.DB
}

func NewPostgresVideoRepository(db *gorm.DB) VideoRepository {
	return &postgresVideoRepository{db: db}
}

func (r *postgresVideoRepository) Create(ctx context.Context, video *domain.Video) (*domain.Video, error) {
	result := r.db.WithContext(ctx).Create(video)

	if result.Error != nil {
		return nil, result.Error
	}

	return video, nil
}

func (r *postgresVideoRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Video, error) {
	var video domain.Video

	err := r.db.WithContext(ctx).
		Preload("Resolutions").
		Preload("AllowedDomains").
		First(&video, "id = ?", id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &video, nil
}

func (r *postgresVideoRepository) GetEndScreenByVideoID(ctx context.Context, videoID uuid.UUID) (*domain.VideoEndScreen, error) {
	var videoEndScreen domain.VideoEndScreen

	err := r.db.WithContext(ctx).
		First(&videoEndScreen, "video_id = ?", videoID).
		Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &videoEndScreen, nil
}

func (r *postgresVideoRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]domain.Video, error) {
	var videos []domain.Video
	err := r.db.Preload("Workspaces").WithContext(ctx).
		Where("workspaces.userId = ?", userID).
		Order("created_at DESC").
		Find(&videos).Error
	return videos, err
}

func (r *postgresVideoRepository) Update(ctx context.Context, video *domain.Video) error {
	// 1. Initialize map with universal fields that should always change on update
	updateData := map[string]interface{}{
		"updated_at": time.Now(),
	}

	// 2. Only add fields to the map if they have non-zero values
	if video.Status != "" {
		updateData["status"] = video.Status
	}
	if video.Title != "" {
		updateData["title"] = video.Title
	}
	if video.Thumbnail != "" {
		updateData["thumbnail"] = video.Thumbnail
	}

	// 3. For foreign keys/pointers, handle nil vs zero values explicitly
	// If it's a pointer to a UUID, this checks if it's explicitly set
	if video.FolderID != nil {
		updateData["folder_id"] = video.FolderID
	}

	// 4. If nothing changed besides updated_at, skip hitting the DB entirely
	if len(updateData) <= 1 {
		return nil
	}

	// 5. Fire the update query safely
	return r.db.WithContext(ctx).
		Model(&domain.Video{}).
		Where("id = ? AND workspace_id = ?", video.ID, video.WorkspaceID).
		Updates(updateData).Error
}

func (r *postgresVideoRepository) AddResolution(ctx context.Context, res *domain.VideoResolution) error {
	return r.db.WithContext(ctx).Create(res).Error
}

func (r *postgresVideoRepository) AddAllowedDomain(ctx context.Context, dom *domain.VideoDomain) error {
	return r.db.WithContext(ctx).Create(dom).Error
}

func (r *postgresVideoRepository) Delete(ctx context.Context, id uuid.UUID) error {
	// This will trigger the CASCADE delete in DB for Resolutions and Domains
	return r.db.WithContext(ctx).Delete(&domain.Video{}, "id = ?", id).Error
}

func (r *postgresVideoRepository) DeleteSubtitle(ctx context.Context, id uuid.UUID) error {

	return r.db.WithContext(ctx).Delete(&domain.VideoSubtitle{}, "id = ?", id).Error
}

func (r *postgresVideoRepository) DeleteEndScreen(ctx context.Context, videoId uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.VideoEndScreen{}, "video_id = ?", videoId).Error
}

func (r *postgresVideoRepository) DeleteVideoCta(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.VideoCtaSetting{}, "id = ?", id).Error
}

func (r *postgresVideoRepository) DeleteVideoChapter(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.VideoChapters{}, "id = ?", id).Error
}

// func (r *postgresVideoRepository) GetByIdAndUserId (ctx context.Context,id uuid.UUID,userId uuid.UUID) (*domain.Video,error) {
// 	var video domain.Video

// 	err:=r.db.WithContext(ctx).Preload("Workspaces").Where("id = ? AND workspaces.user_id = ?",id,userId).First(&video).Error

// 	if err!=nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return nil, nil
// 		}
// 		return  nil,err
// 	}

// 	return  &video,nil

// }

func (r *postgresVideoRepository) GetByIdAndUserId(ctx context.Context, id uuid.UUID, userId uuid.UUID) (*domain.Video, error) {
	var video domain.Video

	err := r.db.WithContext(ctx).
		Model(&domain.Video{}).
		Joins("Workspace").
		Where("video.id = ? AND \"Workspace\".user_id = ?", id, userId).
		First(&video).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &video, nil
}

// func (r *postgresVideoRepository) GetByFolderIdPaginated (ctx context.Context,folderID *uuid.UUID,afterID *uuid.UUID,remaining int) ([]domain.Video,error) {

// 	query:=r.db.WithContext(ctx).Where("folder_id = ?",folderID).Order("created_at ASC , id ASC").Limit(remaining)

// 	if afterID !=nil{

// 		var cursorVideo domain.Video

// 		err:=r.db.WithContext(ctx).Select("created_at","id").First(&cursorVideo,"id = ?",*afterID).Error

// 		if err != nil {
// 			return nil, err
// 		}

// 		query=query.Where("(created_at , id::text) > (? , ?)",cursorVideo.CreatedAt,cursorVideo.ID)

// 	}

// 	var videos []domain.Video

// 	if err:=query.Find(&videos).Error ; err!=nil{
// 		return nil,err
// 	}

// 	return videos,nil
// }

func (r *postgresVideoRepository) GetByFolderIdPaginated(ctx context.Context, folderID *uuid.UUID, workspaceID uuid.UUID, afterID string, remaining int, filterOptions *folderdto.FilterOptions) ([]domain.Video, error) {

	query := r.db.WithContext(ctx).Model(&domain.Video{}).Where("workspace_id", workspaceID)

	if folderID != nil {
		query = query.Where("folder_id = ?", folderID)
	} else {
		query = query.Where("folder_id IS NULL")
	}

	query = query.Limit(remaining)

	if afterID != "" {
		var cursorVideo domain.Video

		err := r.db.WithContext(ctx).
			Select("created_at", "title", "size", "id").
			First(&cursorVideo, "id = ?", afterID).Error
		if err != nil {
			return nil, fmt.Errorf("failed to locate pagination cursor anchor element: %w", err)
		}

		sort := "created_asc"
		if filterOptions != nil && filterOptions.Sort != nil {
			sort = *filterOptions.Sort
		}
		switch sort {
		case "created_desc":
			query = query.Where("(created_at, id) < (?, ?)", cursorVideo.CreatedAt, cursorVideo.ID)
		case "name_asc":
			query = query.Where("(title, id) > (?, ?)", cursorVideo.Title, cursorVideo.ID)
		case "name_desc":
			query = query.Where("(title, id) < (?, ?)", cursorVideo.Title, cursorVideo.ID)
		case "size_desc":
			query = query.Where("(size, id) < (?, ?)", cursorVideo.Size, cursorVideo.ID)
		default:
			query = query.Where("(created_at, id) > (?, ?)", cursorVideo.CreatedAt, cursorVideo.ID)
		}
	}

	if filterOptions != nil {
		if filterOptions.Date != nil {
			switch *filterOptions.Date {
			case "today":
				query = query.Where("created_at >= CURRENT_DATE")
			case "7_day":
				query = query.Where("created_at >= NOW() - INTERVAL '7 days'")
			case "30_days":
				query = query.Where("created_at >= NOW() - INTERVAL '30 days'")
			case "this_month":
				query = query.Where("created_at >= DATE_TRUNC('month', CURRENT_DATE)")
			}
		}
		if filterOptions.Visibility != nil {
			switch *filterOptions.Visibility {
			case "private":
				query = query.Where("is_private = ?", true)
			case "public":
				query = query.Where("is_private = ?", false)
			}
		}
	}

	if filterOptions != nil && filterOptions.Sort != nil {
		switch *filterOptions.Sort {
		case "created_desc":
			query = query.Order("created_at DESC, id DESC")
		case "name_asc":
			query = query.Order("title ASC, id ASC")
		case "name_desc":
			query = query.Order("title DESC, id DESC")
		case "size_desc":
			query = query.Order("size DESC, id DESC")
		default:
			query = query.Order("created_at ASC, id ASC")
		}
	}

	// 4. Execute the database retrieval using our pointer reference
	var videos []domain.Video
	if err := query.Find(&videos).Error; err != nil {
		return nil, fmt.Errorf("error querying paginated videos table map: %w", err)
	}

	return videos, nil
}

func (r *postgresVideoRepository) CountByFolderID(ctx context.Context, folderID *uuid.UUID) (int64, error) {
	var count int64

	query := r.db.WithContext(ctx).Model(&domain.Video{})

	if folderID == nil {
		query = query.Where("folder_id IS NULL")
	} else {
		query = query.Where("folder_id = ?", folderID)
	}

	// 3. Execute the database payload calculation
	err := query.Count(&count).Error
	if err != nil {
		return 0, err
	}

	return count, nil
}
func (r *postgresVideoRepository) GetVideosPaginated(
	ctx context.Context,
	workspaceID uuid.UUID,
	userID uuid.UUID,
	cursorID **uuid.UUID,
	limit int,
	filterOptions *dto.FilterOptions,
) ([]domain.Video, error) {
	var videos []domain.Video

	if limit <= 0 {
		limit = 10
	}

	query := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID)

	// Apply Filter Options
	if filterOptions != nil {
		// 1. Visibility Filter (e.g., "public", "private", "unlisted")
		if filterOptions.Visibility != nil && *filterOptions.Visibility != "" {

			switch *filterOptions.Visibility {
			case "public":
				query = query.Where("is_private = ?", false)
			case "private":
				query = query.Where("is_private = ?", true)
			case "all":

			default:

			}

		}

		// 2. Date Filter
		if filterOptions.Date != nil && *filterOptions.Date != "" {
	switch *filterOptions.Date {
	case "today":
		query = query.Where("created_at >= NOW() - INTERVAL '24 hours'")

	case "this_week":
		query = query.Where("created_at >= NOW() - INTERVAL '7 days'")

	case "30_days":
		query = query.Where("created_at >= NOW() - INTERVAL '30 days'")

	case "this_month":
		// Truncates created_at check to the start of the current calendar month
		query = query.Where("created_at >= date_trunc('month', CURRENT_DATE)")

	case "any":
		// "Anytime" selected — do not add any date filter to the query

	default:
		// Fallback for specific ISO date string (e.g. YYYY-MM-DD from a datepicker)
		if parsedDate, err := time.Parse("2006-01-02", *filterOptions.Date); err == nil {
			query = query.Where("created_at >= ? AND created_at < ?", parsedDate, parsedDate.AddDate(0, 0, 1))
		}
	}
}

		// 3. Dynamic Sorting
		if filterOptions.Sort != nil && *filterOptions.Sort != "" {
			switch *filterOptions.Sort {
			case "asc", "oldest":
				query = query.Order("created_at ASC, id ASC")
			case "name_asc":
				query = query.Order("title ASC, id ASC")
			case "name_desc":
				query = query.Order("title DESC, id DESC")
			default:
				query = query.Order("created_at DESC, id DESC")
			}
		} else {
			query = query.Order("created_at DESC, id DESC")
		}
	} else {
		// Default sort order when filterOptions is nil
		query = query.Order("created_at DESC, id DESC")
	}

	// Apply Cursor Condition for ID-based pagination
	if cursorID != nil {
		// If sorted oldest first (ASC), fetch IDs greater than cursor
		if filterOptions != nil && filterOptions.Sort != nil && (*filterOptions.Sort == "asc" || *filterOptions.Sort == "oldest") {
			query = query.Where("id > ?", *cursorID)
		} else {
			// Default descending (DESC) pagination
			query = query.Where("id < ?", *cursorID)
		}
	}

	query = query.Limit(limit)

	if err := query.Find(&videos).Error; err != nil {
		return nil, err
	}

	return videos, nil
}

func (r *postgresVideoRepository) UpsertVideoEndScreen(ctx context.Context, endScreenData *domain.VideoEndScreen) error {
	err := r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "video_id"}},

			DoUpdates: clause.AssignmentColumns([]string{
				"id",
				"video_id",
				"type",
				"payload",
				"updated_at",
			}),
		}).
		Create(endScreenData).Error

	if err != nil {
		return err
	}

	return nil
}

func (r *postgresVideoRepository) UpsertSubtitles(ctx context.Context, videoID uuid.UUID, items []dto.SubtitleItemInput) error {

	subtitlesToUpsert := make([]domain.VideoSubtitle, len(items))

	if len(items) == 0 {
		return nil
	}

	for i, item := range items {
		subtitlesToUpsert[i] = domain.VideoSubtitle{
			VideoID:     videoID,
			FileName:    item.FileName,
			Code:        item.Code,
			Label:       item.Label,
			SubtitleUrl: item.SubtitleUrl,
		}
	}

	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "video_id"},
			{Name: "code"},
		},
		DoUpdates: clause.AssignmentColumns([]string{
			"file_name", "label", "subtitle_url", "updated_at",
		}),
	}).Create(&subtitlesToUpsert).Error
}

func (r *postgresVideoRepository) UpsertVideosChapter(ctx context.Context, videoID uuid.UUID, items []dto.VideoChapterInput) error {

	chaptersToUpsert := make([]domain.VideoChapters, len(items))

	if len(items) == 0 {
		return nil
	}

	for i, item := range items {
		chaptersToUpsert[i] = domain.VideoChapters{
			VideoID: videoID,
			Time:    item.Time,
			ID:      uuid.New(),
			Label:   item.Label,
		}
	}

	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "video_id"},
			{Name: "time"},
		},
		DoUpdates: clause.AssignmentColumns([]string{
			"label", "updated_at",
		}),
	}).Create(&chaptersToUpsert).Error
}

func (r *postgresVideoRepository) UpsertVideosCta(ctx context.Context, videoID uuid.UUID, items []dto.VideoCtaInput) error {
	if len(items) == 0 {
		return nil
	}

	ctaInput := make([]domain.VideoCtaSetting, len(items))

	for i, item := range items {
		ctaInput[i] = domain.VideoCtaSetting{
			ID:              uuid.New(),
			VideoID:         videoID,
			Title:           item.Title,
			URL:             item.Url,
			FontColor:       item.FontColor,
			BackgroundColor: item.BackgroundColor,
			OpenIn:          item.OpenIn,
			Position:        item.Position,
			StartTime:       item.StartTime,
			EndTime:         item.EndTime,
		}
	}

	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		// Targets the composite index fields
		Columns: []clause.Column{
			{Name: "video_id"},
			{Name: "start_time"},
		},
		// Updates properties if a CTA at that specific start time already exists
		DoUpdates: clause.AssignmentColumns([]string{
			"title",
			"url",
			"font_color",
			"background_color",
			"open_in",
			"position",
			"end_time",
			"updated_at",
		}),
	}).Create(&ctaInput).Error
}

func (r *postgresVideoRepository) GetSubtitleByVideoID(ctx context.Context, videoID uuid.UUID) ([]domain.VideoSubtitle, error) {
	var subtitles []domain.VideoSubtitle

	err := r.db.WithContext(ctx).
		Where("video_id = ?", videoID).
		Order("created_at asc").
		Find(&subtitles).Error

	if err != nil {
		return nil, err
	}

	return subtitles, nil
}

func (r *postgresVideoRepository) GetChaptersVideoID(ctx context.Context, videoID uuid.UUID) ([]domain.VideoChapters, error) {
	var chapters []domain.VideoChapters

	err := r.db.WithContext(ctx).
		Where("video_id = ?", videoID).
		Order("created_at asc").
		Find(&chapters).Error

	if err != nil {
		return nil, err
	}

	return chapters, nil
}

func (r *postgresVideoRepository) GetVideoCta(ctx context.Context, videoID uuid.UUID) ([]domain.VideoCtaSetting, error) {
	var cta []domain.VideoCtaSetting

	err := r.db.WithContext(ctx).
		Where("video_id = ?", videoID).
		Order("created_at asc").
		Find(&cta).Error

	if err != nil {
		return nil, err
	}

	return cta, nil
}
