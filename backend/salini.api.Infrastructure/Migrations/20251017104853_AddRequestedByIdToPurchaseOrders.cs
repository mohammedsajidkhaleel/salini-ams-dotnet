using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace salini.api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestedByIdToPurchaseOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RequestedById",
                table: "PurchaseOrders",
                type: "character varying(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_RequestedById",
                table: "PurchaseOrders",
                column: "RequestedById");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Employees_RequestedById",
                table: "PurchaseOrders",
                column: "RequestedById",
                principalTable: "Employees",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Employees_RequestedById",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_RequestedById",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "RequestedById",
                table: "PurchaseOrders");
        }
    }
}
