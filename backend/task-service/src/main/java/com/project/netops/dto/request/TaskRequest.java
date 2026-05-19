package com.project.netops.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TaskRequest {
    @NotNull(message = "User ID is required") private Integer userId;
    private Long relatedEntityId;
    @NotBlank(message = "Description is required") private String description;
    private LocalDate dueDate;
    private String status;
}
