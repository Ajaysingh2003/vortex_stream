package utils

import "os"


func ErrMsg(err error) interface{} {
    if os.Getenv("APP_ENV") == "production" {
        return "something went wrong"
    }
    return err.Error()
}
