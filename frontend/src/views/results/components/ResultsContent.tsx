import type {
  AnalysisResultViewModel,
  FeedbackState,
  FeedbackDirection,
} from '../../../types/results';
import AnalysisBadge from './AnalysisBadge';
import ResultMeta from './ResultMeta';
import JustificationCard from './JustificationCard';
import AIDisclaimer from './AIDisclaimer';
import FeedbackSection from './FeedbackSection';
import GoToHistoryLink from './GoToHistoryLink';
import ReanalyzeButton from './ReanalyzeButton';

type ResultsContentProps = {
  analysis: AnalysisResultViewModel;
  feedbackState: FeedbackState;
  onSubmitFeedback: (direction: FeedbackDirection) => Promise<void>;
  onReanalyze: () => void;
};

/**
 * ResultsContent Component
 * 
 * Purpose: Wrapper component that orchestrates all result detail components
 * once analysis data is successfully loaded.
 * 
 * This component composes:
 * - AnalysisBadge - recommendation badge with icon
 * - ResultMeta - product and pet metadata
 * - JustificationCard - analysis justification and concerns
 * - AIDisclaimer - disclaimer about AI-generated content
 * - FeedbackSection - feedback buttons and status
 * - ActionRow - navigation actions (history, reanalyze)
 */
const ResultsContent = ({
  analysis,
  feedbackState,
  onSubmitFeedback,
  onReanalyze,
}: ResultsContentProps) => {
  return (
    <article className="space-y-6">
      {/* Recommendation Badge */}
      <div className="flex justify-center">
        <AnalysisBadge recommendation={analysis.recommendation} />
      </div>

      {/* Product and Pet Metadata */}
      <ResultMeta analysis={analysis} />

      {/* Analysis Justification */}
      <JustificationCard
        justification={analysis.justification}
        concerns={analysis.concerns}
      />

      {/* AI Disclaimer */}
      <AIDisclaimer />

      {/* Feedback Section */}
      <FeedbackSection
        feedbackState={feedbackState}
        onSubmitFeedback={onSubmitFeedback}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center items-center pt-4">
        <ReanalyzeButton analysis={analysis} onReanalyze={onReanalyze} />
        <GoToHistoryLink productId={analysis.productId} />
      </div>
    </article>
  );
};

export default ResultsContent;

