using AutoMapper;
using salini.api.Application.DTOs.Accessory;
using salini.api.Application.DTOs.Asset;
using salini.api.Application.DTOs.Company;
using salini.api.Application.DTOs.CostCenter;
using salini.api.Application.DTOs.Department;
using salini.api.Application.DTOs.Employee;
using salini.api.Application.DTOs.EmployeeCategory;
using salini.api.Application.DTOs.EmployeePosition;
using salini.api.Application.DTOs.Item;
using salini.api.Application.DTOs.ItemCategory;
using salini.api.Application.DTOs.Nationality;
using salini.api.Application.DTOs.Project;
using salini.api.Application.DTOs.PurchaseOrder;
using salini.api.Application.DTOs.SimCard;
using salini.api.Application.DTOs.SimCardPlan;
using salini.api.Application.DTOs.SimProvider;
using salini.api.Application.DTOs.SimType;
using salini.api.Application.DTOs.SoftwareLicense;
using salini.api.Application.DTOs.SubDepartment;
using salini.api.Application.DTOs.Supplier;
using salini.api.Application.DTOs.User;
using salini.api.Domain.Entities;

namespace salini.api.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Company mappings
        CreateMap<Company, CompanyDto>();
        CreateMap<Company, CompanyListDto>();
        
        // Employee mappings
        CreateMap<Employee, EmployeeDto>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
            .ForMember(dest => dest.NationalityName, opt => opt.MapFrom(src => src.Nationality != null ? src.Nationality.Name : null))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null))
            .ForMember(dest => dest.SubDepartmentName, opt => opt.MapFrom(src => src.SubDepartment != null ? src.SubDepartment.Name : null))
            .ForMember(dest => dest.EmployeeCategoryName, opt => opt.MapFrom(src => src.EmployeeCategory != null ? src.EmployeeCategory.Name : null))
            .ForMember(dest => dest.EmployeePositionName, opt => opt.MapFrom(src => src.EmployeePosition != null ? src.EmployeePosition.Name : null))
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : null))
            .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Company != null ? src.Company.Name : null))
            .ForMember(dest => dest.CostCenterName, opt => opt.MapFrom(src => src.CostCenter != null ? src.CostCenter.Name : null));
            
        CreateMap<Employee, EmployeeListDto>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null))
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : null))
            .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Company != null ? src.Company.Name : null))
            .ForMember(dest => dest.AssetCount, opt => opt.MapFrom(src => src.EmployeeAssets.Count))
            .ForMember(dest => dest.SimCardCount, opt => opt.MapFrom(src => src.EmployeeSimCards.Count))
            .ForMember(dest => dest.SoftwareLicenseCount, opt => opt.MapFrom(src => src.EmployeeSoftwareLicenses.Count));
        
        // Asset mappings
        CreateMap<Asset, AssetDto>()
            .ForMember(dest => dest.ItemName, opt => opt.MapFrom(src => src.Item != null ? src.Item.Name : null))
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : null));
        CreateMap<Asset, AssetListDto>()
            .ForMember(dest => dest.ItemName, opt => opt.MapFrom(src => src.Item != null ? src.Item.Name : null))
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : null));
        
        // Item mappings
        CreateMap<Item, ItemDto>();
        CreateMap<Item, ItemListDto>();
        
        // Department mappings
        CreateMap<Department, DepartmentDto>();
        CreateMap<Department, DepartmentListDto>();
        
        // Project mappings
        CreateMap<Project, ProjectDto>();
        CreateMap<Project, ProjectListDto>();
        
        // SIM Card mappings
        CreateMap<SimCard, SimCardDto>()
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : null))
            .ForMember(dest => dest.SimTypeName, opt => opt.MapFrom(src => src.SimType != null ? src.SimType.Name : null))
            .ForMember(dest => dest.SimCardPlanName, opt => opt.MapFrom(src => src.SimCardPlan != null ? src.SimCardPlan.Name : null))
            .ForMember(dest => dest.SimProviderName, opt => opt.MapFrom(src => src.SimProvider != null ? src.SimProvider.Name : null));
        CreateMap<SimCard, SimCardListDto>()
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : null))
            .ForMember(dest => dest.SimTypeName, opt => opt.MapFrom(src => src.SimType != null ? src.SimType.Name : null))
            .ForMember(dest => dest.SimCardPlanName, opt => opt.MapFrom(src => src.SimCardPlan != null ? src.SimCardPlan.Name : null))
            .ForMember(dest => dest.SimProviderName, opt => opt.MapFrom(src => src.SimProvider != null ? src.SimProvider.Name : null));
        
        // Software License mappings
        CreateMap<SoftwareLicense, SoftwareLicenseDto>()
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : null));
        CreateMap<SoftwareLicense, SoftwareLicenseListDto>()
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : null));
        
        // Accessory mappings
        CreateMap<Accessory, AccessoryDto>();
        CreateMap<Accessory, AccessoryListDto>();
        
        // Cost Center mappings
        CreateMap<CostCenter, CostCenterDto>();
        CreateMap<CostCenter, CostCenterListDto>();
        
        // Nationality mappings
        CreateMap<Nationality, NationalityDto>();
        CreateMap<Nationality, NationalityListDto>();
        
        // Sub Department mappings
        CreateMap<SubDepartment, SubDepartmentDto>()
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null));
        CreateMap<SubDepartment, SubDepartmentListDto>()
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null));
        
        // Employee Category mappings
        CreateMap<EmployeeCategory, EmployeeCategoryDto>();
        CreateMap<EmployeeCategory, EmployeeCategoryListDto>();
        
        // Employee Position mappings
        CreateMap<EmployeePosition, EmployeePositionDto>();
        CreateMap<EmployeePosition, EmployeePositionListDto>();
        
        // Item Category mappings
        CreateMap<ItemCategory, ItemCategoryDto>();
        CreateMap<ItemCategory, ItemCategoryListDto>();
        
        // SIM Provider mappings
        CreateMap<SimProvider, SimProviderDto>();
        CreateMap<SimProvider, SimProviderListDto>();
        
        // SIM Type mappings
        CreateMap<SimType, SimTypeDto>();
        CreateMap<SimType, SimTypeListDto>();
        
        // SIM Card Plan mappings
        CreateMap<SimCardPlan, SimCardPlanDto>()
            .ForMember(dest => dest.ProviderName, opt => opt.MapFrom(src => src.Provider != null ? src.Provider.Name : null));
        CreateMap<SimCardPlan, SimCardPlanListDto>()
            .ForMember(dest => dest.ProviderName, opt => opt.MapFrom(src => src.Provider != null ? src.Provider.Name : null));
        
        // Supplier mappings
        CreateMap<Supplier, SupplierDto>();
        CreateMap<Supplier, SupplierListDto>();
        
        // Purchase Order mappings
        CreateMap<PurchaseOrder, PurchaseOrderDto>()
            .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier != null ? src.Supplier.Name : null))
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : null))
            .ForMember(dest => dest.RequestedByName, opt => opt.MapFrom(src => src.RequestedBy != null ? $"{src.RequestedBy.FirstName} {src.RequestedBy.LastName}" : null));
        CreateMap<PurchaseOrder, PurchaseOrderListDto>()
            .ForMember(dest => dest.SupplierName, opt => opt.MapFrom(src => src.Supplier != null ? src.Supplier.Name : null))
            .ForMember(dest => dest.ProjectName, opt => opt.MapFrom(src => src.Project != null ? src.Project.Name : null))
            .ForMember(dest => dest.RequestedByName, opt => opt.MapFrom(src => src.RequestedBy != null ? $"{src.RequestedBy.FirstName} {src.RequestedBy.LastName}" : null));
        
        // Purchase Order Item mappings
        CreateMap<PurchaseOrderItem, PurchaseOrderItemDto>()
            .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.Quantity * src.UnitPrice));
        
        // User mappings
        CreateMap<ApplicationUser, UserDto>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}".Trim()))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));
        CreateMap<ApplicationUser, UserListDto>()
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}".Trim()))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));
    }
}
