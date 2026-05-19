package com.project.netops.dto.response;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TaskResponse {
    private Long taskId;
    private Integer userId;
    private Long relatedEntityId;
    private String description;
    private LocalDate dueDate;
    private String status;
}
