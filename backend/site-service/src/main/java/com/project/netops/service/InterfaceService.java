package com.project.netops.service;

import com.project.netops.dto.request.InterfaceRequestDTO;
import com.project.netops.dto.response.InterfaceResponseDTO;
import java.util.List;

public interface InterfaceService {
    
    List<InterfaceResponseDTO> getInterfacesByNode(Long nodeID);
    InterfaceResponseDTO updateInterface(Long id, InterfaceRequestDTO dto);
    InterfaceResponseDTO createInterface(Long nodeID, InterfaceRequestDTO dto);
}