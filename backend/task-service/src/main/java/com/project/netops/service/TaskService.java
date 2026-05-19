package com.project.netops.service;

import com.project.netops.dto.request.TaskRequest;
import com.project.netops.dto.response.TaskResponse;
import java.util.List;

public interface TaskService {
    TaskResponse createTask(TaskRequest request);
    List<TaskResponse> getTasksByUser(Integer userId);
    List<TaskResponse> getPendingTasksByUser(Integer userId);
    TaskResponse updateTaskStatus(Long taskId, String status);
}
