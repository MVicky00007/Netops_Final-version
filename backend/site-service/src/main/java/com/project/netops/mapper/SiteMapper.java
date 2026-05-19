package com.project.netops.mapper;

import com.project.netops.dto.request.SiteRequestDTO;
import com.project.netops.dto.response.SiteResponseDTO;
import com.project.netops.model.Site;
import org.springframework.stereotype.Component;

@Component
public class SiteMapper {

    // RequestDTO → Entity
    public Site toEntity(SiteRequestDTO dto) {
        Site site = new Site();
        site.setSiteCode(dto.getSiteCode());
        site.setName(dto.getName());
        site.setRegion(dto.getRegion());
        site.setAddress(dto.getAddress());
        site.setLatitude(dto.getLatitude());
        site.setLongitude(dto.getLongitude());
        site.setStatus(Site.Status.valueOf(dto.getStatus()));
        return site;
    }

    // Entity → ResponseDTO
    public SiteResponseDTO toResponseDTO(Site site) {
        SiteResponseDTO dto = new SiteResponseDTO();
        dto.setSiteId(site.getSiteId());
        dto.setSiteCode(site.getSiteCode());
        dto.setName(site.getName());
        dto.setRegion(site.getRegion());
        dto.setAddress(site.getAddress());
        dto.setLatitude(site.getLatitude());
        dto.setLongitude(site.getLongitude());
        dto.setStatus(site.getStatus().name());
        return dto;
    }

    // Update existing Entity from RequestDTO (for PUT)
    public void updateEntityFromRequest(SiteRequestDTO dto, Site site) {
        if (dto.getSiteCode() != null) site.setSiteCode(dto.getSiteCode());
        if (dto.getName()     != null) site.setName(dto.getName());
        if (dto.getRegion()   != null) site.setRegion(dto.getRegion());
        if (dto.getAddress()  != null) site.setAddress(dto.getAddress());
        if (dto.getLatitude() != null) site.setLatitude(dto.getLatitude());
        if (dto.getLongitude()!= null) site.setLongitude(dto.getLongitude());
        if (dto.getStatus()   != null) site.setStatus(Site.Status.valueOf(dto.getStatus()));
    }
}
