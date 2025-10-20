-- Manual script to apply the asset table migration
-- Run this in your Supabase SQL editor if the migration hasn't been applied yet

-- Add assigned_to column to store employee assignment (optional foreign key to employees table)
alter table public.assets 
add column if not exists assigned_to text references public.employees(id);

-- Add serial_number column for asset serial numbers
alter table public.assets 
add column if not exists serial_number text; 

-- Add category column to store item category/type
alter table public.assets 
add column if not exists category text;

-- Add condition column to track asset condition
alter table public.assets 
add column if not exists condition text check (condition in ('excellent','good','fair','poor')) default 'excellent';

-- Add comments for the new columns
comment on column public.assets.assigned_to is 'Employee ID assigned to this asset (optional foreign key to employees table)';
comment on column public.assets.serial_number is 'Serial number of the asset';
comment on column public.assets.category is 'Category/type of the asset';
comment on column public.assets.condition is 'Physical condition of the asset';

-- Create indexes for better performance
create index if not exists idx_assets_assigned_to on public.assets(assigned_to);
create index if not exists idx_assets_serial_number on public.assets(serial_number);
create index if not exists idx_assets_category on public.assets(category);

-- Update the table comment to reflect the new structure
comment on table public.assets is 'IT assets with assignment tracking and condition monitoring';
