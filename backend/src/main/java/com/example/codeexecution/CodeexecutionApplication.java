package com.example.codeexecution;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class CodeexecutionApplication {
	private final Environment env;

	CodeexecutionApplication(Environment env) {
		this.env = env;
	}
	public static void main(String[] args) {
		SpringApplication.run(CodeexecutionApplication.class, args);
	}

}
