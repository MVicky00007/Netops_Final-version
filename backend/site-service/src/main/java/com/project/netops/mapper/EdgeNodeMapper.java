package com.project.netops.mapper;

import com.project.netops.dto.request.EdgeNodeRequestDTO;
import com.project.netops.dto.response.EdgeNodeResponseDTO;
import com.project.netops.model.EdgeNode;
import org.springframework.stereotype.Component;

@Component
public class EdgeNodeMapper {

    // RequestDTO → Entity
    public EdgeNode toEntity(EdgeNodeRequestDTO dto) {
        EdgeNode node = new EdgeNode();
        node.setHostname(dto.getHostname());
        node.setModel(dto.getModel());
        node.setSerialNumber(dto.getSerialNumber());
        node.setInstalledAt(dto.getInstalledAt());
        node.setStatus(EdgeNode.Status.valueOf(dto.getStatus()));
        // site is set separately in service
        return node;
    }

    // Entity → ResponseDTO
    public EdgeNodeResponseDTO toResponseDTO(EdgeNode node) {
        EdgeNodeResponseDTO dto = new EdgeNodeResponseDTO();
        dto.setNodeId(node.getNodeId());
        dto.setSiteId(node.getSite().getSiteId());
        dto.setSiteName(node.getSite().getName());
        dto.setHostname(node.getHostname());
        dto.setModel(node.getModel());
        dto.setSerialNumber(node.getSerialNumber());
        dto.setInstalledAt(node.getInstalledAt());
        dto.setStatus(node.getStatus().name());
        return dto;
    }

    // Update existing Entity from RequestDTO (for PUT)
    public void updateEntityFromRequest(EdgeNodeRequestDTO dto, EdgeNode node) {
        if (dto.getHostname()     != null) node.setHostname(dto.getHostname());
        if (dto.getModel()        != null) node.setModel(dto.getModel());
        if (dto.getSerialNumber() != null) node.setSerialNumber(dto.getSerialNumber());
        if (dto.getInstalledAt()  != null) node.setInstalledAt(dto.getInstalledAt());
        if (dto.getStatus()       != null) node.setStatus(EdgeNode.Status.valueOf(dto.getStatus()));
    }
}
