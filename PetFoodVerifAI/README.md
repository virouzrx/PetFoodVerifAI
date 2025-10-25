# PetFoodVerifAI - Database Setup

## Struktura projektu

Projekt został wygenerowany z wykorzystaniem Entity Framework Core Code First dla PostgreSQL. Struktura obejmuje:

### Modele (Models/)
- **Enums.cs** - Enumeracje `Species` (Cat, Dog) i `Recommendation` (Recommended, NotRecommended)
- **Product.cs** - Model produktu karmy dla zwierząt
- **Analysis.cs** - Model analizy produktu z rekomendacją
- **Feedback.cs** - Model opinii użytkowników o analizie

### DbContext (Data/)
- **ApplicationDbContext.cs** - Kontekst bazy danych dziedziczący z `IdentityDbContext<IdentityUser>`

## Konfiguracja

### 1. Wymagania
- PostgreSQL 12 lub nowszy
- .NET 8.0 SDK
- Entity Framework Core Tools

### 2. Connection String

Zaktualizuj connection string w plikach `appsettings.json` i `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=PetFoodVerifAI;Username=your_username;Password=your_password"
  }
}
```

**Uwaga dotycząca bezpieczeństwa:** 
- **Nigdy nie commituj** pliku `appsettings.Development.json` z prawdziwymi danymi do repozytorium!
- Dla produkcji użyj zmiennych środowiskowych lub Azure Key Vault/AWS Secrets Manager
- Możesz także użyć User Secrets dla lokalnego developerstwa:

```bash
# Dodaj connection string do User Secrets
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=PetFoodVerifAI;Username=your_username;Password=your_password"
```

### 3. Utworzenie bazy danych

#### Metoda 1: Migracje EF Core (zalecane)

```bash
# Dodaj pierwszą migrację
dotnet ef migrations add InitialCreate

# Zastosuj migrację do bazy danych
dotnet ef database update
```

#### Metoda 2: Ręczne utworzenie bazy danych

Jeśli wolisz ręcznie utworzyć bazę danych, EF Core automatycznie utworzy enumeracje PostgreSQL podczas pierwszego uruchomienia dzięki konfiguracji w `ApplicationDbContext`.

### 4. Utworzone typy ENUM w PostgreSQL

```sql
CREATE TYPE species_enum AS ENUM ('Cat', 'Dog');
CREATE TYPE recommendation_enum AS ENUM ('Recommended', 'NotRecommended');
```

Typy te są automatycznie tworzone przez EF Core dzięki metodzie `HasPostgresEnum<T>()` w konfiguracji.

## Struktura bazy danych

### Tabele

#### Products
- `ProductId` (UUID, PK)
- `ProductName` (TEXT, NOT NULL)
- `ProductUrl` (TEXT, NOT NULL)
- `CreatedAt` (TIMESTAMPTZ, default: NOW())
- **Unique Index**: (ProductName, ProductUrl)

#### Analyses
- `AnalysisId` (UUID, PK)
- `ProductId` (UUID, FK -> Products)
- `UserId` (TEXT, FK -> AspNetUsers)
- `Recommendation` (recommendation_enum)
- `Justification` (TEXT)
- `IngredientsText` (TEXT)
- `Species` (species_enum)
- `Breed` (TEXT, nullable)
- `Age` (INTEGER, nullable)
- `AdditionalInfo` (TEXT, nullable)
- `CreatedAt` (TIMESTAMPTZ, default: NOW())
- **Indexes**: ProductId, UserId

#### Feedback
- `FeedbackId` (UUID, PK)
- `AnalysisId` (UUID, FK -> Analyses)
- `UserId` (TEXT, FK -> AspNetUsers)
- `IsPositive` (BOOLEAN)
- `CreatedAt` (TIMESTAMPTZ, default: NOW())
- **Unique Index**: (AnalysisId, UserId)
- **Index**: UserId

#### AspNetUsers (ASP.NET Identity)
- Standardowe tabele Identity dla zarządzania użytkownikami

## Relacje

