package com.example.codeexecution.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Spring Boot 4 auto-configures the Jackson 3 ({@code tools.jackson})
 * mapper for HTTP message conversion, but the queue payloads and
 * WebSocket frames in this project use the Jackson 2 API that ships with
 * docker-java. Expose a single shared {@link ObjectMapper} bean so those
 * services can inject one instance instead of creating their own.
 */
@Configuration
public class JsonConfig {

    @Bean
    public ObjectMapper eventObjectMapper() {
        return new ObjectMapper();
    }
}
