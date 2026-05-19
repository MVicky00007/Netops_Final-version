package com.project.netops.service.impl;

import com.project.netops.dto.response.VendorResponseDTO;
import com.project.netops.mapper.VendorMapper;
import com.project.netops.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VendorService {

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private VendorMapper vendorMapper;

    public List<VendorResponseDTO> getAllVendors() {
        return vendorRepository.findAll()
                .stream()
                .map(vendorMapper::toResponseDTO)
                .collect(Collectors.toList());
    }
}
