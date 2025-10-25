using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetFoodVerifAI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveIsGeneralFromAnalyses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Analyses_AspNetUsers_UserId",
                table: "Analyses");

            migrationBuilder.DropColumn(
                name: "IsGeneral",
                table: "Analyses");

            migrationBuilder.AddForeignKey(
                name: "FK_Analyses_AspNetUsers_UserId",
                table: "Analyses",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Analyses_AspNetUsers_UserId",
                table: "Analyses");

            migrationBuilder.AddColumn<bool>(
                name: "IsGeneral",
                table: "Analyses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_Analyses_AspNetUsers_UserId",
                table: "Analyses",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
