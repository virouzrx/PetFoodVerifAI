using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PetFoodVerifAI.Models;

namespace PetFoodVerifAI.Data;

/// <summary>
/// Application database context with Identity support and PetFoodVerifAI entities
/// </summary>
public class ApplicationDbContext : IdentityDbContext<IdentityUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }


    // DbSets for application entities
    public DbSet<Product> Products { get; set; } = null!;

    public DbSet<Analysis> Analyses { get; set; } = null!;

    public DbSet<Feedback> Feedbacks { get; set; } = null!;


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure ENUM types to use PostgreSQL native enums
        modelBuilder.HasPostgresEnum<Species>();
        modelBuilder.HasPostgresEnum<Recommendation>();

        // Configure Product entity
        modelBuilder.Entity<Product>(entity =>
        {
            // Unique constraint on ProductName and ProductUrl combination
            entity.HasIndex(p => new { p.ProductName, p.ProductUrl })
                .IsUnique();

            // Default value for CreatedAt
            entity.Property(p => p.CreatedAt)
                .HasDefaultValueSql("NOW()");
        });

        // Configure Analysis entity
        modelBuilder.Entity<Analysis>(entity =>
        {
            // Default value for CreatedAt
            entity.Property(a => a.CreatedAt)
                .HasDefaultValueSql("NOW()");

            // Configure relationship with Product
            entity.HasOne(a => a.Product)
                .WithMany(p => p.Analyses)
                .HasForeignKey(a => a.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure relationship with User
            entity.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId);

            // Index for ProductId for efficient version history queries
            entity.HasIndex(a => a.ProductId);

            // Index for UserId for efficient user history queries
            entity.HasIndex(a => a.UserId);
        });

        // Configure Feedback entity
        modelBuilder.Entity<Feedback>(entity =>
        {
            // Unique constraint on AnalysisId and UserId combination
            // Prevents a user from giving multiple feedback entries for the same analysis
            entity.HasIndex(f => new { f.AnalysisId, f.UserId })
                .IsUnique();

            // Default value for CreatedAt
            entity.Property(f => f.CreatedAt)
                .HasDefaultValueSql("NOW()");

            // Configure relationship with Analysis
            entity.HasOne(f => f.Analysis)
                .WithMany(a => a.Feedbacks)
                .HasForeignKey(f => f.AnalysisId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure relationship with User
            entity.HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Index for AnalysisId
            entity.HasIndex(f => f.AnalysisId);

            // Index for UserId
            entity.HasIndex(f => f.UserId);
        });
    }
}


