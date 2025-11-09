using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PetFoodVerifAI.Models;

namespace PetFoodVerifAI.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : IdentityDbContext<IdentityUser>(options)
{
    public DbSet<Product> Products { get; set; } = null!;

    public DbSet<Analysis> Analyses { get; set; } = null!;

    public DbSet<Feedback> Feedbacks { get; set; } = null!;


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresEnum<Species>();
        modelBuilder.HasPostgresEnum<Recommendation>();

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(p => new { p.ProductName, p.ProductUrl })
                .IsUnique();

            entity.Property(p => p.CreatedAt)
                .HasDefaultValueSql("NOW()");
        });

        modelBuilder.Entity<Analysis>(entity =>
        {
            entity.Property(a => a.CreatedAt)
                .HasDefaultValueSql("NOW()");

            entity.HasOne(a => a.Product)
                .WithMany(p => p.Analyses)
                .HasForeignKey(a => a.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId);

            entity.HasIndex(a => a.ProductId);

            entity.HasIndex(a => a.UserId);
        });

        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.HasIndex(f => new { f.AnalysisId, f.UserId })
                .IsUnique();

            entity.Property(f => f.CreatedAt)
                .HasDefaultValueSql("NOW()");

            entity.HasOne(f => f.Analysis)
                .WithMany(a => a.Feedbacks)
                .HasForeignKey(f => f.AnalysisId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(f => f.AnalysisId);

            entity.HasIndex(f => f.UserId);
        });
    }
}


