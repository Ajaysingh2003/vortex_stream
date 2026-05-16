package utils

import (
	"context"
	"fmt"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
)

type ParentFetcher func(ctx context.Context, id uuid.UUID) (*domain.Folder, error)

func IsDescendant(ctx context.Context, folderToMoveID uuid.UUID, targetParentID uuid.UUID, fetcher ParentFetcher) (bool, error) {
    currentID := targetParentID
    maxDepth := 50 

    for i := 0; i < maxDepth; i++ {

		// if match end the loop

        if currentID == folderToMoveID {
            return true, nil
        }

		// now fetch the current folder 

        parent, err := fetcher(ctx, currentID)
        if err != nil {
            return false, err
        }
        
		// if parent is nothing or parent id is nil means we are at root just return
        if parent == nil || parent.ParentID == nil {
            return false, nil
        }

		// now change the current id
        currentID = *parent.ParentID

    }

    return false, fmt.Errorf("max folder depth exceeded")
}

