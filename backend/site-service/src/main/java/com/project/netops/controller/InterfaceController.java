package com.project.netops.controller;

import com.project.netops.dto.request.InterfaceRequestDTO;
import com.project.netops.dto.response.InterfaceResponseDTO;
import com.project.netops.service.impl.InterfaceServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class InterfaceController {

    @Autowired
    private InterfaceServiceImpl interfaceService;

    @PostMapping("/nodes/{nodeID}/interfaces")
    public ResponseEntity<InterfaceResponseDTO> createInterface(@PathVariable Long nodeID,@RequestBody InterfaceRequestDTO dto) 
    {
        return ResponseEntity.ok(interfaceService.createInterface(nodeID, dto));
    }

    @GetMapping("/nodes/{nodeID}/interfaces")
    public ResponseEntity<List<InterfaceResponseDTO>> getInterfaces(@PathVariable Long nodeID) {
        return ResponseEntity.ok(interfaceService.getInterfacesByNode(nodeID));
    }

    @PutMapping("/interfaces/{ifaceID}")
    public ResponseEntity<InterfaceResponseDTO> updateInterface(@PathVariable Long ifaceID,@RequestBody InterfaceRequestDTO dto) 
    {
        return ResponseEntity.ok(interfaceService.updateInterface(ifaceID, dto));
    }
}
