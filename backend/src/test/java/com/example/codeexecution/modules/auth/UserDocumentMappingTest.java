package com.example.codeexecution.modules.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.example.codeexecution.modules.auth.entities.User;
import com.example.codeexecution.modules.auth.entities.UserStatus;

/**
 * Guards the mapping between the {@link User} entity and the {@code users}
 * Mongo document: every auth field must be written under the exact key the
 * API expects - especially {@code isDeleted}, whose boolean getter/setter
 * naming is easy to get wrong.
 */
@SpringBootTest
class UserDocumentMappingTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Test
    void authFieldsAreWrittenUnderTheExpectedDocumentKeys() {
        User user = User.builder()
                .id("user-1")
                .username("ayush")
                .email("ayush@example.com")
                .password("hashed-password")
                .status(UserStatus.PENDING)
                .isDeleted(false)
                .passwordResetToken("reset-token-123")
                .passwordResetExpires(Instant.now().plusSeconds(900))
                .refreshToken("jwt-refresh-token")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Document document = new Document();
        this.mongoTemplate.getConverter().write(user, document);

        List<String> requiredKeys = List.of(
                "status",
                "isDeleted",
                "passwordResetToken",
                "passwordResetExpires",
                "refreshToken");

        assertTrue(document.keySet().containsAll(requiredKeys),
                () -> "Missing auth fields in the users document. Written keys: " + document.keySet());

        assertEquals("PENDING", document.getString("status"));
        assertEquals(Boolean.FALSE, document.getBoolean("isDeleted"));
        assertEquals("reset-token-123", document.getString("passwordResetToken"));
        assertEquals("jwt-refresh-token", document.getString("refreshToken"));
    }
}
