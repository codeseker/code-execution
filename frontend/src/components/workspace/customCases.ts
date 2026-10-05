/**
 * The caller's own "Custom N" test cases in the workspace.
 *
 * A case has two independent halves: an input the judge always runs, and an
 * optional expected output that turns the case into a graded one. The payload
 * built here is what both `POST /problems/{id}/run` and
 * `POST /problems/{id}/example-eval` accept, so the same state drives both
 * requests.
 */

/** Workspace state for one custom case; `id` never leaves the client. */
export type CustomTestCase = {
  id: string
  input: string
  expectedOutput: string
}

/** Wire shape of one `customTestcases[]` entry. */
export type CustomTestcasePayload = {
  customInput: string
  expectedOutput: string
}

/** A case is sent when it has an input; the expected output stays optional. */
export function isRunnableCustomCase(testCase: CustomTestCase): boolean {
  return testCase.input.trim().length > 0
}

/**
 * The subset of cases that will actually reach the judge, in tab order. The
 * judge numbers them `custom-1..N` in exactly this order, so this same list is
 * what maps a streamed `CASE_RESULT` back onto the tab it belongs to.
 */
export function runnableCustomCases(testCases: CustomTestCase[]): CustomTestCase[] {
  return testCases.filter(isRunnableCustomCase)
}

/** Runnable cases as the request body entries, or null when there are none. */
export function toCustomTestcasePayload(
  testCases: CustomTestCase[],
): CustomTestcasePayload[] | null {
  const runnable = runnableCustomCases(testCases)
  if (runnable.length === 0) return null
  return runnable.map((testCase) => ({
    customInput: testCase.input,
    expectedOutput: testCase.expectedOutput,
  }))
}

/** A blank expected output is normalised to an empty string, never null. */
export function createCustomTestCase(id: string): CustomTestCase {
  return { id, input: '', expectedOutput: '' }
}