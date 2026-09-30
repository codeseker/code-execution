package com.example.codeexecution.modules.list.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Body of {@code POST /users/me/lists/{id}/problems}. */
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class AddProblemDTO {

    @NotBlank(message = "problemId must not be blank")
    private String problemId;
}
