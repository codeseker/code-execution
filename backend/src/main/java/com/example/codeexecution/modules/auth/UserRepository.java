package com.example.codeexecution.modules.auth;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.codeexecution.modules.auth.entities.User;

public interface  UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPasswordResetToken(String passwordResetToken);

}