- **Product** → **Analysis**: One-to-Many (Product.Analyses)
- **IdentityUser** → **Analysis**: One-to-Many
- **Analysis** → **Feedback**: One-to-Many (Analysis.Feedbacks)
- **IdentityUser** → **Feedback**: One-to-Many

## Konfiguracja zaawansowana

### Delete Behavior

- **Product → Analysis**: `Restrict` - nie można usunąć produktu, jeśli ma powiązane analizy
- **Analysis → Feedback**: `Cascade` - usunięcie analizy usuwa powiązane opinie
- **User → Analysis/Feedback**: `Restrict` - nie można usunąć użytkownika, jeśli ma powiązane dane

### Wartości domyślne

- `CreatedAt` - automatycznie ustawiane na `NOW()` przez PostgreSQL
- `IsGeneral` - domyślnie `false`
- `ProductId`, `AnalysisId`, `FeedbackId` - automatycznie generowane UUID

## ASP.NET Identity

Projekt jest skonfigurowany z ASP.NET Identity:

```csharp
services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();
```

## Uruchomienie projektu

```bash
# Przywróć pakiety
dotnet restore

# Zaktualizuj bazę danych (wykonaj migracje)
dotnet ef database update

# Uruchom aplikację
dotnet run
```

Po uruchomieniu aplikacja będzie dostępna pod adresem:
- HTTPS: https://localhost:7xxx
- HTTP: http://localhost:5xxx
- Swagger UI: https://localhost:7xxx/swagger

## Testowanie bazy danych

### Metoda 1: Endpoint Health Check (Najłatwiejszy)

Po uruchomieniu aplikacji otwórz w przeglądarce lub użyj curl:

```bash
# Health check bazy danych
curl https://localhost:7xxx/api/health/database

# Lub otwórz w przeglądarce:
# https://localhost:7xxx/api/health/database
```

Odpowiedź pokaże status połączenia i liczbę rekordów w każdej tabeli.

### Metoda 2: PostgreSQL Command Line (psql)

```bash
# Połącz się z bazą danych
psql -h localhost -p 5432 -U postgres -d PetFoodVerifAI

# W psql wykonaj zapytania:
\dt                          # Lista wszystkich tabel
\d "Products"                # Struktura tabeli Products
\dT                          # Lista typów ENUM

SELECT * FROM "Products";    # Pobierz wszystkie produkty
SELECT * FROM "Analyses";    # Pobierz wszystkie analizy

# Sprawdź czy enum'y zostały utworzone
SELECT typname FROM pg_type WHERE typtype = 'e';

\q                           # Wyjście
```

### Metoda 3: pgAdmin (Graficzny interfejs)

1. Otwórz pgAdmin
2. Połącz się z serwerem (localhost:5432)
3. Przejdź do: Servers → PostgreSQL → Databases → PetFoodVerifAI
4. Kliknij prawym na bazę → Query Tool
5. Wykonuj zapytania SQL

### Metoda 4: Visual Studio Code z rozszerzeniem PostgreSQL

1. Zainstaluj rozszerzenie "PostgreSQL" w VS Code
2. Dodaj połączenie z bazą danych
3. Przeglądaj tabele i wykonuj zapytania

## Tworzenie endpointów API

Projekt wykorzystuje Minimal API w .NET 8. Przykładowa struktura endpointów:

### Rekomendowane endpointy do implementacji:

1. **Produkty**
   - `POST /api/products` - Utworzenie/pobranie produktu
   - `GET /api/products/{id}` - Szczegóły produktu

2. **Analizy**
   - `POST /api/analyses` - Utworzenie analizy (integracja z LLM)
   - `GET /api/analyses/{id}` - Pobranie konkretnej analizy
   - `GET /api/products/{productId}/analyses` - Historia analiz produktu
   - `GET /api/user/analyses` - Historia analiz użytkownika

3. **Opinie (Feedback)**
   - `POST /api/feedback` - Dodanie opinii o analizie
   - `PUT /api/feedback/{id}` - Aktualizacja opinii

4. **Autentykacja**
   - `POST /api/auth/register` - Rejestracja użytkownika
   - `POST /api/auth/login` - Logowanie
   - `POST /api/auth/logout` - Wylogowanie
   - `GET /api/auth/user` - Informacje o zalogowanym użytkowniku

