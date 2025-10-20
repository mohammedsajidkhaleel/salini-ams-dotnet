using MediatR;
using salini.api.Application.Common.Interfaces;
using salini.api.Application.DTOs.SimCard;
using salini.api.Application.Features.Employees.Commands.ImportEmployees;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace salini.api.Application.Features.SimCards.Commands.ImportSimCards;

public record ImportSimCardsCommand : IRequest<ImportSimCardsResult>
{
    public List<SimCardImportDto> SimCards { get; init; } = new();
    public string? ProjectId { get; init; }
}

public class ImportSimCardsCommandHandler : IRequestHandler<ImportSimCardsCommand, ImportSimCardsResult>
{
    private readonly IApplicationDbContext _context;

    public ImportSimCardsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ImportSimCardsResult> Handle(ImportSimCardsCommand request, CancellationToken cancellationToken)
    {
        var result = new ImportSimCardsResult
        {
            Success = true,
            Imported = 0,
            Updated = 0,
            Errors = new List<ImportError>()
        };

        if (request.SimCards == null || request.SimCards.Count == 0)
        {
            result.Success = false;
            result.Errors.Add(new ImportError { Row = 0, Message = "No SIM cards provided for import." });
            return result;
        }

        // Get existing master data
        var existingSimTypes = await _context.SimTypes.ToDictionaryAsync(st => st.Name.ToLowerInvariant(), st => st, cancellationToken);
        var existingSimProviders = await _context.SimProviders.ToDictionaryAsync(sp => sp.Name.ToLowerInvariant(), sp => sp, cancellationToken);
        var existingSimCardPlans = await _context.SimCardPlans.ToDictionaryAsync(scp => scp.Name.ToLowerInvariant(), scp => scp, cancellationToken);
        var existingEmployees = await _context.Employees.ToDictionaryAsync(e => e.EmployeeId.ToLowerInvariant(), e => e, cancellationToken);
        var projects = await _context.Projects.ToListAsync(cancellationToken);

        // Get existing SIM cards for upsert (using combination of SimAccountNo + SimServiceNo as unique key)
        var existingSimCards = await _context.SimCards
            .Where(s => !string.IsNullOrEmpty(s.SimAccountNo) && !string.IsNullOrEmpty(s.SimServiceNo))
            .ToDictionaryAsync(s => $"{s.SimAccountNo.ToLowerInvariant()}|{s.SimServiceNo.ToLowerInvariant()}", s => s, cancellationToken);

        // Project selection logic
        Project? selectedProject = null;
        if (!string.IsNullOrEmpty(request.ProjectId))
        {
            selectedProject = projects.FirstOrDefault(p => p.Id == request.ProjectId);
            if (selectedProject == null)
            {
                result.Errors.Add(new ImportError
                {
                    Row = 0,
                    Message = $"Project with ID '{request.ProjectId}' not found."
                });
                result.Success = false;
                return result;
            }
        }

        // Step 1: Create missing master data in bulk
        await CreateMissingMasterDataBulk(request.SimCards, existingSimTypes, existingSimProviders, existingSimCardPlans);

        // Step 2: Process SIM cards in bulk
        var simCardsToAdd = new List<SimCard>();
        var simCardsToUpdate = new List<SimCard>();
        var assignmentsToCreate = new List<EmployeeSimCard>();
        var processedSimKeys = new HashSet<string>();

        for (int i = 0; i < request.SimCards.Count; i++)
        {
            var simCardDto = request.SimCards[i];
            var rowNumber = i + 1;

            try
            {
                // Validate required fields for unique combination
                if (string.IsNullOrWhiteSpace(simCardDto.SimAccountNo))
                {
                    result.Errors.Add(new ImportError { Row = rowNumber, Message = "SIM Account Number is required for unique identification." });
                    continue;
                }

                if (string.IsNullOrWhiteSpace(simCardDto.SimServiceNo))
                {
                    result.Errors.Add(new ImportError { Row = rowNumber, Message = "SIM Service Number is required for unique identification." });
                    continue;
                }

                // Create unique key for this SIM card (combination of account and service number)
                var simKey = $"{simCardDto.SimAccountNo.ToLowerInvariant()}|{simCardDto.SimServiceNo.ToLowerInvariant()}";

                // Check for duplicates within the import batch
                if (processedSimKeys.Contains(simKey))
                {
                    result.Errors.Add(new ImportError
                    {
                        Row = rowNumber,
                        Message = $"Duplicate SIM card combination (Account: '{simCardDto.SimAccountNo}', Service: '{simCardDto.SimServiceNo}') found in import data"
                    });
                    continue;
                }
                processedSimKeys.Add(simKey);

                // Get master data IDs
                var simTypeId = GetMasterDataId(simCardDto.SimType, existingSimTypes);
                var simProviderId = GetMasterDataId(simCardDto.SimProvider, existingSimProviders);
                var simCardPlanId = GetMasterDataId(simCardDto.SimCardPlan, existingSimCardPlans);

                // Check if SIM card already exists (using combination key)
                if (existingSimCards.TryGetValue(simKey, out var existingSimCard))
                {
                    // Update existing SIM card
                    existingSimCard.SimServiceNo = simCardDto.SimServiceNo;
                    existingSimCard.SimStartDate = !string.IsNullOrEmpty(simCardDto.SimStartDate) ? DateTime.SpecifyKind(DateTime.Parse(simCardDto.SimStartDate), DateTimeKind.Utc) : null;
                    existingSimCard.SimTypeId = simTypeId;
                    existingSimCard.SimProviderId = simProviderId;
                    existingSimCard.SimCardPlanId = simCardPlanId;
                    existingSimCard.SimStatus = ParseSimCardStatus(simCardDto.SimStatus);
                    existingSimCard.SimSerialNo = string.IsNullOrEmpty(simCardDto.SimSerialNo) ? null : simCardDto.SimSerialNo;
                    existingSimCard.ProjectId = selectedProject?.Id;
                    existingSimCard.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                    existingSimCard.UpdatedBy = "System"; // TODO: Get from current user context

                    simCardsToUpdate.Add(existingSimCard);
                    result.Updated++;
                }
                else
                {
                    // Create new SIM card
                    var newSimCard = new SimCard
                    {
                        Id = Guid.NewGuid().ToString(),
                        SimAccountNo = simCardDto.SimAccountNo,
                        SimServiceNo = simCardDto.SimServiceNo,
                        SimStartDate = !string.IsNullOrEmpty(simCardDto.SimStartDate) ? DateTime.SpecifyKind(DateTime.Parse(simCardDto.SimStartDate), DateTimeKind.Utc) : null,
                        SimTypeId = simTypeId,
                        SimProviderId = simProviderId,
                        SimCardPlanId = simCardPlanId,
                        SimStatus = ParseSimCardStatus(simCardDto.SimStatus),
                        SimSerialNo = string.IsNullOrEmpty(simCardDto.SimSerialNo) ? null : simCardDto.SimSerialNo,
                        ProjectId = selectedProject?.Id,
                        CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                        CreatedBy = "System" // TODO: Get from current user context
                    };

                    simCardsToAdd.Add(newSimCard);
                    existingSimCards[simKey] = newSimCard;
                    result.Imported++;
                }

                // Prepare employee assignment if specified
                if (!string.IsNullOrEmpty(simCardDto.AssignedTo))
                {
                    var employee = existingEmployees.Values.FirstOrDefault(e => 
                        e.EmployeeId.Equals(simCardDto.AssignedTo, StringComparison.OrdinalIgnoreCase));

                    if (employee != null)
                    {
                        var simCardForAssignment = existingSimCards[simKey];
                        
                        // Create assignment record (will be processed after SIM cards are saved)
                        var assignment = new EmployeeSimCard
                        {
                            Id = Guid.NewGuid().ToString(),
                            EmployeeId = employee.Id,
                            SimCardId = simCardForAssignment.Id,
                            AssignedDate = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                            Status = AssignmentStatus.Assigned,
                            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                            CreatedBy = "System" // TODO: Get from current user context
                        };

                        assignmentsToCreate.Add(assignment);
                        simCardForAssignment.AssignedTo = employee.Id;
                    }
                }
            }
            catch (Exception ex)
            {
                result.Errors.Add(new ImportError
                {
                    Row = rowNumber,
                    Message = $"Error processing SIM card: {ex.Message}"
                });
            }
        }

        // Step 3: Bulk save all changes
        if (simCardsToAdd.Count > 0)
        {
            _context.SimCards.AddRange(simCardsToAdd);
        }

        // Save SIM cards first to get their IDs
        await _context.SaveChangesAsync(cancellationToken);

        // Step 4: Create employee assignments in bulk
        if (assignmentsToCreate.Count > 0)
        {
            _context.EmployeeSimCards.AddRange(assignmentsToCreate);
            await _context.SaveChangesAsync(cancellationToken);
        }

        result.Success = result.Errors.Count == 0;
        return result;
    }

