using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace salini.api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddedItemConfigurationInItemCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ItemTypeId",
                table: "ItemCategories",
                type: "character varying(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ItemCategories_ItemTypeId",
                table: "ItemCategories",
                column: "ItemTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_ItemCategories_ItemTypes_ItemTypeId",
                table: "ItemCategories",
                column: "ItemTypeId",
                principalTable: "ItemTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ItemCategories_ItemTypes_ItemTypeId",
                table: "ItemCategories");

            migrationBuilder.DropIndex(
                name: "IX_ItemCategories_ItemTypeId",
                table: "ItemCategories");

            migrationBuilder.DropColumn(
                name: "ItemTypeId",
                table: "ItemCategories");
        }
    }
}
