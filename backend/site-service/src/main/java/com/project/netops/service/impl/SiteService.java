package com.project.netops.service.impl;

import com.project.netops.dto.request.SiteRequestDTO;
import com.project.netops.dto.response.SiteResponseDTO;
import com.project.netops.exception.BadRequestException;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.SiteMapper;
import com.project.netops.model.Site;
import com.project.netops.repository.SiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SiteService {

    @Autowired
    private SiteRepository siteRepository;

    @Autowired
    private SiteMapper siteMapper;

    public List<SiteResponseDTO> getAllSites() {
        return siteRepository.findAll()
                .stream()
                .map(siteMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    public Optional<SiteResponseDTO> getSiteById(Long id) {
        return siteRepository.findById(id)
                .map(siteMapper::toResponseDTO);
    }

    public SiteResponseDTO createSite(SiteRequestDTO dto) {
        if (dto.getName() == null || dto.getName().isEmpty()) {
            throw new BadRequestException("Site name cannot be empty");
        }
        if (dto.getSiteCode() == null || dto.getSiteCode().isEmpty()) {
            throw new BadRequestException("Site code cannot be empty");
        }
        Site saved = siteRepository.save(siteMapper.toEntity(dto));
        return siteMapper.toResponseDTO(saved);
    }

    public SiteResponseDTO updateSite(Long id, SiteRequestDTO dto) {
        Site existing = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found with ID: " + id));
        siteMapper.updateEntityFromRequest(dto, existing);
        return siteMapper.toResponseDTO(siteRepository.save(existing));
    }
}
