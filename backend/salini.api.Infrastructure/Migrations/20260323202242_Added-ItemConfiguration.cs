using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace salini.api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddedItemConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ItemConfigurationId",
                table: "Assets",
                type: "character varying(450)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ItemTypes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Processors",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Processors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ItemConfigurations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    ItemTypeId = table.Column<string>(type: "character varying(450)", nullable: false),
                    Specification = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ProcessorId = table.Column<string>(type: "character varying(450)", nullable: false),
                    ConfigurationText = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemConfigurations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemConfigurations_ItemTypes_ItemTypeId",
                        column: x => x.ItemTypeId,
                        principalTable: "ItemTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ItemConfigurations_Processors_ProcessorId",
                        column: x => x.ProcessorId,
                        principalTable: "Processors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "ItemTypes",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "IsActive", "Name", "UpdatedAt", "UpdatedBy" },
                values: new object[] { "ITYPE_PC", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", true, "PC", null, null });

            migrationBuilder.InsertData(
                table: "Processors",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "IsActive", "Name", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { "PROC_AMD", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", true, "AMD", null, null },
                    { "PROC_INTEL", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", true, "Intel", null, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Assets_ItemConfigurationId",
                table: "Assets",
                column: "ItemConfigurationId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemConfigurations_ItemTypeId_Specification_ProcessorId",
                table: "ItemConfigurations",
                columns: new[] { "ItemTypeId", "Specification", "ProcessorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ItemConfigurations_ProcessorId",
                table: "ItemConfigurations",
                column: "ProcessorId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemTypes_Name",
                table: "ItemTypes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Processors_Name",
                table: "Processors",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_ItemConfigurations_ItemConfigurationId",
                table: "Assets",
                column: "ItemConfigurationId",
                principalTable: "ItemConfigurations",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assets_ItemConfigurations_ItemConfigurationId",
                table: "Assets");

            migrationBuilder.DropTable(
                name: "ItemConfigurations");

            migrationBuilder.DropTable(
                name: "ItemTypes");

            migrationBuilder.DropTable(
                name: "Processors");

            migrationBuilder.DropIndex(
                name: "IX_Assets_ItemConfigurationId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "ItemConfigurationId",
                table: "Assets");
        }
    }
}
