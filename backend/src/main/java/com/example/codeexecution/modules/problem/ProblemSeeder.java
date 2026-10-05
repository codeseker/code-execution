package com.example.codeexecution.modules.problem;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.example.codeexecution.modules.problem.entities.Difficulty;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.problem.entities.TestCase;
import com.example.codeexecution.modules.problem.services.SlugService;
import com.example.codeexecution.modules.problem.services.TestCaseStorageService;

/**
 * Idempotent interview-problem seeder (the Spring equivalent of a
 * {@code seeders/problemSeeder.ts} script).
 *
 * <p>Mirrors the upsert strategy used by {@code RbacSeeder}: runs at startup,
 * finds each problem by its slug, and either inserts it (with all its test
 * cases) or updates the mutable fields so re-running never creates
 * duplicates or loses manual edits the setter may have applied.
 *
 * <p>Each problem is defined as a {@link SeedProblem} carrying:
 * <ul>
 *   <li>title / description / statement</li>
 *   <li>difficulty + tags</li>
 *   <li>sample test cases (input / expected output, with optional explanation)</li>
 * </ul>
 * Sample cases are marked {@code isSample = true}; hidden cases are
 * {@code isSample = false} but still present so the judge has coverage on
 * startup without requiring uploads.
 *
 * <p>Disable with {@code app.problem.seed.enabled=false}.
 */
