using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace salini.api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddedAssignedTo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "AssignedTo",
                table: "SimCards",
                type: "character varying(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AssignmentDate",
                table: "SimCards",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimCards_AssignedTo",
                table: "SimCards",
                column: "AssignedTo");

            migrationBuilder.AddForeignKey(
                name: "FK_SimCards_Employees_AssignedTo",
                table: "SimCards",
                column: "AssignedTo",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SimCards_Employees_AssignedTo",
                table: "SimCards");

            migrationBuilder.DropIndex(
                name: "IX_SimCards_AssignedTo",
                table: "SimCards");

            migrationBuilder.DropColumn(
                name: "AssignmentDate",
                table: "SimCards");

            migrationBuilder.AlterColumn<string>(
                name: "AssignedTo",
                table: "SimCards",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(450)",
                oldNullable: true);
        }
    }
}
