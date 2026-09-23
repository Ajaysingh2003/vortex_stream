package services

import (
	"context"
	"encoding/json"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/analyticsauth"
	"math"
	"net/url"
	"strings"
	"time"

	model "github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	events "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
)

var viewerEvents = map[string]bool{}

func init() {
	for _, name := range strings.Fields("player_loaded play_started play_resumed play_paused playback_heartbeat video_progress video_25_percent video_50_percent video_75_percent video_90_percent video_completed video_replayed video_abandoned seek_forward seek_backward quality_changed playback_speed_changed mute_enabled mute_disabled fullscreen_entered fullscreen_exited pip_entered pip_exited captions_enabled captions_disabled chapter_clicked thumbnail_clicked video_load_started video_load_completed first_frame_rendered buffer_started buffer_ended video_error quality_switch_failed cdn_error cta_displayed cta_clicked cta_dismissed lead_form_opened lead_form_started lead_form_submitted lead_form_skipped lead_form_failed end_screen_displayed end_screen_clicked share_clicked download_clicked") {
		viewerEvents[name] = true
	}
}
func sanitizeURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		return ""
	}
	u.User = nil
	u.RawQuery = ""
	u.Fragment = ""
	return u.Scheme + "://" + u.Host /* host-only attribution avoids personal data embedded in paths */
}
func ValidateViewerEvent(e *events.Event, now time.Time) error {
	bad := func() error { return &utils.ApiError{Code: 400, Message: "Invalid player event or identity"} }
	if !viewerEvents[e.EventName] || e.EventID == uuid.Nil || e.VideoID == nil || *e.VideoID == uuid.Nil || e.EventVersion != 1 {
		return bad()
	}
	for _, id := range []string{e.AnonymousID, e.SessionID, e.PlaybackSessionID} {
		if parsed, err := uuid.Parse(id); err != nil || parsed == uuid.Nil {
			return bad()
		}
	}
	if e.OccurredAt.IsZero() || e.OccurredAt.Before(now.Add(-24*time.Hour)) || e.OccurredAt.After(now.Add(5*time.Minute)) {
		return bad()
	}
	if (e.PositionMS != nil && (*e.PositionMS < 0 || *e.PositionMS > 7*24*3600000)) || (e.DurationMS != nil && (*e.DurationMS < 0 || *e.DurationMS > 7*24*3600000)) {
		return bad()
	}
	for _, v := range []string{e.PageURL, e.Referrer} {
		if len(v) > 4096 {
			return bad()
		}
	}
	for _, v := range []string{e.UTMSource, e.UTMMedium, e.UTMCampaign, e.DeviceType, e.Browser, e.OS} {
		if len(v) > 200 {
			return bad()
		}
	}
	var properties map[string]interface{}
	if len(e.Properties) > 4096 || json.Unmarshal(e.Properties, &properties) != nil || properties == nil {
		return bad()
	}
	clean := map[string]interface{}{}
	for _, key := range []string{"watch_ms", "buffer_ms", "startup_ms", "rate", "width", "height", "from_ms"} {
		if v, ok := properties[key]; ok {
			n, ok := v.(float64)
			if !ok || n < 0 || n > 86400000 || (key != "rate" && math.Trunc(n) != n) {
				return bad()
			}
			if key == "watch_ms" && (n > 15000 || e.EventName != "playback_heartbeat") {
				return bad()
			}
			clean[key] = n
		}
	}
	if v, ok := properties["active"].(bool); ok {
		clean["active"] = v
	}
	for _, key := range []string{"cta_id", "chapter_id", "form_id", "submission_id", "surface", "language", "error_code", "quality", "action"} {
		if v, ok := properties[key].(string); ok && len(v) <= 100 {
			clean[key] = v
		}
	}
	e.Properties, _ = json.Marshal(clean)
	e.UserID = nil
	e.PageURL = sanitizeURL(e.PageURL)
	e.Referrer = sanitizeURL(e.Referrer)
	return nil
}
func (s *AnalyticsService) PrepareViewerBatch(ctx context.Context, batch []events.Event) error {
	ids := []uuid.UUID{}
	seen := map[uuid.UUID]bool{}
	for i := range batch {
		if err := ValidateViewerEvent(&batch[i], time.Now().UTC()); err != nil {
			return err
		}
		id := *batch[i].VideoID
		if !seen[id] {
			ids = append(ids, id)
			seen[id] = true
		}
	}
	if s.DB == nil {
		return &utils.ApiError{Code: 503, Message: "Analytics unavailable"}
	}
	var videos []model.Video
	if err := s.DB.WithContext(ctx).Where("id IN ? AND status = ?", ids, model.StatusReady).Find(&videos).Error; err != nil {
		return err
	}
	if len(videos) != len(ids) {
		return &utils.ApiError{Code: 404, Message: "Playable video not found"}
	}
	owners := map[uuid.UUID]uuid.UUID{}
	for _, v := range videos {
		owners[v.ID] = v.WorkspaceID
	}
	for i := range batch {
		owner := owners[*batch[i].VideoID]
		if err := analyticsauth.Verify(batch[i].PlaybackToken, *batch[i].VideoID, owner); err != nil {
			return &utils.ApiError{Code: 403, Message: "Reload the player to renew analytics authorization"}
		}
		batch[i].PlaybackToken = ""
		batch[i].WorkspaceID = &owner
	}
	return nil
}