    private async Task CreateMissingMasterDataBulk(
        List<SimCardImportDto> simCards,
        Dictionary<string, SimType> existingSimTypes,
        Dictionary<string, SimProvider> existingSimProviders,
        Dictionary<string, SimCardPlan> existingSimCardPlans)
    {
        var simTypesToCreate = new List<SimType>();
        var simProvidersToCreate = new List<SimProvider>();
        var simCardPlansToCreate = new List<SimCardPlan>();

        foreach (var simCard in simCards)
        {
            // Collect unique SIM types
            if (!string.IsNullOrWhiteSpace(simCard.SimType))
            {
                var normalizedName = simCard.SimType.Trim().ToLowerInvariant();
                if (!existingSimTypes.ContainsKey(normalizedName))
                {
                    var newSimType = new SimType
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = simCard.SimType.Trim(),
                        Description = "Auto-created from SIM card import",
                        CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                        CreatedBy = "System"
                    };
                    simTypesToCreate.Add(newSimType);
                    existingSimTypes[normalizedName] = newSimType;
                }
            }

            // Collect unique SIM providers
            if (!string.IsNullOrWhiteSpace(simCard.SimProvider))
            {
                var normalizedName = simCard.SimProvider.Trim().ToLowerInvariant();
                if (!existingSimProviders.ContainsKey(normalizedName))
                {
                    var newSimProvider = new SimProvider
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = simCard.SimProvider.Trim(),
                        Description = "Auto-created from SIM card import",
                        CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                        CreatedBy = "System"
                    };
                    simProvidersToCreate.Add(newSimProvider);
                    existingSimProviders[normalizedName] = newSimProvider;
                }
            }

