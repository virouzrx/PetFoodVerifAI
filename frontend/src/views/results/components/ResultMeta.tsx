import type { AnalysisResultViewModel } from '../../../types/results';
import {
  formatAnalysisDate,
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
  const formattedDate = formatAnalysisDate(analysis.createdAt);
  const hasValidUrl = isValidUrl(analysis.productUrl);
  
  // Format age display
  const formatAge = (age: number | null): string => {
    if (age === null) return 'Not specified';
    return age === 1 ? '1 year old' : `${age} years old`;
  };
  
  // Format species display
  const formatSpecies = (species: string): string => {
    return species.charAt(0).toUpperCase() + species.slice(1).toLowerCase();
  };

  return (
    <div className="rounded-lg border-2 border-brand-accent bg-brand-secondary p-6 shadow-md">
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

        {/* Pet Information - Separated into subsections */}
        <div className="pt-2 border-t border-brand-accent/30">
          <h3 className="text-base font-semibold text-brand-dark mb-3">
            Pet Information
          </h3>
          
          <div className="space-y-3 pl-3">
            {/* Species */}
            <div>
              <dt className="text-sm font-medium text-gray-600">Species</dt>
              <dd className="mt-1 text-base text-brand-dark">
                {formatSpecies(analysis.species)}
              </dd>
            </div>

            {/* Breed */}
            {analysis.breed && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Breed</dt>
                <dd className="mt-1 text-base text-brand-dark">
                  {analysis.breed}
                </dd>
              </div>
            )}

            {/* Age */}
            {analysis.age !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Age</dt>
                <dd className="mt-1 text-base text-brand-dark">
                  {formatAge(analysis.age)}
                </dd>
              </div>
            )}

            {/* Additional Info */}
            {analysis.additionalInfo && (
              <div>
                <dt className="text-sm font-medium text-gray-600">
                  Additional Information
                </dt>
                <dd className="mt-1 text-sm text-gray-800">
                  {analysis.additionalInfo}
                </dd>
              </div>
            )}
          </div>
        </div>

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
                <div className="mt-2 p-3 bg-brand-accent/20 rounded border-2 border-brand-accent text-xs font-mono whitespace-pre-wrap break-words">
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

