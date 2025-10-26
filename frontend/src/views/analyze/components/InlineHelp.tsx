type InlineHelpProps = {
  className?: string;
};

/**
 * InlineHelp Component
 * 
 * Purpose: Provide static guidance on acceptable product URLs, privacy notice, 
 * and explain scraping fallback.
 * 
 * Elements: Heading, short paragraphs, list of tips, info icon styled with Tailwind
 * Accessibility: role="note", screen-reader friendly with ordered focus placement
 */
const InlineHelp = ({ className = "" }: InlineHelpProps) => {
  return (
    <div
      className={`rounded-lg border border-blue-200 bg-blue-50 p-4 ${className}`}
      role="note"
      aria-label="Help information"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900">
            How Product Analysis Works
          </h3>
          <div className="mt-2 text-sm text-blue-800">
            <p className="mb-3">
              We'll attempt to automatically retrieve ingredient information from the 
              product URL you provide. If automatic scraping isn't possible, you'll 
              have the option to enter ingredients manually.
            </p>
            
            <h4 className="font-medium mb-2">Tips for best results:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Use product URLs from supported retailers (e.g., Chewy.com, Amazon)
              </li>
              <li>
                Ensure the URL points to a specific product page, not a category listing
              </li>
              <li>
                Double-check that the product name matches what appears on the store listing
              </li>
              <li>
                For manual entry, copy ingredients exactly as listed on the product packaging
              </li>
            </ul>

            <p className="mt-3 text-xs">
              <strong>Privacy Notice:</strong> We collect product and pet details only 
              to provide analysis recommendations. Your data is stored securely and not 
              shared with third parties. See our privacy policy for more information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineHelp;

