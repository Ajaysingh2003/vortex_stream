FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git


RUN go install github.com/air-verse/air@latest

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download


COPY . .

CMD ["air", "-c", "infra/.air.worker.toml"]