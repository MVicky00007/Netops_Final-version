package com.project.netops.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.project.netops.model.User;
import java.util.List;

@Repository
public interface UserRepo extends JpaRepository<User, Integer> {
    public User findByEmail(String email);
    public List<User> findByStatus(User.Status status);
}
