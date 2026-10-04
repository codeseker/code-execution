import { LANGUAGES, SUBMISSION_STATUSES, type Language, type SubmissionStatus } from '../../types/domain'
import { languageLabel, submissionStatusLabel } from '../../lib/format'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

export type SubmissionFiltersValue = {
  language: Language | 'ALL'
  status: SubmissionStatus | 'ALL'
}

type Props = {
  value: SubmissionFiltersValue
  onChange: (value: SubmissionFiltersValue) => void
}

/**
 * Language and queue-status filters for `GET /users/me/submissions`. Both are
 * enum query params the backend validates (unknown values are rejected 400),
 * so only real enum members are ever offered.
 */
export default function SubmissionFilters({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Select
        value={value.language}
        onValueChange={(next) => {
          if (next !== null) {
            onChange({ ...value, language: next as SubmissionFiltersValue['language'] })
          }
        }}
      >
        <SelectTrigger className="h-8 w-37.5 text-sm" aria-label="Filter by language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All languages</SelectItem>
          {LANGUAGES.map((language) => (
            <SelectItem key={language} value={language}>
              {languageLabel(language)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.status}
        onValueChange={(next) => {
          if (next !== null) {
            onChange({ ...value, status: next as SubmissionFiltersValue['status'] })
          }
        }}
      >
        <SelectTrigger className="h-8 w-40 text-sm" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {SUBMISSION_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {submissionStatusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}