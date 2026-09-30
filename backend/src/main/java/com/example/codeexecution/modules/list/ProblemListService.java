package com.example.codeexecution.modules.list;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.example.codeexecution.common.exceptions.BadRequestException;
import com.example.codeexecution.common.exceptions.ResourceNotFoundException;
import com.example.codeexecution.modules.list.dtos.CreateListDTO;
import com.example.codeexecution.modules.list.dtos.ListDetailResponse;
import com.example.codeexecution.modules.list.dtos.ProblemListResponse;
import com.example.codeexecution.modules.list.dtos.ProblemSummaryResponse;
import com.example.codeexecution.modules.list.dtos.UpdateListDTO;
import com.example.codeexecution.modules.list.entities.ProblemList;
import com.example.codeexecution.modules.problem.ProblemRepository;
import com.example.codeexecution.modules.problem.entities.Problem;

/**
 * Bookmarks and curated problem lists ("Blind 75" style study plans).
 *
 * Everything is a {@link ProblemList}; the star/bookmark toggle simply
 * writes to the reserved, system-owned {@code Bookmarks} list, which is
 * created lazily on the first bookmark. Lists are strictly private:
 * every lookup is scoped to the owner and a foreign id answers 404.
 *
 * Problems must exist and be published when added, so a list can only
 * ever reference problems its owner can actually see.
 */
@Service
public class ProblemListService {

    /** Reserved name of the list behind the bookmark star. */
    static final String BOOKMARKS_NAME = "Bookmarks";

    private final ProblemListRepository listRepository;
    private final ProblemRepository problemRepository;

    public ProblemListService(
            ProblemListRepository listRepository,
            ProblemRepository problemRepository) {
        this.listRepository = listRepository;
        this.problemRepository = problemRepository;
    }

