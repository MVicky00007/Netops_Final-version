package com.project.netops.service.impl;

import com.project.netops.dto.request.InterfaceRequestDTO;
import com.project.netops.dto.response.InterfaceResponseDTO;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.InterfaceMapper;
import com.project.netops.model.EdgeNode;
import com.project.netops.model.Interface;
import com.project.netops.repository.EdgeNodeRepository;
import com.project.netops.repository.InterfaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.project.netops.service.InterfaceService;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InterfaceServiceImpl implements InterfaceService {

    @Autowired
    private InterfaceRepository interfaceRepository;

    @Autowired
    private EdgeNodeRepository nodeRepository;

    @Autowired
    private InterfaceMapper interfaceMapper;

    @Override
    public List<InterfaceResponseDTO> getInterfacesByNode(Long nodeID) {
        if (!nodeRepository.existsById(nodeID)) {
            throw new ResourceNotFoundException("Node not found with ID: " + nodeID);
        }
        return interfaceRepository.findByNode_NodeId(nodeID)
                .stream()
                .map(interfaceMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public InterfaceResponseDTO updateInterface(Long id, InterfaceRequestDTO dto) {
        Interface existing = interfaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interface not found with ID: " + id));
        interfaceMapper.updateEntityFromRequest(dto, existing);
        return interfaceMapper.toResponseDTO(interfaceRepository.save(existing));
    }

    @Override
    public InterfaceResponseDTO createInterface(Long nodeID, InterfaceRequestDTO dto) 
    {
        EdgeNode node = nodeRepository.findById(nodeID).orElseThrow(() -> new ResourceNotFoundException("Node not found with ID: " + nodeID));
        Interface iface = interfaceMapper.toEntity(dto);
        iface.setNode(node);
        return interfaceMapper.toResponseDTO(interfaceRepository.save(iface));
    }
}
