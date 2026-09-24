# Bobby Games

Интернет-магазин настольных игр: React-фронтенд и компактный ASP.NET Core API с PostgreSQL.

## Структура

Бэкенд — один развёртываемый проект без CQRS и MediatR. Код разделён на слои:

- `Core` — модели предметной области;
- `Application` — сценарии, DTO и абстракции инфраструктуры;
- `Infrastructure` — EF Core/PostgreSQL, JWT, пароли и начальные данные;
- `Presentation` — отдельные контроллеры и обработка HTTP-ошибок.

Реализованы API для авторизации, игр, категорий, корзины, заказов и пользователей. Изменение каталога, категорий, ролей и статусов заказов доступно администратору.

## Запуск

Для полного запуска требуется только Docker:

```bash
docker compose up --build
```

После запуска:

- магазин: `http://localhost:3000`;
- API: `http://localhost:5066`;
- PostgreSQL: `localhost:5432`.

Для запуска без Docker требуются .NET 8 и Node.js 22.12+:

```bash
docker compose up -d postgres
dotnet run --project backend/BobbyGames.Api.csproj
cd frontend
npm ci
npm run dev
```

В режиме разработки фронтенд откроется на `http://localhost:5173`.

Тестовый администратор: `admin@bobby.games` / `admin123`.

Для внешнего окружения скопируйте переменные из `.env.example` и обязательно замените JWT-ключ и пароль PostgreSQL.