    /** All of the caller's lists, newest first. */
    public List<ProblemListResponse> lists(String userId) {
        return this.listRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** Creates an empty list with a name unique per account. */
    public ProblemListResponse create(String userId, CreateListDTO request) {
        String name = request.getName().trim();
        assertNameAllowed(userId, name, null);

        ProblemList list = this.listRepository.save(ProblemList.builder()
                .userId(userId)
                .name(name)
                .description(request.getDescription())
                .problemIds(new ArrayList<>())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
        return toResponse(list);
    }

    /** List metadata with its problems hydrated in insertion order. */
    public ListDetailResponse get(String userId, String listId) {
        ProblemList list = findOwnedList(userId, listId);
        return new ListDetailResponse(toResponse(list), hydrate(list.getProblemIds()));
    }

    /** Renames the list / replaces the description (system lists are fixed). */
    public ProblemListResponse update(String userId, String listId, UpdateListDTO request) {
        ProblemList list = findOwnedList(userId, listId);
        if (list.isSystem()) {
            throw new BadRequestException("The Bookmarks list cannot be renamed");
        }

        String name = request.getName().trim();
        assertNameAllowed(userId, name, list.getId());

        list.setName(name);
        list.setDescription(request.getDescription());
        list.setUpdatedAt(Instant.now());
        return toResponse(this.listRepository.save(list));
    }

    /** Deletes a user-created list; the Bookmarks list is permanent. */
    public void delete(String userId, String listId) {
        ProblemList list = findOwnedList(userId, listId);
        if (list.isSystem()) {
            throw new BadRequestException("The Bookmarks list cannot be deleted");
        }
        this.listRepository.delete(list);
    }

    /** Appends a published problem to a list (idempotent). */
    public ProblemListResponse addProblem(String userId, String listId, String problemId) {
        ProblemList list = findOwnedList(userId, listId);
        Problem problem = findVisibleProblem(problemId);

        if (!list.getProblemIds().contains(problem.getId())) {
            list.getProblemIds().add(problem.getId());
            list.setUpdatedAt(Instant.now());
            this.listRepository.save(list);
        }
        return toResponse(list);
    }

    /** Removes a problem from a list; unknown ids are a no-op. */
    public ProblemListResponse removeProblem(String userId, String listId, String problemId) {
        ProblemList list = findOwnedList(userId, listId);
        if (list.getProblemIds().remove(problemId)) {
            list.setUpdatedAt(Instant.now());
            this.listRepository.save(list);
        }
        return toResponse(list);
    }

    /** Stars a problem: appends it to the Bookmarks list. */
    public ProblemListResponse bookmark(String userId, String problemId) {
        Problem problem = findVisibleProblem(problemId);
        ProblemList bookmarks = this.listRepository
                .findByUserIdAndName(userId, BOOKMARKS_NAME)
                .orElseGet(() -> createBookmarksList(userId));

        if (!bookmarks.getProblemIds().contains(problem.getId())) {
            bookmarks.getProblemIds().add(problem.getId());
            bookmarks.setUpdatedAt(Instant.now());
            this.listRepository.save(bookmarks);
        }
        return toResponse(bookmarks);
    }

    /** Unstars a problem; bookmarking twice then removing once works. */
    public void unbookmark(String userId, String problemId) {
        this.listRepository.findByUserIdAndName(userId, BOOKMARKS_NAME)
                .ifPresent(bookmarks -> {
                    if (bookmarks.getProblemIds().remove(problemId)) {
                        bookmarks.setUpdatedAt(Instant.now());
                        this.listRepository.save(bookmarks);
                    }
                });
    }

    /** Starred problems in bookmark order; empty when nothing is starred. */
    public List<ProblemSummaryResponse> bookmarks(String userId) {
        return this.listRepository.findByUserIdAndName(userId, BOOKMARKS_NAME)
                .map(list -> hydrate(list.getProblemIds()))
                .orElse(List.of());
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private ProblemList findOwnedList(String userId, String listId) {
        return this.listRepository.findByIdAndUserId(listId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found: " + listId));
    }

    private ProblemList createBookmarksList(String userId) {
        return this.listRepository.save(ProblemList.builder()
                .userId(userId)
                .name(BOOKMARKS_NAME)
                .description("Problems you starred")
                .system(true)
                .problemIds(new ArrayList<>())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
    }

    /** Reserved name + per-account uniqueness (excluding the list itself). */
    private void assertNameAllowed(String userId, String name, String currentListId) {
        if (BOOKMARKS_NAME.equals(name)) {
            throw new BadRequestException(
                    "'" + BOOKMARKS_NAME + "' is reserved for starred problems");
        }
        this.listRepository.findByUserIdAndName(userId, name)
                .filter(existing -> !existing.getId().equals(currentListId))
                .ifPresent(existing -> {
                    throw new BadRequestException(
                            "You already have a list named '" + name + "'");
                });
    }

    /** Only published, non-deleted problems can enter a list. */
    private Problem findVisibleProblem(String problemId) {
        return this.problemRepository.findById(problemId)
                .filter(problem -> !problem.isDeleted() && problem.isPublished())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Published problem not found: " + problemId));
    }

    /** Ids -> summaries in list order; ids that vanished are skipped. */
    private List<ProblemSummaryResponse> hydrate(List<String> problemIds) {
        if (problemIds == null || problemIds.isEmpty()) {
            return List.of();
        }
        Map<String, Problem> byId = this.problemRepository.findAllById(problemIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        Problem::getId, problem -> problem, (first, second) -> first));

        return problemIds.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .filter(problem -> !problem.isDeleted())
                .map(ProblemSummaryResponse::from)
                .toList();
    }

    private ProblemListResponse toResponse(ProblemList list) {
        List<String> ids = list.getProblemIds() == null ? List.of() : List.copyOf(list.getProblemIds());
        return new ProblemListResponse(
                list.getId(),
                list.getName(),
                list.getDescription(),
                list.isSystem(),
                ids.size(),
                ids,
                list.getCreatedAt(),
                list.getUpdatedAt());
    }
}
