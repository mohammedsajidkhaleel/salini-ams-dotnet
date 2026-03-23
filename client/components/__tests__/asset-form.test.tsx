import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AssetForm } from '../asset-form';

// Mock dependencies
vi.mock('@/lib/services/itemService', () => ({
    itemService: {
        getItems: vi.fn().mockResolvedValue({
            items: [{ id: 'item1', name: 'Laptop' }],
        }),
    },
}));

vi.mock('@/lib/services/employeeService', () => ({
    employeeService: {
        getEmployees: vi.fn().mockResolvedValue({
            items: [{ id: 'emp1', employeeId: 'E001', fullName: 'John Doe' }],
        }),
    },
}));

vi.mock('@/lib/services/projectService', () => ({
    ProjectService: {
        getAll: vi.fn().mockResolvedValue([
            { id: 'proj1', name: 'Project Alpha' },
            { id: 'proj2', name: 'Project Beta' },
        ]),
    },
}));

describe('AssetForm - Project Dropdown', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should select project when editing asset with projectId field', async () => {
        const assetWithProjectId = {
            id: '123',
            assetTag: 'TAG-123',
            assetName: 'Test Laptop',
            serialNumber: 'SN123',
            item: 'Laptop',
            assignedEmployee: '',
            projectId: 'proj1', // API returns projectId
            status: 'available' as const,
            condition: 'excellent' as const,
            poNumber: 'PO-001',
            description: 'Test description',
        };

        render(
            <AssetForm
                asset={assetWithProjectId}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Wait for projects to load
        await waitFor(() => {
            const projectSelect = screen.getByLabelText(/project/i) as HTMLSelectElement;
            expect(projectSelect.value).toBe('proj1');
        });
    });

    it('should select project when editing asset with project_id field', async () => {
        const assetWithProjectIdUnderscore = {
            id: '123',
            assetTag: 'TAG-123',
            assetName: 'Test Laptop',
            serialNumber: 'SN123',
            item: 'Laptop',
            assignedEmployee: '',
            project_id: 'proj2', // Alternative field name
            status: 'available' as const,
            condition: 'excellent' as const,
            poNumber: 'PO-001',
            description: 'Test description',
        };

        render(
            <AssetForm
                asset={assetWithProjectIdUnderscore}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Wait for projects to load
        await waitFor(() => {
            const projectSelect = screen.getByLabelText(/project/i) as HTMLSelectElement;
            expect(projectSelect.value).toBe('proj2');
        });
    });

    it('should select project when editing asset with project field', async () => {
        const assetWithProject = {
            id: '123',
            assetTag: 'TAG-123',
            assetName: 'Test Laptop',
            serialNumber: 'SN123',
            item: 'Laptop',
            assignedEmployee: '',
            project: 'proj1', // Direct project field
            status: 'available' as const,
            condition: 'excellent' as const,
            poNumber: 'PO-001',
            description: 'Test description',
        };

        render(
            <AssetForm
                asset={assetWithProject}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        // Wait for projects to load
        await waitFor(() => {
            const projectSelect = screen.getByLabelText(/project/i) as HTMLSelectElement;
            expect(projectSelect.value).toBe('proj1');
        });
    });
});
