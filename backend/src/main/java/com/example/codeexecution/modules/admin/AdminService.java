package com.example.codeexecution.modules.admin;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.example.codeexecution.common.exceptions.BadRequestException;
import com.example.codeexecution.common.responses.PaginationMeta;
import com.example.codeexecution.modules.admin.dtos.AdminStatsResponse;
import com.example.codeexecution.modules.admin.dtos.AdminStatsResponse.ProblemStats;
import com.example.codeexecution.modules.admin.dtos.AdminStatsResponse.SubmissionStats;
import com.example.codeexecution.modules.admin.dtos.AdminStatsResponse.UserStats;
import com.example.codeexecution.modules.admin.dtos.AdminUserQueryDTO;
import com.example.codeexecution.modules.admin.dtos.AdminUserResponse;
import com.example.codeexecution.modules.auth.entities.User;
import com.example.codeexecution.modules.auth.entities.UserStatus;
import com.example.codeexecution.modules.problem.entities.Problem;
import com.example.codeexecution.modules.rbac.RoleRepository;
import com.example.codeexecution.modules.rbac.entities.Role;
import com.example.codeexecution.modules.submission.entities.Submission;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;

/**
 * Backing service for the admin dashboard ({@code user:manage}).
 *
 * <ul>
 *   <li>{@code listUsers} - paginated user directory with search and
 *       status/role filters; secret fields never leave the service.</li>
 *   <li>{@code stats} - aggregate counters over users, problems and
 *       submissions for the dashboard landing view.</li>
 * </ul>
 */
@Service
public class AdminService {

    private static final int MAX_LIMIT = 100;

    /** Stored enum values of {@code submission_results.overallVerdict}. */
    private static final String VERDICT_ACCEPTED = "ACCEPTED";

    private final RoleRepository roleRepository;
    private final MongoTemplate mongoTemplate;

    public AdminService(RoleRepository roleRepository, MongoTemplate mongoTemplate) {
        this.roleRepository = roleRepository;
        this.mongoTemplate = mongoTemplate;
    }

    /** Paginated user directory, newest accounts first. */
    public AdminUserPage listUsers(AdminUserQueryDTO query) {
        int page = Math.max(1, query.getPage());
        int limit = Math.min(MAX_LIMIT, Math.max(1, query.getLimit()));

        List<Criteria> conditions = new ArrayList<>();
        if (!query.isIncludeDeleted()) {
            // ne(true) also matches legacy documents without the field.
            conditions.add(Criteria.where("isDeleted").ne(true));
        }
        if (query.getSearch() != null && !query.getSearch().isBlank()) {
            String pattern = java.util.regex.Pattern.quote(query.getSearch().trim());
            conditions.add(new Criteria().orOperator(
                    Criteria.where("username").regex(pattern, "i"),
                    Criteria.where("email").regex(pattern, "i")));
        }
        if (query.getStatus() != null && !query.getStatus().isBlank()) {
            conditions.add(Criteria.where("status").is(parseStatus(query.getStatus())));
        }
        if (query.getRoleId() != null && !query.getRoleId().isBlank()) {
            conditions.add(Criteria.where("roleId").is(query.getRoleId().trim()));
        }

        Criteria criteria = conditions.isEmpty()
                ? new Criteria()
                : new Criteria().andOperator(conditions.toArray(new Criteria[0]));

        long total = this.mongoTemplate.count(Query.query(criteria), User.class);
        List<User> users = this.mongoTemplate.find(
                Query.query(criteria)
                        .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                        .skip((long) (page - 1) * limit)
                        .limit(limit),
                User.class);

        Map<String, String> roleNames = this.roleRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(
                        Role::getId, Role::getName, (first, second) -> first));

        List<AdminUserResponse> items = users.stream()
                .map(user -> new AdminUserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getStatus(),
                        user.getRoleId(),
                        user.getRoleId() == null ? null : roleNames.get(user.getRoleId()),
                        user.isDeleted(),
                        user.getCreatedAt(),
                        user.getUpdatedAt()))
                .toList();

        int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / limit);
        return new AdminUserPage(items, new PaginationMeta(page, limit, total, totalPages));
    }

    /** Aggregate counters for {@code GET /admin/stats}. */
    public AdminStatsResponse stats() {
        return new AdminStatsResponse(
                new UserStats(
                        countUsers(null, false),
                        countUsers(UserStatus.ACTIVE, false),
                        countUsers(UserStatus.PENDING, false),
                        countUsers(null, true)),
                new ProblemStats(
                        this.mongoTemplate.count(
                                Query.query(Criteria.where("isDeleted").is(false)),
                                Problem.class),
                        this.mongoTemplate.count(
                                Query.query(Criteria.where("isDeleted").is(false)
                                        .and("isPublished").is(true)),
                                Problem.class)),
                new SubmissionStats(
                        this.mongoTemplate.count(Query.query(new Criteria()), Submission.class),
                        countSubmissions(SubmissionStatus.QUEUED),
                        countSubmissions(SubmissionStatus.PROCESSING),
                        countSubmissions(SubmissionStatus.COMPLETED),
                        countSubmissions(SubmissionStatus.FAILED),
                        countAcceptedFullSubmissions()));
    }

    /**
     * ACCEPTED verdicts among completed full submissions. The submissions
     * are joined against their result documents with a {@code $lookup}
     * so example evaluations and custom runs never inflate the number.
     *
     * <p>{@code submissions._id} is written as an ObjectId by the Mongo
     * converter while {@code submission_results.submissionId} stays a
     * plain string, so {@code _id} is stringified first - a raw join of
     * ObjectId against String silently matches nothing.
     */
    private long countAcceptedFullSubmissions() {
        List<Document> pipeline = List.of(
                new Document("$match", new Document("type", "FULL_SUBMISSION")
                        .append("status", SubmissionStatus.COMPLETED.name())),
                new Document("$addFields", new Document(
                        "_idStr", new Document("$toString", "$_id"))),
                new Document("$lookup", new Document("from", "submission_results")
                        .append("localField", "_idStr")
                        .append("foreignField", "submissionId")
                        .append("as", "results")),
                new Document("$unwind", "$results"),
                new Document("$match", new Document(
                        "results.overallVerdict", VERDICT_ACCEPTED)),
                new Document("$group", new Document("_id", "$_id")),
                new Document("$count", "count"));

        List<Document> rows = this.mongoTemplate
                .getCollection("submissions")
                .aggregate(pipeline)
                .into(new ArrayList<>());

        if (rows.isEmpty()) {
            return 0L;
        }
        Object count = rows.getFirst().get("count");
        return count instanceof Number number ? number.longValue() : 0L;
    }

    private long countUsers(UserStatus status, boolean deleted) {
        Criteria criteria = deleted
                ? Criteria.where("isDeleted").is(true)
                : Criteria.where("isDeleted").ne(true);
        if (status != null) {
            criteria = criteria.and("status").is(status);
        }
        return this.mongoTemplate.count(Query.query(criteria), User.class);
    }

    private long countSubmissions(SubmissionStatus status) {
        return this.mongoTemplate.count(
                Query.query(Criteria.where("status").is(status)), Submission.class);
    }

    private static UserStatus parseStatus(String value) {
        try {
            return UserStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("status must be one of PENDING, ACTIVE");
        }
    }

    /** Page payload for {@code GET /admin/users}. */
    public record AdminUserPage(
            List<AdminUserResponse> users,
            PaginationMeta pagination) {
    }
}
