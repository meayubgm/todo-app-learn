.DEFAULT_GOAL := help
.PHONY: help up down clean build test lint migrate generate studio logs sh

## help: ターゲット一覧を表示
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //'

## up: 開発環境を起動（http://localhost:3000）
up:
	docker compose up

## down: 開発環境を停止・削除（DBデータは残す）
down:
	docker compose down

## clean: 開発環境を停止し、DBボリュームごと完全削除（リセット）
clean:
	docker compose down -v

## build: Dockerイメージをビルド
build:
	docker compose build

## test: テストを実行（Vitest）
test:
	docker compose run --rm web npm test

## lint: Lint/フォーマットチェック（ESLint）
lint:
	docker compose run --rm web npm run lint

## migrate: Prismaマイグレーションを作成・適用（DB起動が前提）
migrate:
	docker compose run --rm web npx prisma migrate dev

## generate: Prisma Clientを再生成
generate:
	docker compose run --rm web npx prisma generate

## studio: Prisma Studioを起動（http://localhost:5555）
studio:
	docker compose run --rm -p 5555:5555 web npx prisma studio

## logs: webサービスのログを追従表示
logs:
	docker compose logs -f web

## sh: webコンテナ内でシェルを起動
sh:
	docker compose run --rm web sh
