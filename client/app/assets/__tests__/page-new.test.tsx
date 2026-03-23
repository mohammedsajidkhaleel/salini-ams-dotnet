import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AssetsPage from '../page-new';
import { assetService } from '@/lib/services';
import { useAuth } from '@/contexts/auth-context-new';
import { toast } from '@/lib/toast';

// Mock dependencies
vi.mock('@/contexts/auth-context-new', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/lib/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@/lib/services', () => ({
    assetService: {
        getAssets: vi.fn().mockResolvedValue({
            items: [],
            pageNumber: 1,
            pageSize: 10,
            totalCount: 0,
            totalPages: 0,
        }),
        updateAsset: vi.fn(),
        createAsset: vi.fn(),
    },
}));

vi.mock('@/lib/errorHandler', () => ({
    ErrorHandler: {
        showError: vi.fn((error) => error.message || 'An error occurred'),
    },
}));

vi.mock('@/components/sidebar', () => ({
    Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('@/components/asset-table', () => ({
    AssetTable: ({ onEdit }: any) => (
        <div data-testid="asset-table">
            <button onClick={() => onEdit({ id: '123', assetTag: 'TAG-123', name: 'Test Asset' })}>
                Edit Asset
            </button>
        </div>
    ),
}));

vi.mock('@/components/asset-form', () => ({
    AssetForm: ({ onSubmit, onCancel }: any) => (
        <form
            data-testid="asset-form"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({
                    name: 'Updated Asset',
                    description: 'Updated Description',
                });
            }}
        >
            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>Cancel</button>
        </form>
    ),
}));

vi.mock('@/components/asset-details', () => ({
    AssetDetails: () => <div data-testid="asset-details">AssetDetails</div>,
}));

vi.mock('@/components/user-header', () => ({
    UserHeader: () => <div data-testid="user-header">UserHeader</div>,
}));

vi.mock('@/components/asset-import-modal', () => ({
    AssetImportModal: () => <div data-testid="asset-import-modal">AssetImportModal</div>,
}));

vi.mock('@/components/ui/confirmation-dialog', () => ({
    ConfirmationDialog: () => <div data-testid="confirmation-dialog">ConfirmationDialog</div>,
}));

vi.mock('@/components/project-filter', () => ({
    ProjectFilter: () => <div data-testid="project-filter">ProjectFilter</div>,
}));

vi.mock('@/components/protected-route', () => ({
    ProtectedRoute: ({ children }: any) => <div>{children}</div>,
}));

describe('AssetsPage - Error Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            user: { role: 'Admin' },
            isAuthenticated: true,
        });
    });

    it('should keep form open and show toast error when update fails', async () => {
        const errorMessage = 'Failed to update asset';
        (assetService.updateAsset as any).mockRejectedValueOnce(new Error(errorMessage));

        const { rerender } = render(<AssetsPage />);

        // Click edit button to open form
        fireEvent.click(screen.getByText('Edit Asset'));

        // Verify form is shown
        expect(screen.getByTestId('asset-form')).toBeInTheDocument();

        // Submit form
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            // Verify error toast was shown
            expect(toast.error).toHaveBeenCalledWith(errorMessage);
        });

        // Verify form is still open (not closed)
        expect(screen.getByTestId('asset-form')).toBeInTheDocument();
    });

    it('should close form and show toast success when update succeeds', async () => {
        (assetService.updateAsset as any).mockResolvedValueOnce({
            id: '123',
            assetTag: 'TAG-123',
            name: 'Updated Asset',
        });

        render(<AssetsPage />);

        // Click edit button to open form
        fireEvent.click(screen.getByText('Edit Asset'));

        // Verify form is shown
        expect(screen.getByTestId('asset-form')).toBeInTheDocument();

        // Submit form
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            // Verify success toast was shown
            expect(toast.success).toHaveBeenCalledWith('Asset TAG-123 updated successfully');
        });

        // Verify form is closed (back to table view)
        await waitFor(() => {
            expect(screen.queryByTestId('asset-form')).not.toBeInTheDocument();
            expect(screen.getByTestId('asset-table')).toBeInTheDocument();
        });
    });

    it('should call updateAsset with id and assetTag when editing an asset', async () => {
        (assetService.updateAsset as any).mockResolvedValueOnce({
            id: '123',
            assetTag: 'TAG-123',
            name: 'Updated Asset',
        });

        render(<AssetsPage />);

        // Click edit button to open form
        fireEvent.click(screen.getByText('Edit Asset'));

        // Submit form
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(assetService.updateAsset).toHaveBeenCalledWith(
                '123',
                expect.objectContaining({
                    id: '123',
                    assetTag: 'TAG-123',
                    name: 'Updated Asset',
                })
            );
        });
    });
});
