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
- `IsGeneral` (BOOLEAN, default: false)
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

# Uruchom aplikację
dotnet run
```

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
2. ⬜ Dodanie pierwszej migracji
3. ⬜ Utworzenie bazy danych
4. ⬜ Implementacja endpointów API
5. ⬜ Dodanie autoryzacji i autentykacji
6. ⬜ Integracja z LLM dla analizy składników

## Uwagi

- **Row-Level Security (RLS)** - Nie jest zaimplementowane w modelu. Jeśli potrzebujesz RLS, skonfiguruj je bezpośrednio w PostgreSQL.
- **Enum mapping** - Enumeracje są automatycznie mapowane na natywne typy PostgreSQL dzięki Npgsql.
- **UUID** - Wszystkie ID używają typu UUID dla lepszego bezpieczeństwa i dystrybucji.

## Wsparcie

W razie pytań sprawdź:
- [Entity Framework Core Documentation](https://docs.microsoft.com/ef/core/)
- [Npgsql Documentation](https://www.npgsql.org/efcore/)
- [ASP.NET Identity Documentation](https://docs.microsoft.com/aspnet/core/security/authentication/identity)


