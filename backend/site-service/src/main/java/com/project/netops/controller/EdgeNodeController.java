package com.project.netops.controller;

import com.project.netops.dto.request.EdgeNodeRequestDTO;
import com.project.netops.dto.response.EdgeNodeResponseDTO;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.service.EdgeNodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class EdgeNodeController {

    @Autowired
    private EdgeNodeService nodeService;

    @PostMapping("/nodes")
    public ResponseEntity<EdgeNodeResponseDTO> createNode(
            @RequestParam Long siteID,
            @RequestBody EdgeNodeRequestDTO dto) {
        return ResponseEntity.ok(nodeService.createNode(siteID, dto));
    }

    @GetMapping("/nodes/{nodeID}")
    public ResponseEntity<EdgeNodeResponseDTO> getNode(@PathVariable Long nodeID) {
        return ResponseEntity.ok(
            nodeService.getNodeById(nodeID)
                .orElseThrow(() -> new ResourceNotFoundException("Node not found with ID: " + nodeID))
        );
    }

    @PutMapping("/nodes/{nodeID}")
    public ResponseEntity<EdgeNodeResponseDTO> updateNode(
            @PathVariable Long nodeID,
            @RequestBody EdgeNodeRequestDTO dto) {
        return ResponseEntity.ok(nodeService.updateNode(nodeID, dto));
    }

    @GetMapping("/sites/{siteID}/nodes")
    public ResponseEntity<List<EdgeNodeResponseDTO>> getNodesBySite(@PathVariable Long siteID) {
        return ResponseEntity.ok(nodeService.getNodesBySite(siteID));
    }
}
