using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetFoodVerifAI.Migrations
{
    /// <inheritdoc />
    public partial class AddConcernsToAnalyses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConcernsJson",
                table: "Analyses",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConcernsJson",
                table: "Analyses");
        }
    }
}

