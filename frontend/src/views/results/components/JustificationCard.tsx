import type { IngredientConcern } from '../../../types/results';

type JustificationCardProps = {
  justification: string;
  concerns: IngredientConcern[];
};

/**
 * JustificationCard Component
 * 
 * Purpose: Displays the AI-generated justification for the recommendation and
 * any specific ingredient concerns identified.
 * 
 * Features:
 * - Main justification text in readable format
 * - Optional list of ingredient concerns (questionable/unacceptable)
 * - Color-coded concern badges
 * - Semantic HTML structure
 * - Fallback message if justification is empty
 */
const JustificationCard = ({
  justification,
  concerns,
}: JustificationCardProps) => {
  const hasConcerns = concerns && concerns.length > 0;

  return (
    <section
      className="rounded-lg border-2 border-brand-accent bg-brand-secondary p-6 shadow-md"
      aria-labelledby="justification-heading"
    >
      <h2
        id="justification-heading"
        className="text-lg font-semibold text-brand-dark mb-3"
      >
        Analysis Justification
      </h2>

      {/* Main Justification Text */}
      <div className="prose prose-slate max-w-none">
        <p className="text-gray-800 leading-relaxed">
          {justification || 'No justification provided.'}
        </p>
      </div>

      {/* Ingredient Concerns */}
      {hasConcerns && (
        <div className="mt-6">
          <h3 className="text-base font-semibold text-brand-dark mb-3">
            Ingredient Concerns
          </h3>
          <ul className="space-y-3" role="list">
            {concerns.map((concern, index) => {
              const isUnacceptable = concern.type === 'unacceptable';
              const badgeColor = isUnacceptable
                ? 'bg-red-700 text-white border-red-900 shadow-lg'
                : 'bg-amber-600 text-white border-amber-900 shadow-lg';

              return (
                <li
                  key={index}
                  className="border-l-4 border-gray-300 pl-4 py-2"
                >
                  <div className="flex items-start gap-2">
                    {/* Concern Type Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${badgeColor}`}
                    >
                      {isUnacceptable ? 'Unacceptable' : 'Questionable'}
                    </span>

                    {/* Ingredient Name */}
                    <div className="flex-1">
                      <p className="font-medium text-brand-dark">
                        {concern.ingredient}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {concern.reason}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};

export default JustificationCard;

