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
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="justification-heading"
    >
      <h2
        id="justification-heading"
        className="text-lg font-semibold text-slate-900 mb-3"
      >
        Analysis Justification
      </h2>

      {/* Main Justification Text */}
      <div className="prose prose-slate max-w-none">
        <p className="text-slate-700 leading-relaxed">
          {justification || 'No justification provided.'}
        </p>
      </div>

      {/* Ingredient Concerns */}
      {hasConcerns && (
        <div className="mt-6">
          <h3 className="text-base font-semibold text-slate-900 mb-3">
            Ingredient Concerns
          </h3>
          <ul className="space-y-3" role="list">
            {concerns.map((concern, index) => {
              const isUnacceptable = concern.type === 'unacceptable';
              const badgeColor = isUnacceptable
                ? 'bg-red-100 text-red-800 border-red-300'
                : 'bg-amber-100 text-amber-800 border-amber-300';

              return (
                <li
                  key={index}
                  className="border-l-4 border-slate-300 pl-4 py-2"
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
                      <p className="font-medium text-slate-900">
                        {concern.ingredient}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
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

