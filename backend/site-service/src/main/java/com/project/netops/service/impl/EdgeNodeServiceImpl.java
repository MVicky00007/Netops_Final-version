package com.project.netops.service.impl;

import com.project.netops.dto.request.EdgeNodeRequestDTO;
import com.project.netops.dto.response.EdgeNodeResponseDTO;
import com.project.netops.exception.BadRequestException;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.EdgeNodeMapper;
import com.project.netops.model.EdgeNode;
import com.project.netops.model.Site;
import com.project.netops.repository.EdgeNodeRepository;
import com.project.netops.repository.SiteRepository;
import com.project.netops.service.EdgeNodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class EdgeNodeServiceImpl implements EdgeNodeService {

    @Autowired
    private EdgeNodeRepository nodeRepository;

    @Autowired
    private SiteRepository siteRepository;

    @Autowired
    private EdgeNodeMapper edgeNodeMapper;

    @Override
    public List<EdgeNodeResponseDTO> getNodesBySite(Long siteID) {
        return nodeRepository.findBySite_SiteId(siteID)
                .stream()
                .map(edgeNodeMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<EdgeNodeResponseDTO> getNodeById(Long id) {
        return nodeRepository.findById(id)
                .map(edgeNodeMapper::toResponseDTO);
    }

    @Override
    public EdgeNodeResponseDTO createNode(Long siteID, EdgeNodeRequestDTO dto) {
        if (dto.getHostname() == null || dto.getHostname().isEmpty()) {
            throw new BadRequestException("Hostname cannot be empty");
        }
        Site site = siteRepository.findById(siteID)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found with ID: " + siteID));
        EdgeNode node = edgeNodeMapper.toEntity(dto);
        node.setSite(site);
        return edgeNodeMapper.toResponseDTO(nodeRepository.save(node));
    }

    @Override
    public EdgeNodeResponseDTO updateNode(Long id, EdgeNodeRequestDTO dto) {
        EdgeNode existing = nodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Node not found with ID: " + id));
        edgeNodeMapper.updateEntityFromRequest(dto, existing);
        return edgeNodeMapper.toResponseDTO(nodeRepository.save(existing));
    }
}
