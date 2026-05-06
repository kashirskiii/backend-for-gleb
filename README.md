# analysis-api

REST API системы проверки студенческих работ на соответствие ГОСТ.  
NestJS + Prisma + PostgreSQL + pgAdmin, полностью контейнеризировано через Docker.

## Stack


| Слой           | Технология                      |
| -------------- | ------------------------------- |
| Framework      | NestJS 11                       |
| ORM            | Prisma 5                        |
| База данных    | PostgreSQL 15                   |
| DB Admin       | pgAdmin 4                       |
| Runtime        | Node 20 Alpine                  |
| Аутентификация | JWT (access + refresh, ротация) |
| Документация   | Swagger / OpenAPI               |


## Быстрый старт

```bash
# 1. Скопировать env и при необходимости скорректировать
cp .env.example .env

# 2. Собрать и запустить все сервисы
docker compose up -d --build

# 3. Проверить состояние контейнеров
docker compose ps
```

## Сервисы


| Сервис     | URL / порт                                                       |
| ---------- | ---------------------------------------------------------------- |
| NestJS API | [http://localhost:3000/api](http://localhost:3000/api)           |
| Swagger UI | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) |
| pgAdmin    | [http://localhost:5050](http://localhost:5050)                   |
| PostgreSQL | localhost:5432                                                   |


### pgAdmin — вход

- **Email:** [admin@admin.com](mailto:admin@admin.com)  
- **Password:** admin  
- Сервер `analysis-postgres` зарегистрирован автоматически — ручная настройка не нужна.

## API

### Auth (`/api/auth`)


| Метод | Путь            | Описание                                          |
| ----- | --------------- | ------------------------------------------------- |
| POST  | `/auth/login`   | Вход — возвращает пару access/refresh токенов     |
| POST  | `/auth/refresh` | Обновление токенов (старый refresh аннулируется)  |
| POST  | `/auth/logout`  | Выход — аннулирует refresh token (требует Bearer) |


### Dialogs (`/api/dialogs`)


| Метод | Путь       | Описание                                              |
| ----- | ---------- | ----------------------------------------------------- |
| POST  | `/dialogs` | Создать диалог + загрузить файл (multipart, до 20 МБ) |


Интерактивная документация со всеми схемами запросов и ответов — **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**.

## Доменная модель

```
User (student | teacher)
 └─ Dialog (open → approved | rejected | closed)
     └─ Submission (версии работы)
         ├─ File (загруженные файлы)
         ├─ Check (автоматическая проверка: pending → processing → done | failed)
         │   └─ CheckError (найденные нарушения)
         ├─ Message (переписка: student | teacher | system)
         └─ Approval (system | teacher: pending → approved | rejected)
```

## Prisma

Выполнять внутри **запущенного** контейнера:

```bash
# Сгенерировать Prisma Client после изменений схемы
docker compose exec app npx prisma generate

# Создать и применить миграцию (dev)
docker compose exec app npx prisma migrate dev --name <migration-name>

# Применить pending-миграции (production / CI)
docker compose exec app npx prisma migrate deploy

# Открыть Prisma Studio (браузерный просмотрщик данных)
docker compose exec app npx prisma studio --browser none
# затем открыть http://localhost:5555

# Сбросить БД и перезапустить все миграции (только dev)
docker compose exec app npx prisma migrate reset

# Заполнить БД тестовыми пользователями
docker compose exec app npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

Или через Makefile:

```bash
make up-build            # собрать и запустить
make prisma-generate     # сгенерировать клиент
make prisma-migrate      # создать dev-миграцию
make prisma-migrate-prod # применить prod-миграции
make prisma-studio       # открыть Studio
make prisma-reset        # сбросить БД (dev)
make logs                # логи app-контейнера
make logs-all            # логи всех контейнеров
make down                # остановить контейнеры
make down-volumes        # остановить + удалить volumes
```

### Seed-данные

После запуска seed создаются два тестовых пользователя:


| Роль    | Email                                             | Пароль           |
| ------- | ------------------------------------------------- | ---------------- |
| teacher | [teacher@example.com](mailto:teacher@example.com) | teacher-password |
| student | [student@example.com](mailto:student@example.com) | student-password |


## Локальная разработка (без Docker)

Требуется локальный PostgreSQL. В `.env` укажите `DATABASE_URL` с хостом `localhost`.

```bash
npm install
npm run start:dev
```

## Структура проекта

```
.
├── src/
│   ├── main.ts                        # bootstrap, Swagger setup
│   ├── app.module.ts
│   ├── swagger.config.ts
│   ├── auth/
│   │   ├── auth.controller.ts         # /auth/login, /refresh, /logout
│   │   ├── auth.service.ts            # JWT generation, bcrypt, token rotation
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   └── auth-tokens.response.dto.ts
│   │   ├── guards/jwt-auth.guard.ts
│   │   └── strategies/jwt.strategy.ts
│   ├── dialogs/
│   │   ├── dialogs.controller.ts      # POST /dialogs (multipart)
│   │   ├── dialogs.service.ts         # создание диалога + сохранение файла
│   │   ├── dialogs.module.ts
│   │   └── dto/
│   │       ├── create-dialog.dto.ts
│   │       └── create-dialog-response.dto.ts
│   └── prisma/
│       ├── prisma.module.ts           # глобальный PrismaModule
│       └── prisma.service.ts          # обёртка PrismaClient
├── prisma/
│   ├── schema.prisma                  # схема данных
│   └── seed.ts                        # тестовые пользователи
├── scripts/
│   └── generate-openapi.ts            # генерация openapi.yaml
├── pgadmin/
│   └── servers.json                   # авторегистрация сервера pgAdmin
├── Dockerfile                         # multi-stage build
├── docker-compose.yml
├── Makefile
└── .env.example
```

