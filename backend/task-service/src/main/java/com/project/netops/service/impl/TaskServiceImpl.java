package com.project.netops.service.impl;

import com.project.netops.dto.request.TaskRequest;
import com.project.netops.dto.response.TaskResponse;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.TaskMapper;
import com.project.netops.model.Task;
import com.project.netops.model.User;
import com.project.netops.repository.TaskRepository;
import com.project.netops.repository.UserRepo;
import com.project.netops.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepo userRepo;
    private final TaskMapper taskMapper;

    @Override
    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        User user = userRepo.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Task.Status status = request.getStatus() != null
                ? Task.Status.valueOf(request.getStatus().toUpperCase())
                : Task.Status.PENDING;

        Task task = Task.builder()
                .user(user)
                .relatedEntityId(request.getRelatedEntityId())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .status(status)
                .build();

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByUser(Integer userId) {
        return taskRepository.findByUser_UserId(userId).stream()
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getPendingTasksByUser(Integer userId) {
        return taskRepository.findByUser_UserIdAndStatus(userId, Task.Status.PENDING).stream()
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskResponse updateTaskStatus(Long taskId, String status) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));
        task.setStatus(Task.Status.valueOf(status.toUpperCase()));
        return taskMapper.toResponse(taskRepository.save(task));
    }
}
