package com.project.netops.repository;

import com.project.netops.model.Interface;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterfaceRepository extends JpaRepository<Interface, Long> {
    List<Interface> findByNode_NodeId(Long nodeId);
}
