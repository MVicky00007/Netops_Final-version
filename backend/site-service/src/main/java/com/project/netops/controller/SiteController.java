package com.project.netops.controller;

import com.project.netops.dto.request.SiteRequestDTO;
import com.project.netops.dto.response.SiteResponseDTO;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.service.impl.SiteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sites")
public class SiteController {

    @Autowired
    private SiteService siteService;

    @GetMapping
    public ResponseEntity<List<SiteResponseDTO>> getAllSites() {
        return ResponseEntity.ok(siteService.getAllSites());
    }

    @GetMapping("/{siteID}")
    public ResponseEntity<SiteResponseDTO> getSite(@PathVariable Long siteID) {
        return ResponseEntity.ok(
            siteService.getSiteById(siteID)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found with ID: " + siteID))
        );
    }

    @PostMapping
    public ResponseEntity<SiteResponseDTO> createSite(@RequestBody SiteRequestDTO dto) {
        return ResponseEntity.ok(siteService.createSite(dto));
    }

    @PutMapping("/{siteID}")
    public ResponseEntity<SiteResponseDTO> updateSite(
            @PathVariable Long siteID,
            @RequestBody SiteRequestDTO dto) {
        return ResponseEntity.ok(siteService.updateSite(siteID, dto));
    }
}
