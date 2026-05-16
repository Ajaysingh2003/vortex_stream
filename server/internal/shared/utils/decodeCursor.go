package utils

import (
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/google/uuid"
)



func DecodeCursor(cursor string)  (itemType string,id *uuid.UUID,err error) {

	decoded,err:=base64.StdEncoding.DecodeString(cursor)

	if err != nil {
		return "", nil, err
	}

	parts :=strings.SplitN(string(decoded),":",2)

	if len(parts) !=2 {
		 return "", nil, fmt.Errorf("invalid cursor format")
	}

	parsedID, err := uuid.Parse(parts[1])
    if err != nil {
        return "", nil, err
    }

	 return parts[0], &parsedID, nil

}


func EncodeCursor(itemType string, id uuid.UUID) string {
	rawCursor := fmt.Sprintf("%s:%s", itemType, id.String())
	
	encoded := base64.StdEncoding.EncodeToString([]byte(rawCursor))

	return encoded
}
