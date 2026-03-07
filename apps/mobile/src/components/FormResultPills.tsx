import type { FormResult } from './types';

interface FormResultPillsProps {
  results: FormResult[];
  label?: string;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
}

export function FormResultPills({
  results,
  label = 'Recent',
  loading = false,
  loadingText = 'Loading...',
  emptyText = '-',
}: FormResultPillsProps) {
  return (
    <div className="tt-form-recent mt-1">
      <span className="tt-form-recent-label">{label}</span>
      {loading ? (
        <span className="tt-form-recent-empty">{loadingText}</span>
      ) : results.length === 0 ? (
        <span className="tt-form-recent-empty">{emptyText}</span>
      ) : (
        <div className="tt-form-recent-list">
          {results.map((result, index) => (
            <span
              key={`${result}-${index}`}
              className={`tt-form-result-pill ${getFormResultClass(result)}`}
            >
              {result}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function getFormResultClass(result: FormResult): string {
  if (result === 'W') return 'tt-form-result-win';
  if (result === 'L') return 'tt-form-result-loss';
  return 'tt-form-result-draw';
}
