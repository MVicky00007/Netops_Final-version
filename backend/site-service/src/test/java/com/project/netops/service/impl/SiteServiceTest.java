package com.project.netops.service.impl;

import com.project.netops.dto.request.SiteRequestDTO;
import com.project.netops.dto.response.SiteResponseDTO;
import com.project.netops.exception.BadRequestException;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.SiteMapper;
import com.project.netops.model.Site;
import com.project.netops.repository.SiteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SiteServiceTest {

    @Mock
    private SiteRepository siteRepository;

    @Mock
    private SiteMapper siteMapper;

    @InjectMocks
    private SiteService siteService;

    private Site site;
    private SiteResponseDTO responseDTO;
    private SiteRequestDTO requestDTO;

    @BeforeEach
    void setUp() {
        site = Site.builder()
                .siteId(1L)
                .siteCode("S-001")
                .name("Chennai DC")
                .region("South")
                .address("Mount Road")
                .latitude(13.08)
                .longitude(80.27)
                .status(Site.Status.ACTIVE)
                .build();

        responseDTO = SiteResponseDTO.builder()
                .siteId(1L)
                .siteCode("S-001")
                .name("Chennai DC")
                .region("South")
                .status("ACTIVE")
                .build();

        requestDTO = SiteRequestDTO.builder()
                .siteCode("S-001")
                .name("Chennai DC")
                .region("South")
                .address("Mount Road")
                .latitude(13.08)
                .longitude(80.27)
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("getAllSites maps every site through the mapper")
    void getAllSites_returnsMappedList() {
        when(siteRepository.findAll()).thenReturn(List.of(site));
        when(siteMapper.toResponseDTO(site)).thenReturn(responseDTO);

        List<SiteResponseDTO> result = siteService.getAllSites();

        assertEquals(1, result.size());
        assertSame(responseDTO, result.get(0));
    }

    @Test
    @DisplayName("getSiteById returns mapped DTO when present")
    void getSiteById_returnsDtoWhenPresent() {
        when(siteRepository.findById(1L)).thenReturn(Optional.of(site));
        when(siteMapper.toResponseDTO(site)).thenReturn(responseDTO);

        Optional<SiteResponseDTO> result = siteService.getSiteById(1L);

        assertTrue(result.isPresent());
        assertEquals("S-001", result.get().getSiteCode());
    }

    @Test
    @DisplayName("getSiteById returns empty Optional when missing")
    void getSiteById_returnsEmptyWhenAbsent() {
        when(siteRepository.findById(42L)).thenReturn(Optional.empty());
        assertTrue(siteService.getSiteById(42L).isEmpty());
    }

    @Test
    @DisplayName("createSite saves a new site and returns its DTO")
    void createSite_savesAndReturnsDto() {
        when(siteMapper.toEntity(requestDTO)).thenReturn(site);
        when(siteRepository.save(site)).thenReturn(site);
        when(siteMapper.toResponseDTO(site)).thenReturn(responseDTO);

        SiteResponseDTO result = siteService.createSite(requestDTO);

        assertSame(responseDTO, result);
        verify(siteRepository).save(site);
    }

    @Test
    @DisplayName("createSite throws when name is empty")
    void createSite_throwsWhenNameEmpty() {
        requestDTO.setName("");
        assertThrows(BadRequestException.class, () -> siteService.createSite(requestDTO));
        verify(siteRepository, never()).save(any());
    }

    @Test
    @DisplayName("createSite throws when name is null")
    void createSite_throwsWhenNameNull() {
        requestDTO.setName(null);
        assertThrows(BadRequestException.class, () -> siteService.createSite(requestDTO));
    }

    @Test
    @DisplayName("createSite throws when siteCode is empty")
    void createSite_throwsWhenSiteCodeEmpty() {
        requestDTO.setSiteCode("");
        assertThrows(BadRequestException.class, () -> siteService.createSite(requestDTO));
    }

    @Test
    @DisplayName("updateSite applies the mapper update and saves")
    void updateSite_appliesUpdate() {
        when(siteRepository.findById(1L)).thenReturn(Optional.of(site));
        when(siteRepository.save(site)).thenReturn(site);
        when(siteMapper.toResponseDTO(site)).thenReturn(responseDTO);

        SiteResponseDTO result = siteService.updateSite(1L, requestDTO);

        assertSame(responseDTO, result);
        verify(siteMapper).updateEntityFromRequest(requestDTO, site);
        verify(siteRepository).save(site);
    }

    @Test
    @DisplayName("updateSite throws ResourceNotFoundException when site is missing")
    void updateSite_throwsWhenMissing() {
        when(siteRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> siteService.updateSite(99L, requestDTO));
        verify(siteRepository, never()).save(any());
    }
}
