package com.project.netops.service;

import com.project.netops.dto.request.EdgeNodeRequestDTO;
import com.project.netops.dto.response.EdgeNodeResponseDTO;
import java.util.List;
import java.util.Optional;

public interface EdgeNodeService {
    List<EdgeNodeResponseDTO> getNodesBySite(Long siteID);
    Optional<EdgeNodeResponseDTO> getNodeById(Long id);
    EdgeNodeResponseDTO createNode(Long siteID, EdgeNodeRequestDTO dto);
    EdgeNodeResponseDTO updateNode(Long id, EdgeNodeRequestDTO dto);
}
