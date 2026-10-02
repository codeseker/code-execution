/**
 * Dummy data for the whole CodeForge demo.
 * Every screen is populated from here so the app is fully navigable offline.
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type ProblemStatus = 'solved' | 'attempted' | 'todo'

export type Example = {
  input: string
  output: string
  notes?: string
}

export type ProblemDetail = {
  paragraphs: string[]
  examples: Example[]
  constraints: string[]
  followUp?: string
}

export type Problem = {
  id: string
  num: number
  title: string
  difficulty: Difficulty
  acceptance: number
  tags: string[]
  topicTone: Record<string, string>
  companies: string[]
  status: ProblemStatus
  daily?: boolean
  detail?: ProblemDetail
}

/** Notion tag tones used for topic tags (rotate blue/purple/pink/brown/gray). */
const TONE: Record<string, string> = {
  Array: 'blue',
  'Hash Table': 'purple',
  'Linked List': 'pink',
  Design: 'brown',
  Recursion: 'gray',
  String: 'blue',
  Stack: 'purple',
  Sorting: 'brown',
  'Two Pointers': 'pink',
  'Sliding Window': 'blue',
  'DFS / BFS': 'green',
  'Dynamic Programming': 'orange',
  Math: 'gray',
  Heap: 'purple',
  Graph: 'green',
  Greedy: 'yellow',
  Backtracking: 'pink',
  Tree: 'green',
  'Binary Search': 'blue',
  Matrix: 'purple',
  'Bit Manipulation': 'brown',
  'Interval': 'orange',
  Trie: 'gray',
}

export const DIFFICULTY_TONE: Record<Difficulty, string> = {
  Easy: 'green',
  Medium: 'yellow',
  Hard: 'red',
}

function tones(tags: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const t of tags) out[t] = TONE[t] ?? 'gray'
  return out
}

const TWO_SUM: ProblemDetail = {
  paragraphs: [
    'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
    'You may assume that each input would have **exactly one solution**, and you may not use the same element twice.',
    'You can return the answer in any order.',
  ],
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      notes: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    { input: 'nums = [3,3], target = 6', output: '[0,1]' },
  ],
  constraints: [
    '2 <= nums.length <= 10⁴',
    '-10⁹ <= nums[i] <= 10⁹',
    '-10⁹ <= target <= 10⁹',
    'Only one valid answer exists.',
  ],
  followUp: 'Can you come up with an algorithm that is less than O(n²) time complexity?',
}

const LRU_CACHE: ProblemDetail = {
  paragraphs: [
    'Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache`**.',
    'Implement the `LRUCache` class with `get(key)` and `put(key, value)` operations, both running in **O(1)** average time complexity.',
  ],
  examples: [
    {
      input: 'LRUCache(2); put(1,1); put(2,2); get(1); put(3,3); get(2)',
      output: '1\n-1',
      notes: 'Key 2 is evicted because it was the least recently used.',
    },
  ],
  constraints: ['1 <= capacity <= 3000', '0 <= key <= 10⁴', 'At most 2 * 10⁵ calls will be made to get and put.'],
  followUp: 'Could you do both operations in O(1) time complexity?',
}

function genericDetail(p: Problem): ProblemDetail {
  const tagList = p.tags.slice(0, 2).join(', ')
  return {
    paragraphs: [
      `Given the problem constraints for **${p.title}**, design an efficient solution that follows the expected input and output contract below.`,
      `This problem is tagged with ${tagList} and appears regularly in ${p.companies[0] ?? 'top-tier'} interviews. Aim for the optimal complexity bound before reaching for auxiliary data structures.`,
      'Return the result in the exact format shown in the examples — the judge compares your output byte-for-byte after normalisation.',
    ],
    examples: [
      { input: 'nums = [2,1,3,4], target = 5', output: '[0,2]', notes: 'The first and third elements sum to the target.' },
      { input: 'nums = [1,1,1], target = 2', output: '[0,1]' },
    ],
    constraints: [
      '2 <= nums.length <= 10⁴',
      '-10⁹ <= nums[i] <= 10⁹',
      'The answer is guaranteed to be unique.',
    ],
    followUp: `Could you solve ${p.title} in a single pass with O(1) extra space?`,
  }
}

