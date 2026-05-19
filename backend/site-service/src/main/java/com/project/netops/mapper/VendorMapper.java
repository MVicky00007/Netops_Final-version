package com.project.netops.mapper;

import com.project.netops.dto.response.VendorResponseDTO;
import com.project.netops.model.VendorRecord;
import org.springframework.stereotype.Component;

@Component
public class VendorMapper {

    // Entity → ResponseDTO (Vendor is read-only, no RequestDTO needed)
    public VendorResponseDTO toResponseDTO(VendorRecord vendor) {
        VendorResponseDTO dto = new VendorResponseDTO();
        dto.setVendorId(vendor.getVendorId());
        dto.setName(vendor.getName());
        dto.setContactInfo(vendor.getContactInfo());
        dto.setContractRef(vendor.getContractRef());
        dto.setStatus(vendor.getStatus().name());
        return dto;
    }
}