            // Collect unique SIM card plans
            if (!string.IsNullOrWhiteSpace(simCard.SimCardPlan))
            {
                var normalizedName = simCard.SimCardPlan.Trim().ToLowerInvariant();
                if (!existingSimCardPlans.ContainsKey(normalizedName))
                {
                    var newSimCardPlan = new SimCardPlan
                    {
                        Id = Guid.NewGuid().ToString(),
                        Name = simCard.SimCardPlan.Trim(),
                        Description = "Auto-created from SIM card import",
                        CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc),
                        CreatedBy = "System"
                    };
                    simCardPlansToCreate.Add(newSimCardPlan);
                    existingSimCardPlans[normalizedName] = newSimCardPlan;
                }
            }
        }

        // Bulk create master data
        if (simTypesToCreate.Count > 0)
        {
            _context.SimTypes.AddRange(simTypesToCreate);
        }

        if (simProvidersToCreate.Count > 0)
        {
            _context.SimProviders.AddRange(simProvidersToCreate);
        }

        if (simCardPlansToCreate.Count > 0)
        {
            _context.SimCardPlans.AddRange(simCardPlansToCreate);
        }

        // Save master data first
        if (simTypesToCreate.Count > 0 || simProvidersToCreate.Count > 0 || simCardPlansToCreate.Count > 0)
        {
            await _context.SaveChangesAsync();
        }
    }

    private string? GetMasterDataId<T>(string? name, Dictionary<string, T> existingItems) where T : class
    {
        if (string.IsNullOrWhiteSpace(name))
            return null;

        var normalizedName = name.Trim().ToLowerInvariant();
        if (existingItems.TryGetValue(normalizedName, out var item))
        {
            // Use reflection to get the Id property
            var idProperty = typeof(T).GetProperty("Id");
            return idProperty?.GetValue(item)?.ToString();
        }

        return null;
    }

    private SimCardStatus ParseSimCardStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return SimCardStatus.Active;

        return status.ToLowerInvariant() switch
        {
            "active" => SimCardStatus.Active,
            "inactive" => SimCardStatus.Inactive,
            "suspended" => SimCardStatus.Suspended,
            "expired" => SimCardStatus.Expired,
            _ => SimCardStatus.Active
        };
    }
}
