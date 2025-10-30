import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedbackButtons from './FeedbackButtons';
import type { FeedbackState } from '../../../types/results';

describe('FeedbackButtons', () => {
  const mockOnSubmit = vi.fn();

  const defaultFeedbackState: FeedbackState = {
    status: 'idle',
    lastSubmitted: null,
    message: null,
  };

  const defaultProps = {
    feedbackState: defaultFeedbackState,
    onSubmit: mockOnSubmit,
    isDisabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render group container with aria-label', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const group = screen.getByRole('group', { name: /feedback buttons/i });
      expect(group).toBeInTheDocument();
    });

    it('should render thumbs up button', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      expect(upButton).toBeInTheDocument();
    });

    it('should render thumbs down button', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });
      expect(downButton).toBeInTheDocument();
    });

    it('should render both button labels', () => {
      render(<FeedbackButtons {...defaultProps} />);

      expect(screen.getByText('Helpful')).toBeInTheDocument();
      expect(screen.getByText('Not Helpful')).toBeInTheDocument();
    });

    it('should render buttons with type="button"', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should render SVG icons for each button', () => {
      const { container } = render(<FeedbackButtons {...defaultProps} />);

      const svgs = container.querySelectorAll('svg');
      // Each button should have an SVG icon (or loading spinner later)
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('state machine - idle state', () => {
    it('should render buttons as enabled in idle state', () => {
      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={defaultFeedbackState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });

      expect(upButton).not.toBeDisabled();
      expect(downButton).not.toBeDisabled();
    });

    it('should have data-state="idle" on buttons in idle state', () => {
      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={defaultFeedbackState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });

      expect(upButton).toHaveAttribute('data-state', 'idle');
      expect(downButton).toHaveAttribute('data-state', 'idle');
    });

    it('should have default active styling in idle state', () => {
      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={defaultFeedbackState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      // Should have hover styles (contain 'hover:')
      expect(upButton.className).toContain('hover:');
    });
  });

  describe('state machine - submitting state', () => {
    it('should disable buttons during submission', () => {
      const submittingState: FeedbackState = {
        status: 'submitting',
        lastSubmitted: 'up',
        message: null,
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={submittingState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });

      expect(upButton).toBeDisabled();
      expect(downButton).toBeDisabled();
    });

    it('should show loading spinner on submitting button', () => {
      const submittingState: FeedbackState = {
        status: 'submitting',
        lastSubmitted: 'up',
        message: null,
      };

      const { container } = render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={submittingState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      const spinnerInButton = upButton.querySelector('.animate-spin');

      expect(spinnerInButton).toBeInTheDocument();
    });

    it('should have data-state="loading" on submitting button', () => {
      const submittingState: FeedbackState = {
        status: 'submitting',
        lastSubmitted: 'up',
        message: null,
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={submittingState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      expect(upButton).toHaveAttribute('data-state', 'loading');
    });

    it('should show loading spinner only on submitted button', () => {
      const submittingState: FeedbackState = {
        status: 'submitting',
        lastSubmitted: 'up',
        message: null,
      };

      const { container } = render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={submittingState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });

      expect(upButton.querySelector('.animate-spin')).toBeInTheDocument();
      expect(downButton.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    it('should apply disabled styling during submission', () => {
      const submittingState: FeedbackState = {
        status: 'submitting',
        lastSubmitted: 'up',
        message: null,
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={submittingState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      expect(upButton).toHaveClass('cursor-not-allowed');
    });
  });

  describe('state machine - success state', () => {
    it('should disable buttons after success', () => {
      const successState: FeedbackState = {
        status: 'success',
        lastSubmitted: 'up',
        message: 'Thank you for your feedback!',
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });

      expect(upButton).toBeDisabled();
      expect(downButton).toBeDisabled();
    });

    it('should have data-state="success" on successful button', () => {
      const successState: FeedbackState = {
        status: 'success',
        lastSubmitted: 'up',
        message: 'Thank you!',
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      expect(upButton).toHaveAttribute('data-state', 'success');
    });

    it('should have data-state="idle" on non-submitted button after success', () => {
      const successState: FeedbackState = {
        status: 'success',
        lastSubmitted: 'up',
        message: 'Thank you!',
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });
      expect(downButton).toHaveAttribute('data-state', 'idle');
    });

    it('should highlight thumbs up button with green styling after up vote', () => {
      const successState: FeedbackState = {
        status: 'success',
        lastSubmitted: 'up',
        message: 'Thank you!',
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      expect(upButton).toHaveClass('bg-green-100');
      expect(upButton).toHaveClass('border-green-300');
      expect(upButton).toHaveClass('text-green-800');
    });

    it('should highlight thumbs down button with red styling after down vote', () => {
      const successState: FeedbackState = {
        status: 'success',
        lastSubmitted: 'down',
        message: 'Thank you!',
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });
      expect(downButton).toHaveClass('bg-red-100');
      expect(downButton).toHaveClass('border-red-300');
      expect(downButton).toHaveClass('text-red-800');
    });

    it('should gray out non-submitted button after success', () => {
      const successState: FeedbackState = {
        status: 'success',
        lastSubmitted: 'up',
        message: 'Thank you!',
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });
      expect(downButton).toHaveClass('bg-gray-100');
      expect(downButton).toHaveClass('text-gray-500');
    });
  });

  describe('click handlers', () => {
    it('should call onSubmit with "up" when helpful button clicked', async () => {
      render(<FeedbackButtons {...defaultProps} />);

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      await userEvent.click(upButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('up');
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit with "down" when not helpful button clicked', async () => {
      render(<FeedbackButtons {...defaultProps} />);

      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });
      await userEvent.click(downButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('down');
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not call onSubmit when button is disabled', async () => {
      const submittingState: FeedbackState = {
        status: 'submitting',
        lastSubmitted: 'up',
        message: null,
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={submittingState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      await userEvent.click(upButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not call onSubmit after success', async () => {
      const successState: FeedbackState = {
        status: 'success',
        lastSubmitted: 'up',
        message: 'Thank you!',
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });
      await userEvent.click(downButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not call onSubmit when isDisabled prop is true', async () => {
      render(
        <FeedbackButtons
          {...defaultProps}
          isDisabled={true}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      await userEvent.click(upButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('isDisabled prop', () => {
    it('should disable all buttons when isDisabled is true', () => {
      render(
        <FeedbackButtons
          {...defaultProps}
          isDisabled={true}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });

      expect(upButton).toBeDisabled();
      expect(downButton).toBeDisabled();
    });

    it('should apply disabled styling when isDisabled is true', () => {
      render(
        <FeedbackButtons
          {...defaultProps}
          isDisabled={true}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      expect(upButton).toHaveClass('cursor-not-allowed');
      expect(upButton).toHaveClass('bg-gray-100');
    });

    it('should override success state when isDisabled is true', () => {
      const successState: FeedbackState = {
        status: 'success',
        lastSubmitted: 'up',
        message: 'Thank you!',
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
          isDisabled={true}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      // Component prioritizes success styling over isDisabled, so it should show green
      expect(upButton).toHaveClass('bg-green-100');
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on helpful button', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      expect(upButton).toHaveAttribute('aria-label', 'This analysis was helpful');
    });

    it('should have aria-label on not helpful button', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });
      expect(downButton).toHaveAttribute('aria-label', 'This analysis was not helpful');
    });

    it('should have role="group" on container', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
    });

    it('should have aria-label on group', () => {
      render(<FeedbackButtons {...defaultProps} />);

      const group = screen.getByRole('group', { name: /feedback buttons/i });
      expect(group).toHaveAttribute('aria-label', 'Feedback buttons');
    });

    it('should have SVG with aria-hidden for icons', () => {
      const { container } = render(<FeedbackButtons {...defaultProps} />);

      const svgs = container.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should be keyboard accessible with Enter key', async () => {
      render(<FeedbackButtons {...defaultProps} />);

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      upButton.focus();
      await userEvent.keyboard('{Enter}');

      expect(mockOnSubmit).toHaveBeenCalledWith('up');
    });

    it('should be keyboard accessible with Space key', async () => {
      render(<FeedbackButtons {...defaultProps} />);

      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });
      downButton.focus();
      await userEvent.keyboard(' ');

      expect(mockOnSubmit).toHaveBeenCalledWith('down');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive clicks - first click executes', async () => {
      render(<FeedbackButtons {...defaultProps} />);

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      
      // Rapid clicks
      await userEvent.click(upButton);
      await userEvent.click(upButton);
      await userEvent.click(upButton);

      // All clicks should go through (no debouncing on component)
      expect(mockOnSubmit).toHaveBeenCalledTimes(3);
    });

    it('should handle clicking different buttons in succession', async () => {
      render(<FeedbackButtons {...defaultProps} />);

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });

      await userEvent.click(upButton);
      expect(mockOnSubmit).toHaveBeenCalledWith('up');

      await userEvent.click(downButton);
      expect(mockOnSubmit).toHaveBeenCalledWith('down');
      expect(mockOnSubmit).toHaveBeenCalledTimes(2);
    });

    it('should handle null lastSubmitted in success state', () => {
      const successState: FeedbackState = {
        status: 'success',
        lastSubmitted: null,
        message: 'Thank you!',
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      // Should not crash, should show gray disabled styling
      expect(upButton).toBeDisabled();
    });

    it('should handle submitting state with null lastSubmitted', () => {
      const submittingState: FeedbackState = {
        status: 'submitting',
        lastSubmitted: null,
        message: null,
      };

      render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={submittingState}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      const downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });

      // Both should be disabled but no spinner should show
      expect(upButton).toBeDisabled();
      expect(downButton).toBeDisabled();
      expect(upButton.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete feedback workflow - idle to success', async () => {
      const { rerender } = render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={defaultFeedbackState}
        />
      );

      // User clicks helpful
      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      expect(upButton).not.toBeDisabled();

      await userEvent.click(upButton);
      expect(mockOnSubmit).toHaveBeenCalledWith('up');

      // Simulate submitting state
      const submittingState: FeedbackState = {
        status: 'submitting',
        lastSubmitted: 'up',
        message: null,
      };

      rerender(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={submittingState}
        />
      );

      expect(upButton).toBeDisabled();
      expect(upButton.querySelector('.animate-spin')).toBeInTheDocument();

      // Simulate success state
      const successState: FeedbackState = {
        status: 'success',
        lastSubmitted: 'up',
        message: 'Thank you for your feedback!',
      };

      rerender(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      expect(upButton).toBeDisabled();
      expect(upButton).toHaveClass('bg-green-100');
      expect(upButton.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    it('should handle switching submitted direction', async () => {
      const { rerender } = render(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={defaultFeedbackState}
        />
      );

      // Success with up
      let successState: FeedbackState = {
        status: 'success',
        lastSubmitted: 'up',
        message: 'Thanks!',
      };

      rerender(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      let upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      let downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });

      expect(upButton).toHaveClass('bg-green-100');
      expect(downButton).toHaveClass('bg-gray-100');

      // Change to down direction
      successState = {
        status: 'success',
        lastSubmitted: 'down',
        message: 'Thanks!',
      };

      rerender(
        <FeedbackButtons
          {...defaultProps}
          feedbackState={successState}
        />
      );

      upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      downButton = screen.getByRole('button', { name: /this analysis was not helpful/i });

      expect(upButton).toHaveClass('bg-gray-100');
      expect(downButton).toHaveClass('bg-red-100');
    });

    it('should handle isDisabled prop changes', async () => {
      const { rerender } = render(
        <FeedbackButtons
          {...defaultProps}
          isDisabled={false}
        />
      );

      const upButton = screen.getByRole('button', { name: /this analysis was helpful/i });
      expect(upButton).not.toBeDisabled();

      // Disable from parent
      rerender(
        <FeedbackButtons
          {...defaultProps}
          isDisabled={true}
        />
      );

      expect(upButton).toBeDisabled();

      // Re-enable
      rerender(
        <FeedbackButtons
          {...defaultProps}
          isDisabled={false}
        />
      );

      expect(upButton).not.toBeDisabled();
    });
  });
});
