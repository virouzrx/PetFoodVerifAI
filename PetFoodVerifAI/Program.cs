using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PetFoodVerifAI.Data;
using PetFoodVerifAI.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));
builder.Services.AddDatabaseDeveloperPageExceptionFilter();

builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});


builder.Services.AddScoped<IAuthService, AuthService>();


builder.Services.AddControllersWithViews();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ====================================================================
// Example/Test Endpoint - Remove this section when implementing your own API endpoints
// ====================================================================
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();
// ====================================================================
// End of Example/Test Endpoint
// ====================================================================

// TODO: Add your PetFoodVerifAI API endpoints here
// Example:
// - POST /api/products - Create or get product
// - POST /api/analyses - Create analysis for a product
// - GET /api/analyses/{id} - Get specific analysis
// - POST /api/feedback - Submit feedback on analysis
// - GET /api/user/analyses - Get user's analysis history

// ====================================================================
// Database Health Check Endpoint - For testing database connection
// ====================================================================
app.MapGet("/api/health/database", async (ApplicationDbContext db) =>
{
    try
    {
        // Test database connection
        var canConnect = await db.Database.CanConnectAsync();
        
        if (!canConnect)
        {
            return Results.Problem("Cannot connect to database");
        }

        // Get counts from tables
        var productsCount = await db.Products.CountAsync();
        var analysesCount = await db.Analyses.CountAsync();
        var feedbackCount = await db.Feedbacks.CountAsync();
        var usersCount = await db.Users.CountAsync();

        return Results.Ok(new
        {
            status = "healthy",
            database = "PetFoodVerifAI",
            connected = true,
            timestamp = DateTime.UtcNow,
            tables = new
            {
                products = productsCount,
                analyses = analysesCount,
                feedback = feedbackCount,
                users = usersCount
            }
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Database error: {ex.Message}");
    }
})
.WithName("DatabaseHealthCheck")
.WithOpenApi();
// ====================================================================

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