## Narzędzia EF Core

```bash
# Lista wszystkich migracji
dotnet ef migrations list

# Usunięcie ostatniej migracji
dotnet ef migrations remove

# Aktualizacja do konkretnej migracji
dotnet ef database update MigrationName

# Generowanie skryptu SQL
dotnet ef migrations script
```

## Następne kroki

1. ✅ Utworzenie modeli i DbContext
2. ✅ Dodanie pierwszej migracji (InitialCreate)
3. ✅ Utworzenie bazy danych
4. ✅ Konfiguracja CORS dla aplikacji frontendowej
5. ⬜ Implementacja endpointów API
6. ⬜ Dodanie autoryzacji i autentykacji (rejestracja, logowanie)
7. ⬜ Integracja z LLM dla analizy składników
8. ⬜ Dodanie middleware do obsługi błędów i logowania
9. ⬜ Dodanie walidacji danych wejściowych
10. ⬜ Implementacja rate limiting dla API

## Uwagi

- **Row-Level Security (RLS)** - Nie jest zaimplementowane w modelu. Jeśli potrzebujesz RLS, skonfiguruj je bezpośrednio w PostgreSQL.
- **Enum mapping** - Enumeracje są automatycznie mapowane na natywne typy PostgreSQL dzięki Npgsql. Upewnij się, że w connection string nie ma `No Reset On Close=true`, które może powodować problemy z enum'ami.
- **UUID** - Wszystkie ID używają typu UUID dla lepszego bezpieczeństwa i dystrybucji.
- **Endpoint WeatherForecast** - Domyślny endpoint testowy w `Program.cs` może zostać usunięty po utworzeniu własnych endpointów API.

## Konfiguracja zmiennych środowiskowych

### Dla developerstwa (User Secrets)

```bash
# Connection String
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=PetFoodVerifAI;Username=postgres;Password=your_password"

# Dodaj klucz API dla LLM (gdy będzie potrzebny)
dotnet user-secrets set "OpenAI:ApiKey" "your-api-key-here"
```

### Dla produkcji (zmienne środowiskowe)

```bash
# Linux/macOS
export ConnectionStrings__DefaultConnection="Host=your-host;Port=5432;Database=PetFoodVerifAI;Username=user;Password=pass"
export OpenAI__ApiKey="your-api-key"

# Windows PowerShell
$env:ConnectionStrings__DefaultConnection="Host=your-host;Port=5432;Database=PetFoodVerifAI;Username=user;Password=pass"
$env:OpenAI__ApiKey="your-api-key"
```

## Bezpieczeństwo

### Najlepsze praktyki:

1. **Hasła i tajemnice**
   - Używaj User Secrets dla developmentu
   - Używaj zmiennych środowiskowych lub Key Vault dla produkcji
   - Nigdy nie commituj haseł do repozytorium

2. **CORS**
   - Zaktualizuj politykę CORS w `Program.cs` tylko dla zaufanych domen
   - Usuń `AllowAnyOrigin()` w produkcji

3. **HTTPS**
   - Zawsze wymuszaj HTTPS w produkcji
   - Skonfiguruj certyfikaty SSL

4. **Rate Limiting**
   - Rozważ dodanie rate limiting dla API endpointów
   - Szczególnie dla endpointów wymagających kosztownych operacji (LLM)

5. **Walidacja danych**
   - Zawsze waliduj dane wejściowe
   - Używaj Data Annotations i FluentValidation

## Wsparcie

W razie pytań sprawdź:
- [Entity Framework Core Documentation](https://docs.microsoft.com/ef/core/)
- [Npgsql Documentation](https://www.npgsql.org/efcore/)
- [ASP.NET Identity Documentation](https://docs.microsoft.com/aspnet/core/security/authentication/identity)
- [.NET User Secrets](https://docs.microsoft.com/aspnet/core/security/app-secrets)
- [ASP.NET Core Security Best Practices](https://docs.microsoft.com/aspnet/core/security/)


