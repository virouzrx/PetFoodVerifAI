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
var resendApiKey = builder.Configuration["Email:Resend:ApiKey"] ?? throw new InvalidOperationException("Resend API key not configured");
builder.Services.AddHttpClient();
builder.Services.Configure<ResendClientOptions>(opt => opt.ApiToken = resendApiKey);
builder.Services.AddHttpClient<IResend, ResendClient>();
builder.Services.AddScoped<IEmailService, ResendEmailService>();

builder.Services.AddScoped<IAnalysisService, AnalysisService>();

builder.Services.AddHttpClient<IScrapingService, BasicScrapingService>(client =>
{
    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36");
    client.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
    client.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
    client.DefaultRequestHeaders.Add("DNT", "1");
    client.DefaultRequestHeaders.Add("Connection", "keep-alive");
    client.DefaultRequestHeaders.Add("Upgrade-Insecure-Requests", "1");
    client.Timeout = TimeSpan.FromSeconds(30);
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate | System.Net.DecompressionMethods.Brotli
});

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
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Environment.IsDevelopment()
            ? ["http://localhost:5173", "http://127.0.0.1:5173"]
            : new[] { 
                "https://www.petfoodverifai.com",
                "https://petfoodverifai.com",
            };
        
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
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
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/api/health/database", async (ApplicationDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        
        if (!canConnect)
        {
            return Results.Problem("Cannot connect to database");
        }

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

app.Run();






