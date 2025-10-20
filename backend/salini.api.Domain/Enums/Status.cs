namespace salini.api.Domain.Enums;

public enum Status
{
    Active = 1,
    Inactive = 2
}

public enum AssetStatus
{
    Available = 1,
    Assigned = 2,
    Maintenance = 3,
    Retired = 4
}

public enum AssignmentStatus
{
    Assigned = 1,
    Returned = 2
}

public enum PurchaseOrderStatus
{
    Draft = 1,
    Pending = 2,
    Approved = 3,
    Ordered = 4,
    Received = 5,
    Cancelled = 6
}

public enum SimCardStatus
{
    Active = 1,
    Inactive = 2,
    Suspended = 3,
    Expired = 4
}

public enum SoftwareLicenseStatus
{
    Active = 1,
    Inactive = 2,
    Expired = 3
}
