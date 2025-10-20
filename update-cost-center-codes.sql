-- Update existing cost centers with proper codes
UPDATE "CostCenters" SET "Code" = 'IT' WHERE "Id" = 'CC_001';
UPDATE "CostCenters" SET "Code" = 'OPS' WHERE "Id" = 'CC_002';
UPDATE "CostCenters" SET "Code" = 'ADMIN' WHERE "Id" = 'CC_003';
