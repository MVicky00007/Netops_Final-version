package com.project.netops.repository;

import com.project.netops.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUser_UserId(Integer userId);
    List<Task> findByUser_UserIdAndStatus(Integer userId, Task.Status status);
}
