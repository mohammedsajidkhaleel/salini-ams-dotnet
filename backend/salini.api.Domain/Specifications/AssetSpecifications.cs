using salini.api.Domain.Entities;
using salini.api.Domain.Enums;

namespace salini.api.Domain.Specifications;

public static class AssetSpecifications
{
    public class AvailableAssets : BaseSpecification<Asset>
    {
        public AvailableAssets() : base(a => a.Status == AssetStatus.Available)
        {
            AddInclude(a => a.Item!);
            AddInclude(a => a.Project!);
        }
    }

    public class AssignedAssets : BaseSpecification<Asset>
    {
        public AssignedAssets() : base(a => a.Status == AssetStatus.Assigned)
        {
            AddInclude(a => a.Item!);
            AddInclude(a => a.Project!);
            AddInclude(a => a.EmployeeAssets);
            AddInclude("EmployeeAssets.Employee");
        }
    }

    public class ByProject : BaseSpecification<Asset>
    {
        public ByProject(string projectId) : base(a => a.ProjectId == projectId)
        {
            AddInclude(a => a.Item!);
            AddInclude(a => a.Project!);
        }
    }

    public class ByAssetTag : BaseSpecification<Asset>
    {
        public ByAssetTag(string assetTag) : base(a => a.AssetTag == assetTag)
        {
            AddInclude(a => a.Item!);
            AddInclude(a => a.Project!);
            AddInclude(a => a.EmployeeAssets);
            AddInclude("EmployeeAssets.Employee");
        }
    }

    public class BySerialNumber : BaseSpecification<Asset>
    {
        public BySerialNumber(string serialNumber) : base(a => a.SerialNumber == serialNumber)
        {
            AddInclude(a => a.Item!);
            AddInclude(a => a.Project!);
        }
    }

    public class ByItem : BaseSpecification<Asset>
    {
        public ByItem(string itemId) : base(a => a.ItemId == itemId)
        {
            AddInclude(a => a.Item!);
            AddInclude(a => a.Project!);
        }
    }
}
