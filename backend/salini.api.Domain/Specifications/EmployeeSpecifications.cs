using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.Domain.Specifications;

public static class EmployeeSpecifications
{
    public class ActiveEmployees : BaseSpecification<Employee>
    {
        public ActiveEmployees() : base(e => e.Status == Status.Active)
        {
        }
    }

    public class ByProject : BaseSpecification<Employee>
    {
        public ByProject(string projectId) : base(e => e.ProjectId == projectId)
        {
            AddInclude(e => e.Project!);
            AddInclude(e => e.Department!);
            AddInclude(e => e.Company!);
        }
    }

    public class ByDepartment : BaseSpecification<Employee>
    {
        public ByDepartment(string departmentId) : base(e => e.DepartmentId == departmentId)
        {
            AddInclude(e => e.Department!);
            AddInclude(e => e.SubDepartment!);
        }
    }

    public class WithAssets : BaseSpecification<Employee>
    {
        public WithAssets() : base(e => e.EmployeeAssets.Any(ea => ea.Status == AssignmentStatus.Assigned))
        {
            AddInclude(e => e.EmployeeAssets);
            AddInclude("EmployeeAssets.Asset");
        }
    }

    public class ByEmployeeId : BaseSpecification<Employee>
    {
        public ByEmployeeId(string employeeId) : base(e => e.EmployeeId == employeeId)
        {
            AddInclude(e => e.Project!);
            AddInclude(e => e.Department!);
            AddInclude(e => e.Company!);
            AddInclude(e => e.Nationality!);
        }
    }
}
