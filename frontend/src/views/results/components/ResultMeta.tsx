import type { AnalysisResultViewModel } from '../../../types/results';
import {
  formatAnalysisDate,
  formatPetSummary,
  isValidUrl,
} from '../../../utils/resultsMappers';

type ResultMetaProps = {
  analysis: AnalysisResultViewModel;
};

/**
 * ResultMeta Component
 * 
 * Purpose: Displays product metadata and pet context information in a structured
 * definition list format.
 * 
 * Features:
 * - Product name with external link (if valid URL)
 * - Product URL
 * - Pet information (species, breed, age)
 * - Additional context information
 * - Analysis timestamp (formatted for readability)
 * - Analysis ID (with copy functionality optional)
 */
const ResultMeta = ({ analysis }: ResultMetaProps) => {
  const petSummary = formatPetSummary(
    analysis.species,
    analysis.breed,
    analysis.age
  );
  const formattedDate = formatAnalysisDate(analysis.createdAt);
  const hasValidUrl = isValidUrl(analysis.productUrl);

  return (
    <div className="rounded-lg border border-brand-secondary/40 bg-gradient-to-br from-white to-brand-secondary/10 p-6 shadow-md">
      <h2 className="text-lg font-semibold text-brand-dark mb-4">
        Product & Pet Details
      </h2>

      <dl className="space-y-4">
        {/* Product Name */}
        <div>
          <dt className="text-sm font-medium text-gray-600">Product Name</dt>
          <dd className="mt-1 text-base text-brand-dark">
            {hasValidUrl ? (
              <a
                href={analysis.productUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:text-brand-primary/80 hover:underline"
              >
                {analysis.productName}
                <svg
                  className="inline-block ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <span className="sr-only">(opens in new tab)</span>
              </a>
            ) : (
              analysis.productName
            )}
          </dd>
        </div>

        {/* Product URL */}
        {analysis.productUrl && (
          <div>
            <dt className="text-sm font-medium text-gray-600">Product URL</dt>
            <dd className="mt-1 text-sm text-gray-700 break-all">
              {hasValidUrl ? (
                <a
                  href={analysis.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary hover:text-brand-primary/80 hover:underline"
                >
                  {analysis.productUrl}
                </a>
              ) : (
                analysis.productUrl
              )}
            </dd>
          </div>
        )}

        {/* Pet Information */}
        <div>
          <dt className="text-sm font-medium text-gray-600">Pet Information</dt>
          <dd className="mt-1 text-base text-brand-dark">{petSummary}</dd>
        </div>

        {/* Additional Info */}
        {analysis.additionalInfo && (
          <div>
            <dt className="text-sm font-medium text-gray-600">
              Additional Context
            </dt>
            <dd className="mt-1 text-sm text-gray-800">
              {analysis.additionalInfo}
            </dd>
          </div>
        )}

        {/* Ingredients Preview */}
        {analysis.ingredientsText && (
          <div>
            <dt className="text-sm font-medium text-gray-600">
              Ingredients Analyzed
            </dt>
            <dd className="mt-1 text-sm text-gray-800">
              <details className="cursor-pointer">
                <summary className="text-brand-primary hover:text-brand-primary/80">
                  View ingredients list
                </summary>
                <div className="mt-2 p-3 bg-brand-secondary/5 rounded border border-brand-secondary/30 text-xs font-mono whitespace-pre-wrap break-words">
                  {analysis.ingredientsText}
                </div>
              </details>
            </dd>
          </div>
        )}

        {/* Analysis Timestamp */}
        <div>
          <dt className="text-sm font-medium text-gray-600">
            Analysis Date
          </dt>
          <dd className="mt-1 text-sm text-gray-700">
            <time dateTime={analysis.createdAt}>{formattedDate}</time>
          </dd>
        </div>

        {/* Analysis ID */}
        <div>
          <dt className="text-sm font-medium text-gray-600">Analysis ID</dt>
          <dd className="mt-1 text-xs text-gray-600 font-mono">
            {analysis.analysisId}
          </dd>
        </div>
      </dl>
    </div>
  );
};

export default ResultMeta;

