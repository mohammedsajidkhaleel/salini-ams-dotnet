using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace salini.api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCodeToCostCenter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "CostCenters",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Code",
                table: "CostCenters");
        }
    }
}
