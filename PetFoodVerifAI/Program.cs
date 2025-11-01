using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PetFoodVerifAI.Data;
using PetFoodVerifAI.Services;
using Resend;
using System.Text;
using System.Text.Json.Serialization;

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
})
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Google:ClientId"] ?? throw new InvalidOperationException("Google ClientId not configured");
    options.ClientSecret = builder.Configuration["Google:ClientSecret"] ?? throw new InvalidOperationException("Google ClientSecret not configured");
});


builder.Services.AddScoped<IAuthService, AuthService>();
// Register Resend email service
var resendApiKey = builder.Configuration["Email:Resend:ApiKey"] ?? throw new InvalidOperationException("Resend API key not configured");
builder.Services.AddHttpClient();
// Configure Resend with API key
builder.Services.Configure<ResendClientOptions>(opt => opt.ApiToken = resendApiKey);
builder.Services.AddHttpClient<IResend, ResendClient>();
builder.Services.AddScoped<IEmailService, ResendEmailService>();

// Register application services
builder.Services.AddScoped<IAnalysisService, AnalysisService>();

// Register external services
builder.Services.AddHttpClient<IScrapingService, BasicScrapingService>(client =>
{
    // Add headers to make requests look like they're coming from a real browser
    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36");
    client.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
    client.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
    // Don't manually add Accept-Encoding - let HttpClient handle compression automatically
    client.DefaultRequestHeaders.Add("DNT", "1");
    client.DefaultRequestHeaders.Add("Connection", "keep-alive");
    client.DefaultRequestHeaders.Add("Upgrade-Insecure-Requests", "1");
    client.Timeout = TimeSpan.FromSeconds(30);
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    // Automatically decompress gzip and deflate responses
    AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate | System.Net.DecompressionMethods.Brotli
});

// LLM Service - Switch between Mock and Real LLM based on configuration
var useMockLLM = builder.Configuration.GetValue<bool>("UseMockLLM", false);
if (useMockLLM)
{
    builder.Services.AddSingleton<ILLMService, MockLLMService>();
}
else
{
    builder.Services.AddHttpClient<ILLMService, LLMService>();
}


builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        // Serialize enums as strings instead of integers
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(_ => true)
            .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter your JWT token in the format: {your token here}"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

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