@Component
public class ProblemSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProblemSeeder.class);

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final SlugService slugService;
    private final TestCaseStorageService storageService;

    private final boolean enabled;

    public ProblemSeeder(
            ProblemRepository problemRepository,
            TestCaseRepository testCaseRepository,
            SlugService slugService,
            TestCaseStorageService storageService,
            @Value("${app.problem.seed.enabled:true}") boolean enabled) {
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.slugService = slugService;
        this.storageService = storageService;
        this.enabled = enabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.info("Problem seeding disabled (app.problem.seed.enabled=false)");
            return;
        }

        for (SeedProblem seedProblem : PROBLEMS) {
            upsert(seedProblem);
        }

        log.info("Problem seed completed - {} problems ensured", PROBLEMS.size());
    }

    /**
     * Upserts one problem by slug: creates the shell + test cases when the
     * slug is new, or updates only the metadata / statement when it already
     * exists (test cases are never re-created, preserving any manual edits).
     */
    private void upsert(SeedProblem seedProblem) {
        String slug = this.slugService.slugify(seedProblem.title());
        String candidate = slug;
        int suffix = 2;

        // Resolve a free slug: if the seed slug is already taken by one of *our*
        // problems, update it; otherwise try slug-2, slug-3... until free.
        while (this.problemRepository.existsBySlug(candidate)) {
            var existing = this.problemRepository.findBySlug(candidate);
            if (existing.isPresent()) {
                // Slug is ours -> update metadata, keep test cases intact.
                updateExisting(existing.get(), seedProblem);
                return;
            }
            candidate = slug + "-" + suffix++;
        }

        // Truly new problem: insert and create test cases.
        Instant now = Instant.now();
        Problem problem = Problem.builder()
                .title(seedProblem.title())
                .slug(candidate)
                .description(seedProblem.description())
                .problemStatement(seedProblem.problemStatement())
                .difficulty(seedProblem.difficulty())
                .tags(new ArrayList<>(seedProblem.tags()))
                .testCases(new ArrayList<>())
                .createdBy(seedProblem.createdBy())
                .isPublished(true)
                .build();
        problem.setCreatedAt(now);
        problem.setUpdatedAt(now);

        Problem saved = this.problemRepository.save(problem);

        List<TestCase> cases = new ArrayList<>();
        for (SeedTestCase stc : seedProblem.testCases()) {
            var files = this.storageService.save(saved.getId(), stc.input(), stc.output());
            TestCase tc = TestCase.builder()
                    .problemId(saved.getId())
                    .inputFilePath(files.inputFilePath())
                    .outputFilePath(files.outputFilePath())
                    .isSample(stc.isSample())
                    .timeLimitMs(stc.timeLimitMs())
                    .memoryLimitKb(stc.memoryLimitKb())
                    .explanation(stc.explanation())
                    .build();
            cases.add(tc);
        }
        this.testCaseRepository.saveAll(cases);

        saved.setTestCases(cases.stream().map(TestCase::getId).toList());
        saved.setUpdatedAt(Instant.now());
        this.problemRepository.save(saved);

        log.info("Seeded problem '{}' (slug={}) with {} test cases",
                seedProblem.title(), candidate, cases.size());
    }

    /** Updates mutable fields of an existing problem; leaves test cases untouched. */
    private void updateExisting(Problem existing, SeedProblem seedProblem) {
        boolean changed = false;

        if (!existing.getTitle().equals(seedProblem.title())) {
            existing.setTitle(seedProblem.title());
            changed = true;
        }
        if (!objectsEqual(existing.getDescription(), seedProblem.description())) {
            existing.setDescription(seedProblem.description());
            changed = true;
        }
        if (!objectsEqual(existing.getProblemStatement(), seedProblem.problemStatement())) {
            existing.setProblemStatement(seedProblem.problemStatement());
            changed = true;
        }
        if (existing.getDifficulty() != seedProblem.difficulty()) {
            existing.setDifficulty(seedProblem.difficulty());
            changed = true;
        }
        if (!new ArrayList<>(seedProblem.tags()).equals(existing.getTags())) {
            existing.setTags(new ArrayList<>(seedProblem.tags()));
            changed = true;
        }
        if (!existing.isPublished()) {
            existing.setPublished(true);
            changed = true;
        }

        if (changed) {
            existing.setUpdatedAt(Instant.now());
            this.problemRepository.save(existing);
            log.info("Updated existing problem '{}' (slug={})", seedProblem.title(), existing.getSlug());
        }
    }

    private static boolean objectsEqual(Object a, Object b) {
        return (a == null) ? b == null : a.equals(b);
    }

    // ------------------------------------------------------------------
    // Seed data: 15 good interview problems with full details & test cases
    // ------------------------------------------------------------------

    private static final List<SeedProblem> PROBLEMS = List.of(
            new SeedProblem(
                    "Two Sum",
                    "Find two numbers in an array that add up to a target value.",
                    """
                    ## Problem Statement

                    Given an array of integers `nums` and an integer `target`, return the
                    *indices* of the two numbers such that they add up to `target`.

                    You may assume that each input has exactly one solution, and you may
                    not use the same element twice.

                    ### Example

                    ```
                    Input:  nums = [2, 7, 11, 15], target = 9
                    Output: [0, 1]
                    ```

                    ### Constraints
                    - 2 <= nums.length <= 10^4
                    - -10^9 <= nums[i] <= 10^9
                    - -10^9 <= target <= 10^9
                    """,
                    Difficulty.EASY,
                    List.of("array", "hash-table", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "2 7 11 15\n9\n",
                                    "0 1\n",
                                    true,
                                    1000, 256000,
                                    "For nums = [2,7,11,15] and target = 9, indices 0 and 1 give 2 + 7 = 9."),
                            new SeedTestCase(
                                    "3 2 4\n6\n",
                                    "1 2\n",
                                    true,
                                    1000, 256000,
                                    "nums[1] + nums[2] = 2 + 4 = 6."),
                            new SeedTestCase(
                                    "3 3\n6\n",
                                    "0 1\n",
                                    false,
                                    1000, 256000, null))),

            new SeedProblem(
                    "Valid Palindrome",
                    "Check whether a string reads the same forward and backward (alphanumeric only).",
                    """
                    ## Problem Statement

                    Given a string `s`, return `true` if it is a palindrome, otherwise
                    `false`.

                    A phrase is a palindrome if it reads the same forward and backward
                    after converting all uppercase letters to lowercase and removing all
                    non-alphanumeric characters.

                    ### Example

                    ```
                    Input:  s = "A man, a plan, a canal: Panama"
                    Output: true
                    ```

                    ### Constraints
                    - 1 <= s.length <= 2 * 10^5
                    """,
                    Difficulty.EASY,
                    List.of("two-pointers", "string", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "A man, a plan, a canal: Panama\n",
                                    "true\n",
                                    true, 1000, 256000,
                                    "After stripping non-alphanumerics: amanaplanacanalpanama -> palindrome."),
                            new SeedTestCase(
                                    "race a car\n",
                                    "false\n",
                                    true, 1000, 256000,
                                    "raceacar is not a palindrome."),
                            new SeedTestCase(
                                    "a\n",
                                    "true\n",
                                    false, 1000, 256000, null))),

            new SeedProblem(
                    "Climbing Stairs",
                    "Count the distinct ways to climb a staircase of n steps (1 or 2 steps at a time).",
                    """
                    ## Problem Statement

                    You are climbing a staircase. It takes `n` steps to reach the top.
                    Each time you can either climb `1` or `2` steps.

                    How many distinct ways can you climb to the top?

                    ### Example

                    ```
                    Input:  n = 3
                    Output: 3
                    Explanation: 1+1+1, 1+2, 2+1
                    ```

                    ### Constraints
                    - 1 <= n <= 45
                    """,
                    Difficulty.EASY,
                    List.of("dynamic-programming", "math", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "2\n", "2\n",
                                    true, 1000, 256000,
                                    "n=2 -> {1+1, 2} = 2 ways."),
                            new SeedTestCase(
                                    "3\n", "3\n",
                                    true, 1000, 256000,
                                    "n=3 -> {1+1+1, 1+2, 2+1} = 3 ways."),
                            new SeedTestCase(
                                    "5\n", "8\n",
                                    false, 1000, 256000, null))),

            new SeedProblem(
                    "Reverse Linked List",
                    "Reverse a singly linked list iteratively.",
                    """
                    ## Problem Statement

                    Given the `head` of a singly linked list, reverse the list, and
                    return the head of the reversed list.

                    ### Example

                    ```
                    Input:  head = [1,2,3,4,5]
                    Output: [5,4,3,2,1]
                    ```

                    ### Constraints
                    - 0 <= length <= 5000
                    """,
                    Difficulty.EASY,
                    List.of("linked-list", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "1 2 3 4 5\n",
                                    "5 4 3 2 1\n",
                                    true, 1000, 256000,
                                    "Reversing [1,2,3,4,5] yields [5,4,3,2,1]."),
                            new SeedTestCase(
                                    "1 2\n",
                                    "2 1\n",
                                    true, 1000, 256000,
                                    "Reversing [1,2] yields [2,1]."),
                            new SeedTestCase(
                                    "-\n",
                                    "-\n",
                                    false, 1000, 256000, null))),

            new SeedProblem(
                    "Maximum Subarray",
                    "Find the contiguous subarray with the largest sum (Kadane's algorithm).",
                    """
                    ## Problem Statement

                    Given an integer array `nums`, find the contiguous subarray
                    (containing at least one number) which has the largest sum, and
                    return that sum.

                    ### Example

                    ```
                    Input:  nums = [-2,1,-3,4,-1,2,1,-5,4]
                    Output: 6
                    Explanation: [4,-1,2,1] has the largest sum.
                    ```

                    ### Constraints
                    - 1 <= nums.length <= 10^5
                    """,
                    Difficulty.MEDIUM,
                    List.of("array", "dynamic-programming", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "-2 1 -3 4 -1 2 1 -5 4\n",
                                    "6\n",
                                    true, 1000, 256000,
                                    "Subarray [4,-1,2,1] sums to 6."),
                            new SeedTestCase(
                                    "1\n",
                                    "1\n",
                                    true, 1000, 256000,
                                    "Single-element array -> max is the element itself."),
                            new SeedTestCase(
                                    "5 4 -1 7 8\n",
                                    "23\n",
                                    false, 1000, 256000, null))),

            new SeedProblem(
                    "Merge Intervals",
                    "Merge overlapping intervals in a list.",
                    """
                    ## Problem Statement

                    Given an array of `intervals` where `intervals[i] = [start, end]`,
                    merge all overlapping intervals and return the non-overlapping
                    intervals in sorted order.

                    ### Example

                    ```
                    Input:  intervals = [[1,3],[2,6],[8,10],[15,18]]
                    Output: [[1,6],[8,10],[15,18]]
                    ```

                    ### Constraints
                    - 1 <= intervals.length <= 10^4
                    """,
                    Difficulty.MEDIUM,
                    List.of("array", "sorting", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "1 3\n2 6\n8 10\n15 18\n",
                                    "1 6\n8 10\n15 18\n",
                                    true, 1000, 256000,
                                    "[1,3] and [2,6] overlap, merge -> [1,6]."),
                            new SeedTestCase(
                                    "1 4\n4 5\n",
                                    "1 5\n",
                                    true, 1000, 256000,
                                    "[1,4] and [4,5] are touching -> merge into [1,5]."),
                            new SeedTestCase(
                                    "1 4\n2 3\n",
                                    "1 4\n",
                                    false, 1000, 256000, null))),

            new SeedProblem(
                    "Validate Binary Search Tree",
                    "Determine if a binary tree is a valid BST.",
                    """
                    ## Problem Statement

                    Given the `root` of a binary tree, determine if it is a valid binary
                    search tree (BST).

                    A valid BST is defined as follows:
                    - The left subtree of a node contains only nodes with keys less than
                      the node's key.
                    - The right subtree of a node contains only nodes with keys greater
                      than the node's key.
                    - Both the left and right subtrees must also be binary search trees.

                    ### Example

                    ```
                    Input:  root = [2,1,3]
                    Output: true
                    ```

                    ### Constraints
                    - 1 <= nodes <= 10^4
                    """,
                    Difficulty.MEDIUM,
                    List.of("binary-tree", "recursion", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "2,1,3\n",
                                    "true\n",
                                    true, 1000, 256000,
                                    "Root 2 with left 1 and right 3 -> valid BST."),
                            new SeedTestCase(
                                    "1,2,3\n",
                                    "false\n",
                                    true, 1000, 256000,
                                    "Root 1 with left child 2 > 1 -> invalid BST."),
                            new SeedTestCase(
                                    "5,1,4,null,null,3,6\n",
                                    "false\n",
                                    false, 1000, 256000, null))),

            new SeedProblem(
                    "LRU Cache",
                    "Design an LRU cache supporting get and put in O(1) average time.",
                    """
                    ## Problem Statement

                    Design a Least Recently Used (LRU) cache and implement the `LRUCache`
                    class:

                    - `LRUCache(int capacity)` — initialise the cache with capacity.
                    - `int get(int key)` — return the value or -1.
                    - `void put(int key, int value)` — update or add the key.

                    Both `get` and `put` must run in average O(1) time.

                    ### Example

                    ```
                    Input:  ["LRUCache","put","put","get","put","get","put","get","get","get"]
                            [[2],[1,1],[2,2],[1],[2,3],[2],[4,4],[1],[3],[4]]
                    Output: [null,null,null,1,null,3,null,-1,3,4]
                    ```

                    ### Constraints
                    - 1 <= capacity <= 3000
                    """,
                    Difficulty.MEDIUM,
                    List.of("hash-table", "linked-list", "design", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "2\n1 1\n2 2\n1\n2 3\n2\n4 4\n1\n3\n4\n",
                                    "1\n3\n-1\n3\n4\n",
                                    true, 2000, 256000,
                                    "Capacity-2 LRU with put/get interleaving."),
                            new SeedTestCase(
                                    "2\n1 1\n2 2\n3 3\n4 4\n1\n4\n",
                                    "-1\n4\n",
                                    false, 2000, 256000, null))),

            new SeedProblem(
                    "Longest Substring Without Repeating Characters",
                    "Find the length of the longest substring with all unique characters.",
                    """
                    ## Problem Statement

                    Given a string `s`, find the length of the longest substring without
                    repeating characters.

                    ### Example

                    ```
                    Input:  s = "abcabcbb"
                    Output: 3
                    Explanation: "abc" is the longest substring.
                    ```

                    ### Constraints
                    - 0 <= s.length <= 5 * 10^4
                    """,
                    Difficulty.MEDIUM,
                    List.of("string", "sliding-window", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "abcabcbb\n",
                                    "3\n",
                                    true, 1000, 256000,
                                    "Longest substring is 'abc' with length 3."),
                            new SeedTestCase(
                                    "bbbbb\n",
                                    "1\n",
                                    true, 1000, 256000,
                                    "All characters are 'b' -> max length 1."),
                            new SeedTestCase(
                                    "pwwkew\n",
                                    "3\n",
                                    false, 1000, 256000, null))),

            new SeedProblem(
                    "Add Two Numbers",
                    "Add two non-negative integers represented as reversed linked lists.",
                    """
                    ## Problem Statement

                    Given two non-empty linked lists representing two non-negative
                    integers (digits stored in reverse order), add the two numbers and
                    return the sum as a reversed linked list.

                    ### Example

                    ```
                    Input:  l1 = [2,4,3], l2 = [5,6,4]
                    Output: [7,0,8]
                    Explanation: 342 + 465 = 807
                    ```

                    ### Constraints
                    - 1 <= length of either list <= 100
                    """,
                    Difficulty.MEDIUM,
                    List.of("linked-list", "math", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "2 4 3\n5 6 4\n",
                                    "7 0 8\n",
                                    true, 2000, 256000,
                                    "(342 + 465) = 807, stored reversed as [7,0,8]."),
                            new SeedTestCase(
                                    "0\n0\n",
                                    "0\n",
                                    true, 2000, 256000,
                                    "0 + 0 = 0."),
                            new SeedTestCase(
                                    "9 9 9\n1\n",
                                    "0 0 0 1\n",
                                    false, 2000, 256000, null))),

            new SeedProblem(
                    "Group Anagrams",
                    "Group anagrams from a list of strings.",
                    """
                    ## Problem Statement

                    Given an array of strings `strs`, group the anagrams together.
                    Return the groups in any order.

                    ### Example

                    ```
                    Input:  strs = ["eat","tea","tan","ate","nat","bat"]
                    Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
                    ```

                    ### Constraints
                    - 1 <= strs.length <= 10^4
                    """,
                    Difficulty.MEDIUM,
                    List.of("hash-table", "string", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "eat\ntea\ntan\nate\nnat\nbat\n",
                                    "bat\nnat tan\nate eat tea\n",
                                    true, 2000, 256000,
                                    "Groups: {bat}, {tan,nat}, {ate,eat,tea}."),
                            new SeedTestCase(
                                    "-\n",
                                    "-\n",
                                    false, 2000, 256000, null))),

            new SeedProblem(
                    "Rotate Image",
                    "Rotate an N x N matrix (image) 90 degrees clockwise in-place.",
                    """
                    ## Problem Statement

                    Given an `n x n` matrix (image) represented as a 2-D array, rotate
                    it 90 degrees clockwise **in-place**.

                    ### Example

                    ```
                    Input:  [[1,2,3],[4,5,6],[7,8,9]]
                    Output: [[7,4,1],[8,5,2],[9,6,3]]
                    ```

                    ### Constraints
                    - 1 <= n <= 20
                    """,
                    Difficulty.MEDIUM,
                    List.of("array", "math", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "1 2 3\n4 5 6\n7 8 9\n",
                                    "7 4 1\n8 5 2\n9 6 3\n",
                                    true, 1000, 256000,
                                    "90-degree clockwise rotation of a 3x3 matrix."),
                            new SeedTestCase(
                                    "1\n",
                                    "1\n",
                                    true, 1000, 256000,
                                    "1x1 matrix is unchanged by rotation."),
                            new SeedTestCase(
                                    "0 1\n2 3\n",
                                    "2 0\n3 1\n",
                                    false, 1000, 256000, null))),

            new SeedProblem(
                    "Search in Rotated Sorted Array",
                    "Find a target in a rotated sorted array in O(log n) time.",
                    """
                    ## Problem Statement

                    Given the array `nums` (sorted and rotated) and an integer `target`,
                    return the index of `target` in the array, or -1 if not found.

                    You must write an algorithm that runs in O(log n) time.

                    ### Example

                    ```
                    Input:  nums = [4,5,6,7,0,1,2], target = 0
                    Output: 4
                    ```

                    ### Constraints
                    - 1 <= nums.length <= 5000
                    """,
                    Difficulty.MEDIUM,
                    List.of("array", "binary-search", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "4 5 6 7 0 1 2\n0\n",
                                    "4\n",
                                    true, 1000, 256000,
                                    "Target 0 is at index 4."),
                            new SeedTestCase(
                                    "4 5 6 7 0 1 2\n3\n",
                                    "-1\n",
                                    true, 1000, 256000,
                                    "Target 3 is not in the array -> -1."),
                            new SeedTestCase(
                                    "1\n0\n",
                                    "-1\n",
                                    false, 1000, 256000, null))),

            new SeedProblem(
                    "Letter Combinations of a Phone Number",
                    "Generate all letter combinations that a digit string could represent on a phone keypad.",
                    """
                    ## Problem Statement

                    Given a string containing digits from 2-9, return all possible letter
                    combinations that the number could represent (in any order). Return
                    an empty list if the input is empty.

                    Digits to letters mapping:
                    ```
                    2 -> abc    6 -> mno
                    3 -> def    7 -> pqrs
                    4 -> ghi    8 -> tuv
                    5 -> jkl    9 -> wxyz
                    ```

                    ### Example
                    ```
                    Input:  "23"
                    Output: ["ad","ae","af","bd","be","bf","cd","ce","cf"]
                    ```

                    ### Constraints
                    - 0 <= digits.length <= 4
                    """,
                    Difficulty.MEDIUM,
                    List.of("backtracking", "string", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "23\n",
                                    "ad ae af bd be bf cd ce cf\n",
                                    true, 1000, 256000,
                                    "Digits '23' maps to letters of 2 and 3 -> 9 combinations."),
                            new SeedTestCase(
                                    "-\n",
                                    "-\n",
                                    false, 1000, 256000,
                                    "Empty input -> empty output.")
                            )),

            new SeedProblem(
                    "Find First and Last Position of Element in Sorted Array",
                    "Find the starting and ending positions of a target in a sorted array (O(log n)).",
                    """
                    ## Problem Statement

                    Given an array of integers `nums` sorted in non-decreasing order,
                    find the starting and ending position of a given `target` value.

                    If the target is not found, return `[-1, -1]`.

                    You must write an algorithm with O(log n) runtime complexity.

                    ### Example
                    ```
                    Input:  nums = [5,7,7,8,8,10], target = 8
                    Output: [3, 4]
                    ```

                    ### Constraints
                    - 0 <= nums.length <= 10^5
                    """,
                    Difficulty.MEDIUM,
                    List.of("array", "binary-search", "interview"),
                    "system",
                    List.of(
                            new SeedTestCase(
                                    "5 7 7 8 8 10\n8\n",
                                    "3 4\n",
                                    true, 1000, 256000,
                                    "Target 8 appears at indices 3 and 4."),
                            new SeedTestCase(
                                    "5 7 7 8 8 10\n6\n",
                                    "-1 -1\n",
                                    true, 1000, 256000,
                                    "Target 6 not found -> [-1, -1]."),
                            new SeedTestCase(
                                    "\n1\n",
                                    "-1 -1\n",
                                    false, 1000, 256000, null))));

    /**
     * Immutable description of one interview problem, including its sample
     * and hidden test cases.
     */
    public record SeedProblem(
            String title,
            String description,
            String problemStatement,
            Difficulty difficulty,
            List<String> tags,
            String createdBy,
            List<SeedTestCase> testCases) {

        public SeedProblem {
            if (testCases == null) {
                testCases = List.of();
            }
        }
    }

    /** A single seed test case with its input/expected-output pair. */
    public record SeedTestCase(
            String input,
            String output,
            boolean isSample,
            int timeLimitMs,
            int memoryLimitKb,
            String explanation) {

        public SeedTestCase {
            if (timeLimitMs <= 0) timeLimitMs = 1000;
            if (memoryLimitKb <= 0) memoryLimitKb = 256000;
        }
    }
}
