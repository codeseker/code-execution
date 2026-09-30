package com.example.codeexecution.modules.list.entities;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A named, ordered set of problems owned by one user: the generic
 * "problem list" (study plans like "Blind 75") plus the reserved
 * {@code Bookmarks} list that backs the star toggle.
 *
 * Order is significant - problems are appended and shown in insertion
 * order. The unique (userId, name) index keeps list names unambiguous
 * per account.
 */
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@Document(collection = "problem_lists")
@CompoundIndex(name = "user_name_unique", def = "{'userId': 1, 'name': 1}", unique = true)
public class ProblemList {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String name;

    private String description;

    /**
     * True for the reserved Bookmarks list: it cannot be renamed or
     * deleted, and is created lazily on the first bookmark.
     */
    @Builder.Default
    private boolean system = false;

    /** Problem ids in insertion order. */
    @Builder.Default
    private List<String> problemIds = new ArrayList<>();

    /** Set manually: Mongo auditing is not enabled in this app. */
    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