function makeProblem(
  num: number,
  id: string,
  title: string,
  difficulty: Difficulty,
  acceptance: number,
  tags: string[],
  companies: string[],
  status: ProblemStatus,
  daily = false,
  detail?: ProblemDetail,
): Problem {
  return { num, id, title, difficulty, acceptance, tags, topicTone: tones(tags), companies, status, daily, detail }
}

export const PROBLEMS: Problem[] = [
  makeProblem(1, 'two-sum', 'Two Sum', 'Easy', 54.2, ['Array', 'Hash Table'], ['Amazon', 'Google', 'Apple'], 'solved', false, TWO_SUM),
  makeProblem(146, 'lru-cache', 'LRU Cache', 'Medium', 43.2, ['Hash Table', 'Linked List', 'Design'], ['Amazon', 'Microsoft', 'Apple'], 'solved', true, LRU_CACHE),
  makeProblem(206, 'reverse-linked-list', 'Reverse Linked List', 'Easy', 76.8, ['Linked List', 'Recursion'], ['Amazon', 'Apple', 'Microsoft'], 'solved'),
  makeProblem(20, 'valid-parentheses', 'Valid Parentheses', 'Easy', 41.5, ['String', 'Stack'], ['Amazon', 'Bloomberg', 'Meta'], 'solved'),
  makeProblem(56, 'merge-intervals', 'Merge Intervals', 'Medium', 47.9, ['Array', 'Sorting'], ['Meta', 'Google', 'Amazon'], 'solved'),
  makeProblem(42, 'trapping-rain-water', 'Trapping Rain Water', 'Hard', 61.4, ['Array', 'Two Pointers', 'Stack'], ['Google', 'Amazon', 'Microsoft'], 'attempted'),
  makeProblem(15, '3sum', '3Sum', 'Medium', 35.1, ['Array', 'Two Pointers', 'Sorting'], ['Amazon', 'Meta', 'Adobe'], 'todo'),
  makeProblem(3, 'longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'Medium', 35.8, ['Hash Table', 'String', 'Sliding Window'], ['Amazon', 'Adobe', 'Microsoft'], 'todo'),
  makeProblem(200, 'number-of-islands', 'Number of Islands', 'Medium', 60.1, ['Array', 'DFS / BFS', 'Matrix'], ['Amazon', 'Google', 'Microsoft'], 'todo'),
  makeProblem(121, 'best-time-to-buy-and-sell-stock', 'Best Time to Buy and Sell Stock', 'Easy', 54.9, ['Array', 'Dynamic Programming'], ['Amazon', 'Meta', 'Microsoft'], 'todo'),
  makeProblem(295, 'find-median-from-data-stream', 'Find Median from Data Stream', 'Hard', 52.3, ['Design', 'Heap', 'Two Pointers'], ['Amazon', 'Google', 'Apple'], 'todo'),
  makeProblem(70, 'climbing-stairs', 'Climbing Stairs', 'Easy', 53.6, ['Math', 'Dynamic Programming', 'Memoization'], ['Adobe', 'Amazon', 'Apple'], 'solved'),
  makeProblem(141, 'linked-list-cycle', 'Linked List Cycle', 'Easy', 48.9, ['Hash Table', 'Linked List', 'Two Pointers'], ['Amazon', 'Apple', 'Microsoft'], 'solved'),
  makeProblem(322, 'coin-change', 'Coin Change', 'Medium', 44.6, ['Array', 'Dynamic Programming'], ['Amazon', 'Google', 'Microsoft'], 'attempted'),
  makeProblem(1143, 'longest-common-subsequence', 'Longest Common Subsequence', 'Medium', 59.4, ['String', 'Dynamic Programming'], ['Amazon', 'Google', 'Meta'], 'todo'),
  makeProblem(207, 'course-schedule', 'Course Schedule', 'Medium', 48.3, ['DFS / BFS', 'Graph', 'Topological Sort'], ['Amazon', 'Google', 'Adobe'], 'todo'),
  makeProblem(994, 'rotting-oranges', 'Rotting Oranges', 'Medium', 57.1, ['Array', 'DFS / BFS', 'Matrix'], ['Amazon', 'Goldman Sachs'], 'todo'),
  makeProblem(53, 'maximum-subarray', 'Maximum Subarray', 'Easy', 55.8, ['Array', 'Dynamic Programming', 'Divide and Conquer'], ['Amazon', 'LinkedIn', 'Microsoft'], 'solved'),
  makeProblem(139, 'word-break', 'Word Break', 'Medium', 48.7, ['Hash Table', 'String', 'Dynamic Programming'], ['Amazon', 'Adobe', 'Meta'], 'todo'),
  makeProblem(416, 'partition-equal-subset-sum', 'Partition Equal Subset Sum', 'Medium', 47.2, ['Array', 'Dynamic Programming'], ['Amazon', 'Microsoft'], 'todo'),
  makeProblem(155, 'min-stack', 'Min Stack', 'Medium', 54.6, ['Stack', 'Design'], ['Amazon', 'Microsoft', 'Bloomberg'], 'solved'),
  makeProblem(1468, 'calculate-tax', 'Calculate Tax', 'Easy', 62.4, ['Array', 'Math', 'Binary Search'], ['Amazon'], 'todo'),
  makeProblem(212, 'word-search-ii', 'Word Search II', 'Hard', 37.5, ['Array', 'String', 'Backtracking', 'Trie'], ['Google', 'Amazon', 'Microsoft'], 'todo'),
  makeProblem(4, 'median-of-two-sorted-arrays', 'Median of Two Sorted Arrays', 'Hard', 43.7, ['Array', 'Binary Search', 'Divide and Conquer'], ['Amazon', 'Google', 'Apple'], 'attempted'),
]

// Fallback details so every workspace opens with content.
for (const p of PROBLEMS) if (!p.detail) p.detail = genericDetail(p)

export const problemById = (id: string): Problem | undefined =>
  PROBLEMS.find((p) => p.id === id)

/* ============================================================
   Code samples
   ============================================================ */

export const TWO_SUM_PY = `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`

export const TWO_SUM_TS = `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) return [seen.get(complement)!, i];
    seen.set(nums[i], i);
  }
  return [];
}`

export const STARTER_CODES: Record<string, string> = {
  "Python3": `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your solution here
        pass`,
  "TypeScript": `function twoSum(nums: number[], target: number): number[] {
  // Write your solution here
  return [];
}`,
  "JavaScript": `function twoSum(nums, target) {
  // Write your solution here
  return [];
}`,
  "Java": `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
  "C++": `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
}`,
  "Rust": `impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        // Write your solution here
        vec![]
    }
}`,
}

export const LANGUAGES = [
  { name: 'Python3', compiler: 'Python 3.11.4' },
  { name: 'TypeScript', compiler: 'node 20.11' },
  { name: 'JavaScript', compiler: 'node 20.11' },
  { name: 'Java', compiler: 'OpenJDK 21' },
  { name: 'C++', compiler: 'gcc 13.2' },
  { name: 'Rust', compiler: 'rustc 1.76' },
]

/* ============================================================
   Submissions
   ============================================================ */

export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Compile Error'

export type Submission = {
  id: string
  problemId: string
  problemNum: number
  problemTitle: string
  status: SubmissionStatus
  language: string
  runtimeMs: number | null
  runtimeBeats?: number | null
  memoryMb: number | null
  memoryBeats?: number | null
  submitted: string
  code?: string
}

export const TWO_SUM_SUBMISSIONS: Submission[] = [
  { id: '94821034', problemId: 'two-sum', problemNum: 1, problemTitle: 'Two Sum', status: 'Accepted', language: 'Python3', runtimeMs: 38, runtimeBeats: 94.2, memoryMb: 17.2, memoryBeats: 88.1, submitted: '2 hours ago', code: TWO_SUM_PY },
  { id: '94817721', problemId: 'two-sum', problemNum: 1, problemTitle: 'Two Sum', status: 'Accepted', language: 'Rust', runtimeMs: 0, runtimeBeats: 100, memoryMb: 2.4, memoryBeats: 96.5, submitted: 'Yesterday' },
  { id: '94799104', problemId: 'two-sum', problemNum: 1, problemTitle: 'Two Sum', status: 'Wrong Answer', language: 'TypeScript', runtimeMs: null, runtimeBeats: null, memoryMb: null, memoryBeats: null, submitted: '2 days ago' },
  { id: '94766038', problemId: 'two-sum', problemNum: 1, problemTitle: 'Two Sum', status: 'Accepted', language: 'Python3', runtimeMs: 48, runtimeBeats: 78.4, memoryMb: 17.8, memoryBeats: 62, submitted: '3 days ago' },
  { id: '94765882', problemId: 'two-sum', problemNum: 1, problemTitle: 'Two Sum', status: 'Time Limit Exceeded', language: 'Python3', runtimeMs: 2000, runtimeBeats: null, memoryMb: 18.1, memoryBeats: null, submitted: '3 days ago' },
  { id: '94551740', problemId: 'two-sum', problemNum: 1, problemTitle: 'Two Sum', status: 'Accepted', language: 'C++', runtimeMs: 7, runtimeBeats: 89.1, memoryMb: 11.4, memoryBeats: 74.3, submitted: 'May 12, 2024' },
  { id: '94551209', problemId: 'two-sum', problemNum: 1, problemTitle: 'Two Sum', status: 'Compile Error', language: 'C++', runtimeMs: null, runtimeBeats: null, memoryMb: null, memoryBeats: null, submitted: 'May 12, 2024' },
  { id: '94410775', problemId: 'two-sum', problemNum: 1, problemTitle: 'Two Sum', status: 'Accepted', language: 'TypeScript', runtimeMs: 62, runtimeBeats: 67.5, memoryMb: 51.3, memoryBeats: 41.2, submitted: 'May 10, 2024' },
]

/** Recent activity shown on the profile page. */
export const PROFILE_SUBMISSIONS: Submission[] = [
  { id: '94821034', problemId: 'two-sum', problemNum: 1, problemTitle: 'Two Sum', status: 'Accepted', language: 'Python3', runtimeMs: 38, memoryMb: 17.2, submitted: '2 hours ago' },
  { id: '94817721', problemId: 'lru-cache', problemNum: 146, problemTitle: 'LRU Cache', status: 'Accepted', language: 'Rust', runtimeMs: 12, memoryMb: 2.4, submitted: 'Yesterday' },
  { id: '94766038', problemId: 'trapping-rain-water', problemNum: 42, problemTitle: 'Trapping Rain Water', status: 'Accepted', language: 'C++', runtimeMs: 7, memoryMb: 11.4, submitted: '3 days ago' },
  { id: '94700512', problemId: 'reverse-linked-list', problemNum: 206, problemTitle: 'Reverse Linked List', status: 'Accepted', language: 'TypeScript', runtimeMs: 54, memoryMb: 43.1, submitted: '4 days ago' },
  { id: '94688130', problemId: 'longest-substring-without-repeating-characters', problemNum: 3, problemTitle: 'Longest Substring Without Repeating Characters', status: 'Wrong Answer', language: 'Python3', runtimeMs: null, memoryMb: null, submitted: '5 days ago' },
  { id: '94120987', problemId: 'valid-parentheses', problemNum: 20, problemTitle: 'Valid Parentheses', status: 'Accepted', language: 'Rust', runtimeMs: 0, memoryMb: 1.8, submitted: 'May 14, 2024' },
]

/* ============================================================
   Admin data
   ============================================================ */

export type AdminSubmission = {
  id: string
  developer: string
  initials: string
  problemNum: number
  problemTitle: string
  language: string
  status: SubmissionStatus
  runtime: string
  memory: string
  timestamp: string
}

export const ADMIN_SUBMISSIONS: AdminSubmission[] = [
  { id: '984210', developer: '@alex_dev', initials: 'AV', problemNum: 146, problemTitle: 'LRU Cache', language: 'Rust 1.76', status: 'Accepted', runtime: '12ms', memory: '2.4MB', timestamp: 'Just now' },
  { id: '984210', developer: '@alex_dev', initials: 'AV', problemNum: 146, problemTitle: 'LRU Cache', language: 'Rust 1.76', status: 'Accepted', runtime: '12ms', memory: '2.4MB', timestamp: 'Just now' },
  { id: '984209', developer: '@chen_w', initials: 'CW', problemNum: 1, problemTitle: 'Two Sum', language: 'Python 3.11', status: 'Accepted', runtime: '38ms', memory: '17.2MB', timestamp: '2m ago' },
  { id: '984208', developer: '@sarah_k', initials: 'SK', problemNum: 42, problemTitle: 'Trapping Rain Water', language: 'C++ 20', status: 'Time Limit Exceeded', runtime: '>2000ms', memory: '11.4MB', timestamp: '5m ago' },
  { id: '984207', developer: '@dev_marcus', initials: 'DM', problemNum: 206, problemTitle: 'Reverse Linked List', language: 'Go 1.22', status: 'Accepted', runtime: '4ms', memory: '2.1MB', timestamp: '12m ago' },
  { id: '984206', developer: '@elena_r', initials: 'ER', problemNum: 56, problemTitle: 'Merge Intervals', language: 'TypeScript', status: 'Wrong Answer', runtime: '54ms', memory: '51.3MB', timestamp: '18m ago' },
  { id: '984205', developer: '@vikram_p', initials: 'VP', problemNum: 3, problemTitle: 'Longest Substring Without Repeating Characters', language: 'Python 3.11', status: 'Memory Limit Exceeded', runtime: '112ms', memory: '256.4MB', timestamp: '24m ago' },
]

export type AdminUser = {
  handle: string
  initials: string
  email: string
  role: 'Member' | 'Admin' | 'Moderator'
  problemsSolved: number
  submissions: number
  joined: string
  status: 'Active' | 'Idle' | 'Suspended'
}

export const ADMIN_USERS: AdminUser[] = [
  { handle: '@alex_dev', initials: 'AV', email: 'user@demo.com', role: 'Member', problemsSolved: 42, submissions: 184, joined: 'Mar 2023', status: 'Active' },
  { handle: '@avance', initials: 'AV', email: 'admin@demo.com', role: 'Admin', problemsSolved: 231, submissions: 1204, joined: 'Jan 2022', status: 'Active' },
  { handle: '@chen_w', initials: 'CW', email: 'wen.chen@demo.com', role: 'Member', problemsSolved: 118, submissions: 462, joined: 'Aug 2023', status: 'Active' },
  { handle: '@sarah_k', initials: 'SK', email: 'sarah.k@demo.com', role: 'Moderator', problemsSolved: 96, submissions: 351, joined: 'Nov 2023', status: 'Active' },
  { handle: '@dev_marcus', initials: 'DM', email: 'marcus.d@demo.com', role: 'Member', problemsSolved: 64, submissions: 210, joined: 'Feb 2024', status: 'Idle' },
  { handle: '@elena_r', initials: 'ER', email: 'elena.r@demo.com', role: 'Member', problemsSolved: 73, submissions: 287, joined: 'Apr 2024', status: 'Active' },
  { handle: '@vikram_p', initials: 'VP', email: 'vikram.p@demo.com', role: 'Member', problemsSolved: 51, submissions: 158, joined: 'Jun 2024', status: 'Idle' },
  { handle: '@noah_t', initials: 'NT', email: 'noah.t@demo.com', role: 'Member', problemsSolved: 12, submissions: 34, joined: 'Jan 2025', status: 'Suspended' },
]

/** Submissions volume over 30 days (chart data). */
export const VOLUME_SERIES: Array<{ label: string; value: number }> = [
  { label: 'Apr 15', value: 8600 },
  { label: 'Apr 17', value: 9400 },
  { label: 'Apr 19', value: 11200 },
  { label: 'Apr 21', value: 12800 },
  { label: 'Apr 23', value: 12100 },
  { label: 'Apr 25', value: 14600 },
  { label: 'Apr 27', value: 16900 },
  { label: 'Apr 29', value: 17800 },
  { label: 'May 01', value: 17200 },
  { label: 'May 03', value: 18600 },
  { label: 'May 05', value: 19400 },
  { label: 'May 07', value: 18800 },
  { label: 'May 09', value: 20100 },
  { label: 'May 11', value: 21300 },
  { label: 'May 12', value: 22410 },
  { label: 'May 13', value: 20800 },
  { label: 'May 14', value: 21600 },
  { label: 'May 15', value: 22100 },
]

export const DIFFICULTY_MATRIX = [
  { label: 'Medium', count: 274, percent: 52.3, submits: '745,120', accuracy: '58.4%' },
  { label: 'Easy', count: 148, percent: 28.2, submits: '812,490', accuracy: '78.1%' },
  { label: 'Hard', count: 102, percent: 19.5, submits: '285,300', accuracy: '34.8%' },
]

/* ============================================================
   Profile data
   ============================================================ */

export const PROFILE = {
  name: 'Alex Rivera',
  handle: '@alex_dev',
  title: 'Senior Systems Engineer',
  bio: 'Distributed systems enthusiast & algorithm speedrunner. Currently preparing for L6 infrastructure rounds. Rust & Python lover.',
  location: 'San Francisco, CA',
  joined: 'Joined March 2023',
  github: 'github.com/alexrivera',
  solved: { total: 500, done: 42, easy: { done: 22, total: 145 }, medium: { done: 17, total: 265 }, hard: { done: 3, total: 90 } },
  accuracy: 68.4,
  streak: 14,
  longestStreak: 38,
  rank: '#14,820',
  rating: '1,840 (Knight Tier)',
  topPercent: 'Top 4.2%',
  contests: 19,
  activeDays: 184,
  submissionsYear: 1248,
  week: [true, true, true, true, true, true, false],
}

export const SOLVED_BY_TOPIC = [
  { topic: 'Arrays & Strings', done: 16, percent: 65 },
  { topic: 'Hash Tables', done: 12, percent: 50 },
  { topic: 'Dynamic Programming', done: 7, percent: 28 },
  { topic: 'Trees & Graphs', done: 5, percent: 20 },
  { topic: 'Linked Lists', done: 4, percent: 16 },
  { topic: 'Two Pointers', done: 4, percent: 16 },
  { topic: 'Bit Manipulation', done: 2, percent: 8 },
]

export const BADGES = [
  { icon: '🏅', name: '30 Days Streak', meta: 'Apr 2024' },
  { icon: '🚀', name: 'Algorithms Master', meta: 'Mar 2024' },
  { icon: '⚡', name: 'Speed Demon', meta: '<10ms club' },
  { icon: '🧠', name: 'Graph Whisperer', meta: 'Feb 2024' },
  { icon: '🎯', name: 'Daily Dedication', meta: 'Jan 2024' },
  { icon: '🔥', name: 'Weekly Warrior', meta: 'Jan 2024' },
  { icon: '🏆', name: 'Contest Podium', meta: 'Dec 2023' },
  { icon: '💎', name: 'Hard Mode', meta: 'Nov 2023' },
]

/** Deterministic pseudo-random so the heatmap is stable across renders. */
export function buildHeatmap(seed: number, weeks = 53, days = 7): number[][] {
  let s = seed
  const next = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  const grid: number[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: number[] = []
    for (let d = 0; d < days; d++) {
      const r = next()
      // Weekends and random gaps are quieter, like real activity.
      const weekend = d === 5 || d === 6
      const base = weekend ? r * 0.7 : r
      col.push(base > 0.72 ? 4 : base > 0.55 ? 3 : base > 0.38 ? 2 : base > 0.22 ? 1 : 0)
    }
    grid.push(col)
  }
  return grid
}

/* ============================================================
   User portal content
   ============================================================ */

export const TRACKS = [
  { name: 'Blind 75 Essentials', done: 28, total: 75, meta: 'High-frequency patterns' },
  { name: 'Top FAANG Questions', done: 18, total: 50, meta: 'Last 6 months verified' },
  { name: 'System Design 101', done: 4, total: 25, meta: 'Scalability & Storage' },
]

export const CONTEST = {
  name: 'Weekly Contest 402',
  meta: '4 algorithmic problems · 90 minutes · Rating eligible',
  starts: 'Starts in: 2d 14h 22m',
}

export const CONTESTS = [
  { name: 'Weekly Contest 402', when: 'Starts in 2d 14h', problems: 4, duration: '90 min', registered: false, live: false },
  { name: 'Biweekly Contest 128', when: 'Starts in 6d 02h', problems: 4, duration: '90 min', registered: false, live: false },
  { name: 'Daily Challenge — LRU Cache', when: 'Live now', problems: 1, duration: '∞', registered: true, live: true },
  { name: 'Weekly Contest 401', when: 'Ended 3d ago', problems: 4, duration: '90 min', registered: true, live: false },
]

export const DISCUSS_THREADS = [
  { title: 'O(1) LRU cache with a dummy-head trick', author: '@alex_dev', tag: 'Intuition', replies: 24, votes: 118, age: '2h' },
  { title: 'Why my topological sort TLEs on case 42', author: '@chen_w', tag: 'Question', replies: 9, votes: 41, age: '5h' },
  { title: 'Interview recap — Meta E5, Bay Area', author: '@sarah_k', tag: 'Interview', replies: 57, votes: 302, age: '1d' },
  { title: 'A visual way to understand rolling hashes', author: '@dev_marcus', tag: 'Article', replies: 12, votes: 96, age: '2d' },
  { title: 'Weekly Contest 402 editorial thread', author: '@avance', tag: 'Contest', replies: 83, votes: 210, age: '3d' },
]

export const PREP_TRACKS = [
  { name: 'Arrays & Hashing', lessons: 12, done: 9, meta: 'Foundations · 3h 20m' },
  { name: 'Two Pointers & Sliding Window', lessons: 14, done: 6, meta: 'Patterns · 4h 05m' },
  { name: 'Trees & Graphs', lessons: 18, done: 4, meta: 'Intermediate · 6h 40m' },
  { name: 'Dynamic Programming', lessons: 21, done: 2, meta: 'Advanced · 8h 15m' },
  { name: 'System Design Mock', lessons: 8, done: 1, meta: 'L5–L6 · 5h 00m' },
]

/* ============================================================
   Landing page content
   ============================================================ */

export const LANDING_STATS = [
  { value: '500+', label: 'Curated Problems', meta: 'From top tech companies' },
  { value: '10k+', label: 'Active Engineers', meta: 'Practicing right now' },
  { value: '1M+', label: 'Code Submissions', meta: 'Executed this year' },
  { value: '14', label: 'Languages Supported', meta: 'With smart scaffolding' },
]

export const LANDING_FEATURES = [
  { icon: 'visualizer', title: 'Visual Memory & Pointer Debugger', text: 'Step through heap allocations, watch pointers mutate, and internalize how your code moves data.' },
  { icon: 'tracks', title: 'Company-Specific Interview Tracks', text: 'Curated problem sets rebuilt weekly from real interview reports at FAANG and unicorn startups.' },
  { icon: 'sandbox', title: 'Multi-Language Sandboxing', text: 'Run Python, Rust, C++ and 11 more in isolated microVMs with identical test harnesses.' },
  { icon: 'recall', title: 'Spaced Repetition Review', text: 'An SM-2 scheduler resurfaces problems right before you would have forgotten them.' },
  { icon: 'profiler', title: 'Complexity & Performance Profiler', text: 'Per-line Big-O and memory heatmaps show exactly where your solution stops scaling.' },
  { icon: 'mock', title: 'Mock Interview Simulation', text: 'Timed, screen-shared simulations with AI follow-up questions and a scored debrief.' },
]

export const LANDING_ROADMAP = [
  { step: '01', phase: 'Foundations', title: 'Assess Your Bounds', text: 'Diagnose your baseline across arrays, hashing and strings — then get a personalized starting lane.' },
  { step: '02', phase: 'Patterns', title: 'Target High-Yield Patterns', text: 'Two pointers, sliding window, monotonic stacks: the twelve patterns behind 80% of interview questions.' },
  { step: '03', phase: 'Interviews', title: 'Simulate Live Interviews', text: 'Full-length mocks with a talking interviewer, follow-ups and a rubric you can actually act on.' },
]

export const ENGINE_BULLETS = [
  'Auto-generated per-line workloads and memory heatmaps',
  'Benchmark any submission against 1M+ historical runs',
  'Compile outputs against verified system-level test oracles',
]

export const SYSTEM_DESIGN_POINTS = [
  'Sharded counters, rate limiters, and backpressure-aware queues',
  'Idempotent keys, exactly-once delivery, and leader election',
  'Consistent hashing, quorum reads, and multi-region failover drills',
  'Deploy target: 120+ ready-to-run design templates with cost models',
]

export const PRICING = [
  {
    name: 'Free Starter',
    tagline: 'The daily driver for focused practice',
    price: '$0',
    period: 'forever',
    cta: 'Get Started Free',
    featured: false,
    features: [
      'Access to curated question bank',
      'Unlimited standard code executions',
      'Community discussion and leaderboards',
      'Basic progress analytics',
    ],
  },
  {
    name: 'Pro Engineer',
    tagline: 'Everything you need to land the offer',
    price: '$19',
    period: '/ month',
    cta: 'Start Pro 7-day trial',
    featured: true,
    features: [
      'All 500+ problems with company tracks',
      'Smart hints & unlimited AI mock interviews',
      'Complexity heatmaps and profiler',
      'Priority sandbox queue (< 200ms cold start)',
      'Spaced repetition review scheduler',
    ],
  },
  {
    name: 'Teams & Bootcamps',
    tagline: 'Cohort-ready interview prep',
    price: '$49',
    period: '/ month',
    cta: 'Contact Enterprise',
    featured: false,
    features: [
      'Everything in Pro Engineer',
      'Cohort dashboards & skill-gap reports',
      'Custom problem sets and private contests',
      'SSO/SAML, audit logs, dedicated support',
    ],
  },
]

export const FAQ = [
  {
    q: 'How does CodeForge differ from standard LeetCode?',
    a: 'Every problem ships with a visual execution engine, a company-frequency signal and a spaced-repetition schedule. You do not just submit and forget — the platform decides what you should see again, and when.',
  },
  {
    q: 'Can I practice in systems languages like Rust and C++?',
    a: 'Yes. 14 languages run in identical isolated microVMs with the same test harness, so a solution in Rust is judged against the exact same cases as Python or Go.',
  },
  {
    q: 'Are the problem solutions verified by actual tech engineers?',
    a: 'All editorials are written or reviewed by engineers who have served on real interview loops, then validated against our differential testing pipeline before publishing.',
  },
  {
    q: 'Does CodeForge offer refunds if I do not get interviews?',
    a: 'Pro plans include a 14-day money-back guarantee, no questions asked. Annual and team plans can be cancelled at any time and stay active until the end of the billing period.',
  },
  {
    q: 'Do you support dark and light theme editor preferences?',
    a: 'The whole app — editor included — supports light, dark and system themes with a persistent toggle (⌘⇧L). Your choice is remembered across sessions.',
  },
]

export const LOGIN_SHOWCASE = {
  code: [
    'function maxProfit(prices: number[]): number {',
    '  let minPrice = Infinity;',
    '  let maxProfit = 0;',
    '  for (const price of prices) {',
    '    if (price < minPrice) minPrice = price;',
    '    else if (price - minPrice > maxProfit) {',
    '      maxProfit = price - minPrice;',
    '    }',
    '  }',
    '  return maxProfit;',
    '}',
  ],
  memory: 'Memory: 44.2 MB (Beats 96.8%)',
  runtime: 'Runtime: O(n) Single Pass',
}

export const REGISTER_SHOWCASE = {
  code: [
    'class Node:',
    '  def __init__(self, key: int, val: int):',
    '    self.key, self.val = key, val',
    '    self.prev = self.next = None',
    '',
    'class LRUCache:',
    '  def get(self, key: int) -> int:',
    '    if key in self.cache:',
    '      self.remove(self.cache[key])',
    '      self.insert(self.cache[key])',
    '      return self.cache[key].val',
    '    return -1',
  ],
  memory: 'Memory: 38.4 MB (Beats 98.1%)',
  runtime: 'Runtime: O(1) Operations',
}

export const RESET_SHOWCASE = {
  code: [
    'pub async fn rotate_credentials(user_id: &Uuid, new_secret:',
    '    &SecretString) -> Result<()> {',
    '    let hash = argon2_hash(new_secret, &SALT)?;',
    '    auth_db::update_user_credentials(user_id, &hash).await?;',
    '    cluster::revoke_active_sandboxes(user_id).await?;',
    '    audit_log::record(Event::PasswordResetCompleted(user_id));',
    '    Ok(())',
    '}',
  ],
  memory: 'Key Revocation: Instantaneous (<5ms)',
  runtime: 'Cluster sync: 100%',
}

export const RECOVERY_SHOWCASE = {
  code: [
    'POST /v2/auth/recovery',
    '{',
    '  "email": "user@demo.com",',
    '  "channel": "email",',
    '  "ttl_seconds": 900,',
    '  "scope": "password_reset"',
    '}',
    '',
    '→ 202 Accepted  ·  token delivered in 412ms',
  ],
  memory: 'Token TTL: 15 minutes',
  runtime: 'Delivery: 412ms',
}
