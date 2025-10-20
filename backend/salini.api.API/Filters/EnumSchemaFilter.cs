using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.ComponentModel;
using System.Reflection;

namespace salini.api.API.Filters;

public class EnumSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (context.Type.IsEnum)
        {
            var enumValues = Enum.GetValues(context.Type);
            var enumNames = Enum.GetNames(context.Type);
            
            schema.Enum.Clear();
            
            for (int i = 0; i < enumValues.Length; i++)
            {
                var enumValue = enumValues.GetValue(i);
                var enumName = enumNames[i];
                
                // Get description from Description attribute if available
                var field = context.Type.GetField(enumName);
                var description = field?.GetCustomAttribute<DescriptionAttribute>()?.Description ?? enumName;
                
                schema.Enum.Add(new Microsoft.OpenApi.Any.OpenApiString(enumValue?.ToString()));
            }
            
            // Add description for the enum
            var typeDescription = context.Type.GetCustomAttribute<DescriptionAttribute>()?.Description;
            if (!string.IsNullOrEmpty(typeDescription))
            {
                schema.Description = typeDescription;
            }
        }
    }
}
