using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace salini.api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddedCompositeUniqueKeyForSimCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SimCards_SimAccountNo",
                table: "SimCards");

            migrationBuilder.DropIndex(
                name: "IX_SimCards_SimSerialNo",
                table: "SimCards");

            migrationBuilder.DropIndex(
                name: "IX_SimCards_SimServiceNo",
                table: "SimCards");

            migrationBuilder.CreateIndex(
                name: "IX_SimCards_SimAccountNo_SimServiceNo",
                table: "SimCards",
                columns: new[] { "SimAccountNo", "SimServiceNo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SimCards_SimAccountNo_SimServiceNo",
                table: "SimCards");

            migrationBuilder.CreateIndex(
                name: "IX_SimCards_SimAccountNo",
                table: "SimCards",
                column: "SimAccountNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimCards_SimSerialNo",
                table: "SimCards",
                column: "SimSerialNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimCards_SimServiceNo",
                table: "SimCards",
                column: "SimServiceNo",
                unique: true);
        }
    }
}
