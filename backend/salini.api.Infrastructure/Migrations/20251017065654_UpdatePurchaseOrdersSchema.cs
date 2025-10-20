using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace salini.api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePurchaseOrdersSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderDate",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "RequestedById",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "ItemName",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "TotalPrice",
                table: "PurchaseOrderItems");

            migrationBuilder.RenameColumn(
                name: "ReceivedDate",
                table: "PurchaseOrders",
                newName: "ActualDeliveryDate");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "PurchaseOrderItems",
                newName: "Notes");

            migrationBuilder.AlterColumn<string>(
                name: "ProjectId",
                table: "PurchaseOrders",
                type: "character varying(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(450)",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PoDate",
                table: "PurchaseOrders",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "ItemId",
                table: "PurchaseOrderItems",
                type: "character varying(450)",
                maxLength: 450,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderItems_ItemId",
                table: "PurchaseOrderItems",
                column: "ItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_Items_ItemId",
                table: "PurchaseOrderItems",
                column: "ItemId",
                principalTable: "Items",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItems_Items_ItemId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderItems_ItemId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "PoDate",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "ItemId",
                table: "PurchaseOrderItems");

            migrationBuilder.RenameColumn(
                name: "ActualDeliveryDate",
                table: "PurchaseOrders",
                newName: "ReceivedDate");

            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "PurchaseOrderItems",
                newName: "Description");

            migrationBuilder.AlterColumn<string>(
                name: "ProjectId",
                table: "PurchaseOrders",
                type: "character varying(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(450)");

            migrationBuilder.AddColumn<DateTime>(
                name: "OrderDate",
                table: "PurchaseOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestedById",
                table: "PurchaseOrders",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ItemName",
                table: "PurchaseOrderItems",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "TotalPrice",
                table: "PurchaseOrderItems",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
