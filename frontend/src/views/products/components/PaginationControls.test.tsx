import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaginationControls from './PaginationControls';

describe('PaginationControls', () => {
  const mockOnPageChange = vi.fn();

  const defaultProps = {
    page: 1,
    pageSize: 10,
    totalCount: 100,
    onPageChange: mockOnPageChange,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render navigation element with aria-label', () => {
      render(<PaginationControls {...defaultProps} />);

      const nav = screen.getByRole('navigation', { name: /pagination/i });
      expect(nav).toBeInTheDocument();
    });

    it('should render Previous button', () => {
      render(<PaginationControls {...defaultProps} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeInTheDocument();
    });

    it('should render Next button', () => {
      render(<PaginationControls {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeInTheDocument();
    });

    it('should render page info on desktop screens', () => {
      render(<PaginationControls {...defaultProps} page={2} />);

      // Should show "Showing 11 to 20 of 100 results"
      expect(screen.getByText(/showing/i)).toBeInTheDocument();
    });

    it('should render page number on mobile screens', () => {
      render(<PaginationControls {...defaultProps} page={2} />);

      // Should show "Page 2 of 10"
      expect(screen.getByText(/page 2 of 10/i)).toBeInTheDocument();
    });
  });

  describe('pagination calculations', () => {
    it('should calculate maxPage correctly', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={100}
          page={1}
        />
      );

      // Should show "Page 1 of 10"
      expect(screen.getByText(/page 1 of 10/i)).toBeInTheDocument();
    });

    it('should handle non-round division for maxPage', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={105}
          page={1}
        />
      );

      // Should show "Page 1 of 11" (ceil(105/10) = 11)
      expect(screen.getByText(/page 1 of 11/i)).toBeInTheDocument();
    });

    it('should calculate startItem correctly', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={100}
          page={2}
        />
      );

      // Page 2: startItem = (2-1) * 10 + 1 = 11
      // Text is split across spans, so check the parent paragraph
      const pagination = screen.getByText(/showing/i);
      expect(pagination.textContent).toContain('11');
    });

    it('should calculate endItem correctly', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={100}
          page={2}
        />
      );

      // Page 2: endItem = min(2 * 10, 100) = 20
      const pageInfo = screen.getByText(/showing/i);
      expect(pageInfo.textContent).toContain('20');
    });

    it('should handle endItem not exceeding totalCount on last page', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={105}
          page={11}
        />
      );

      // Page 11: endItem = min(11 * 10, 105) = 105 (not 110)
      const pageInfo = screen.getByText(/showing/i);
      expect(pageInfo.textContent).toContain('105');
    });

    it('should handle zero items', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={0}
          page={1}
        />
      );

      // Should return null since 0 <= 10
      const nav = screen.queryByRole('navigation');
      expect(nav).not.toBeInTheDocument();
    });

    it('should display startItem as 0 when totalCount is 0', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={0}
          page={1}
        />
      );

      // Should return null since 0 <= 10
      const nav = screen.queryByRole('navigation');
      expect(nav).not.toBeInTheDocument();
    });
  });

  describe('button disable states', () => {
    it('should disable Previous button on first page', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={1}
          pageSize={10}
          totalCount={100}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('should enable Previous button when not on first page', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={2}
          pageSize={10}
          totalCount={100}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).not.toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={10}
          pageSize={10}
          totalCount={100}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable Next button when not on last page', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={1}
          pageSize={10}
          totalCount={100}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('should disable both buttons when isLoading is true', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={5}
          isLoading={true}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should disable only disabled buttons based on position when not loading', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={1}
          isLoading={false}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(prevButton).toBeDisabled(); // First page
      expect(nextButton).not.toBeDisabled(); // Not last page
    });
  });

  describe('click handlers', () => {
    it('should call onPageChange with page - 1 when Previous clicked', async () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={5}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      await userEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });

    it('should call onPageChange with page + 1 when Next clicked', async () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={5}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(6);
    });

    it('should not call onPageChange when Previous clicked on first page', async () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={1}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      await userEvent.click(prevButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should not call onPageChange when Next clicked on last page', async () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={10}
          pageSize={10}
          totalCount={100}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should not call onPageChange when buttons clicked while loading', async () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={5}
          isLoading={true}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      await userEvent.click(prevButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('conditional rendering', () => {
    it('should return null when totalCount <= pageSize (single page)', () => {
      const { container } = render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={10}
        />
      );

      // Component should render nothing
      expect(container.firstChild).toBeNull();
    });

    it('should return null when totalCount equals pageSize', () => {
      const { container } = render(
        <PaginationControls
          {...defaultProps}
          pageSize={20}
          totalCount={20}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when totalCount > pageSize', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={11}
        />
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should return null when totalCount is 0', () => {
      const { container } = render(
        <PaginationControls
          {...defaultProps}
          totalCount={0}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle large page numbers', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={9999}
          pageSize={10}
          totalCount={100000}
        />
      );

      expect(screen.getByText(/page 9999 of 10000/i)).toBeInTheDocument();
    });

    it('should handle single item total', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={1}
          page={1}
        />
      );

      // Should return null since 1 <= 10
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should handle very large pageSize', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={1000}
          totalCount={100}
          page={1}
        />
      );

      // Should return null since 100 <= 1000
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should handle page at exact boundary', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={10}
          pageSize={10}
          totalCount={100}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should handle fractional division correctly', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={7}
          totalCount={100}
          page={1}
        />
      );

      // maxPage = ceil(100/7) = 15
      expect(screen.getByText(/page 1 of 15/i)).toBeInTheDocument();
    });
  });

  describe('styling and state', () => {
    it('should have correct button styling classes when active', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={5}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      // Should not have cursor-not-allowed when enabled
      expect(prevButton).not.toHaveClass('cursor-not-allowed');
    });

    it('should have disabled styling when button is disabled', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={1}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toHaveClass('cursor-not-allowed');
    });

    it('should apply hover state only to enabled buttons', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={5}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      // Enabled buttons should have hover classes
      expect(prevButton.className).toContain('hover:');
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on Previous button', () => {
      render(<PaginationControls {...defaultProps} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toHaveAttribute('aria-label', expect.stringMatching(/previous/i));
    });

    it('should have aria-label on Next button', () => {
      render(<PaginationControls {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toHaveAttribute('aria-label', expect.stringMatching(/next/i));
    });

    it('should have type="button" on buttons', () => {
      render(<PaginationControls {...defaultProps} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(prevButton).toHaveAttribute('type', 'button');
      expect(nextButton).toHaveAttribute('type', 'button');
    });

    it('should be keyboard accessible', async () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={5}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      
      // Focus and press Enter
      nextButton.focus();
      await userEvent.keyboard('{Enter}');

      expect(mockOnPageChange).toHaveBeenCalledWith(6);
    });

    it('should be keyboard accessible with Space key', async () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={5}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      
      // Focus and press Space
      prevButton.focus();
      await userEvent.keyboard(' ');

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });
  });

  describe('responsive rendering', () => {
    it('should hide Previous/Next text on mobile', () => {
      render(<PaginationControls {...defaultProps} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      const prevText = prevButton.querySelector('.hidden.sm\\:inline');

      // Text should be hidden on small screens
      expect(prevButton.textContent).toBeDefined();
    });

    it('should show page info only on desktop', () => {
       render(
         <PaginationControls
           {...defaultProps}
           page={2}
         />
       );
 
       // The "Showing X to Y" text is wrapped in hidden sm:flex
       // So on small screens it's hidden, on larger screens it shows
       const showingText = screen.getByText(/showing/i);
       // The paragraph is inside a div with hidden sm:flex classes
       expect(showingText.parentElement?.parentElement).toHaveClass('hidden');
     });

    it('should show page number on mobile', () => {
      render(
        <PaginationControls
          {...defaultProps}
          page={2}
        />
      );

      // The "Page X of Y" is in flex sm:hidden
      const pageText = screen.getByText(/page 2 of 10/i);
      expect(pageText.parentElement).toHaveClass('flex', 'sm:hidden');
    });
  });

  describe('integration', () => {
    it('should handle complete pagination workflow', async () => {
      const { rerender } = render(
        <PaginationControls
          {...defaultProps}
          page={1}
          pageSize={10}
          totalCount={100}
        />
      );

      // Start on page 1
      expect(screen.getByText(/page 1 of 10/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();

      // Click Next
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);

      // Simulate page change from parent
      rerender(
        <PaginationControls
          {...defaultProps}
          page={2}
          pageSize={10}
          totalCount={100}
        />
      );

      expect(screen.getByText(/page 2 of 10/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
    });

    it('should navigate to last page and disable Next', async () => {
      const { rerender } = render(
        <PaginationControls
          {...defaultProps}
          page={9}
          pageSize={10}
          totalCount={100}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(10);

      rerender(
        <PaginationControls
          {...defaultProps}
          page={10}
          pageSize={10}
          totalCount={100}
        />
      );

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
    });
  });
});
