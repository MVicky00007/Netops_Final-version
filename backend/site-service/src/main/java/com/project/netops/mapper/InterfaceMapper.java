package com.project.netops.mapper;

import com.project.netops.dto.request.InterfaceRequestDTO;
import com.project.netops.dto.response.InterfaceResponseDTO;
import com.project.netops.model.Interface;
import org.springframework.stereotype.Component;

@Component
public class InterfaceMapper {

    // RequestDTO → Entity
    public Interface toEntity(InterfaceRequestDTO dto) {
        Interface iface = new Interface();
        iface.setName(dto.getName());
        iface.setType(Interface.Type.valueOf(dto.getType()));
        iface.setCapacityMbps(dto.getCapacityMbps());
        iface.setAdminStatus(Interface.AdminStatus.valueOf(dto.getAdminStatus()));
        iface.setOperStatus(Interface.OperStatus.valueOf(dto.getOperStatus()));
        // node is set separately in service
        return iface;
    }

    // Entity → ResponseDTO
    public InterfaceResponseDTO toResponseDTO(Interface iface) {
        InterfaceResponseDTO dto = new InterfaceResponseDTO();
        dto.setInterfaceId(iface.getInterfaceId());
        dto.setNodeId(iface.getNode().getNodeId());
        dto.setNodeName(iface.getNode().getHostname());
        dto.setName(iface.getName());
        dto.setType(iface.getType().name());
        dto.setCapacityMbps(iface.getCapacityMbps());
        dto.setAdminStatus(iface.getAdminStatus().name());
        dto.setOperStatus(iface.getOperStatus().name());
        return dto;
    }

    // Update existing Entity from RequestDTO (for PUT)
    public void updateEntityFromRequest(InterfaceRequestDTO dto, Interface iface) {
        if (dto.getName()         != null) iface.setName(dto.getName());
        if (dto.getType()         != null) iface.setType(Interface.Type.valueOf(dto.getType()));
        if (dto.getCapacityMbps() != null) iface.setCapacityMbps(dto.getCapacityMbps());
        if (dto.getAdminStatus()  != null) iface.setAdminStatus(Interface.AdminStatus.valueOf(dto.getAdminStatus()));
        if (dto.getOperStatus()   != null) iface.setOperStatus(Interface.OperStatus.valueOf(dto.getOperStatus()));
    }
}
