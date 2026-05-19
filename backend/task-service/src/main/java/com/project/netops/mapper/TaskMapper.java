package com.project.netops.mapper;

import com.project.netops.dto.response.TaskResponse;
import com.project.netops.model.Task;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public TaskResponse toResponse(Task task) {
        if (task == null) return null;
        return TaskResponse.builder()
                .taskId(task.getTaskId())
                .userId(task.getUser().getUserId())
                .relatedEntityId(task.getRelatedEntityId())
                .description(task.getDescription())
                .dueDate(task.getDueDate())
                .status(task.getStatus().name())
                .build();
    }
}
