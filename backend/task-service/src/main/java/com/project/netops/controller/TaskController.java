package com.project.netops.controller;

import com.project.netops.api.APIResponse;
import com.project.netops.dto.request.TaskRequest;
import com.project.netops.dto.response.TaskResponse;
import com.project.netops.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<APIResponse<TaskResponse>> createTask(
            @Valid @RequestBody TaskRequest request) {
        return new ResponseEntity<>(
                new APIResponse<>("SUCCESS", "Task created", taskService.createTask(request)),
                HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<APIResponse<List<TaskResponse>>> getTasksByUser(
            @PathVariable Integer userId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched tasks",
                taskService.getTasksByUser(userId)));
    }

    @GetMapping("/user/{userId}/pending")
    public ResponseEntity<APIResponse<List<TaskResponse>>> getPendingTasksByUser(
            @PathVariable Integer userId) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Fetched pending tasks",
                taskService.getPendingTasksByUser(userId)));
    }

    @PatchMapping("/{taskId}/status")
    public ResponseEntity<APIResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestParam String status) {
        return ResponseEntity.ok(new APIResponse<>("SUCCESS", "Task status updated",
                taskService.updateTaskStatus(taskId, status)));
    }
}
