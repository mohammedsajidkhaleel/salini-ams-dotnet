using Microsoft.EntityFrameworkCore;
using salini.api.Application.Common.Interfaces;
using salini.api.Domain.Entities;
using salini.api.Domain.Enums;
using salini.api.Infrastructure.Data;

namespace salini.api.Infrastructure.Repositories;

public class SimCardRepository : BaseRepository<SimCard>, ISimCardRepository
{
    public SimCardRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<SimCard?> GetBySimAccountNoAsync(string simAccountNo, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sc => sc.Project)
            .Include(sc => sc.SimType)
            .Include(sc => sc.SimCardPlan)
            .Include(sc => sc.SimProvider)
            .Include(sc => sc.EmployeeSimCards.Where(esc => esc.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esc => esc.Employee)
            .FirstOrDefaultAsync(sc => sc.SimAccountNo == simAccountNo, cancellationToken);
    }

    public async Task<SimCard?> GetBySimServiceNoAsync(string simServiceNo, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sc => sc.Project)
            .Include(sc => sc.SimType)
            .Include(sc => sc.SimCardPlan)
            .Include(sc => sc.SimProvider)
            .Include(sc => sc.EmployeeSimCards.Where(esc => esc.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esc => esc.Employee)
            .FirstOrDefaultAsync(sc => sc.SimServiceNo == simServiceNo, cancellationToken);
    }

    public async Task<SimCard?> GetBySimSerialNoAsync(string simSerialNo, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sc => sc.Project)
            .Include(sc => sc.SimType)
            .Include(sc => sc.SimCardPlan)
            .Include(sc => sc.SimProvider)
            .Include(sc => sc.EmployeeSimCards.Where(esc => esc.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esc => esc.Employee)
            .FirstOrDefaultAsync(sc => sc.SimSerialNo == simSerialNo, cancellationToken);
    }

    public async Task<IEnumerable<SimCard>> GetByProjectAsync(string projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sc => sc.Project)
            .Include(sc => sc.SimType)
            .Include(sc => sc.SimCardPlan)
            .Include(sc => sc.SimProvider)
            .Include(sc => sc.EmployeeSimCards.Where(esc => esc.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esc => esc.Employee)
            .Where(sc => sc.ProjectId == projectId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<SimCard>> GetByStatusAsync(SimCardStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sc => sc.Project)
            .Include(sc => sc.SimType)
            .Include(sc => sc.SimCardPlan)
            .Include(sc => sc.SimProvider)
            .Include(sc => sc.EmployeeSimCards.Where(esc => esc.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esc => esc.Employee)
            .Where(sc => sc.SimStatus == status)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<SimCard>> GetBySimProviderAsync(string simProviderId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sc => sc.Project)
            .Include(sc => sc.SimType)
            .Include(sc => sc.SimCardPlan)
            .Include(sc => sc.SimProvider)
            .Include(sc => sc.EmployeeSimCards.Where(esc => esc.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esc => esc.Employee)
            .Where(sc => sc.SimProviderId == simProviderId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<SimCard>> GetBySimTypeAsync(string simTypeId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sc => sc.Project)
            .Include(sc => sc.SimType)
            .Include(sc => sc.SimCardPlan)
            .Include(sc => sc.SimProvider)
            .Include(sc => sc.EmployeeSimCards.Where(esc => esc.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esc => esc.Employee)
            .Where(sc => sc.SimTypeId == simTypeId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<SimCard>> GetBySimCardPlanAsync(string simCardPlanId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(sc => sc.Project)
            .Include(sc => sc.SimType)
            .Include(sc => sc.SimCardPlan)
            .Include(sc => sc.SimProvider)
            .Include(sc => sc.EmployeeSimCards.Where(esc => esc.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esc => esc.Employee)
            .Where(sc => sc.SimCardPlanId == simCardPlanId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<SimCard>> GetActiveSimCardsAsync(CancellationToken cancellationToken = default)
    {
        return await GetByStatusAsync(SimCardStatus.Active, cancellationToken);
    }

    public async Task<bool> SimAccountNoExistsAsync(string simAccountNo, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(sc => sc.SimAccountNo == simAccountNo, cancellationToken);
    }

    public async Task<bool> SimServiceNoExistsAsync(string simServiceNo, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(sc => sc.SimServiceNo == simServiceNo, cancellationToken);
    }

    public async Task<bool> SimSerialNoExistsAsync(string simSerialNo, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(sc => sc.SimSerialNo == simSerialNo, cancellationToken);
    }

    public async Task<IEnumerable<SimCard>> SearchSimCardsAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .Include(sc => sc.Project)
            .Include(sc => sc.SimType)
            .Include(sc => sc.SimCardPlan)
            .Include(sc => sc.SimProvider)
            .Include(sc => sc.EmployeeSimCards.Where(esc => esc.Status == Domain.Enums.AssignmentStatus.Assigned))
                .ThenInclude(esc => esc.Employee)
            .Where(sc => 
                sc.SimAccountNo.ToLower().Contains(term) ||
                sc.SimServiceNo.ToLower().Contains(term) ||
                (sc.SimSerialNo != null && sc.SimSerialNo.ToLower().Contains(term)) ||
                (sc.AssignedTo != null && sc.AssignedTo.ToLower().Contains(term)))
            .ToListAsync(cancellationToken);
    }
}
