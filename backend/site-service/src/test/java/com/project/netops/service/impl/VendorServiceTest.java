package com.project.netops.service.impl;

import com.project.netops.dto.response.VendorResponseDTO;
import com.project.netops.mapper.VendorMapper;
import com.project.netops.model.VendorRecord;
import com.project.netops.repository.VendorRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VendorServiceTest {

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private VendorMapper vendorMapper;

    @InjectMocks
    private VendorService vendorService;

    @Test
    @DisplayName("getAllVendors maps every vendor record through the mapper")
    void getAllVendors_returnsMappedList() {
        VendorRecord v1 = VendorRecord.builder()
                .vendorId(1L).name("Acme")
                .status(VendorRecord.Status.ACTIVE).build();
        VendorRecord v2 = VendorRecord.builder()
                .vendorId(2L).name("Globex")
                .status(VendorRecord.Status.EXPIRED).build();

        VendorResponseDTO d1 = VendorResponseDTO.builder()
                .vendorId(1L).name("Acme").status("ACTIVE").build();
        VendorResponseDTO d2 = VendorResponseDTO.builder()
                .vendorId(2L).name("Globex").status("EXPIRED").build();

        when(vendorRepository.findAll()).thenReturn(List.of(v1, v2));
        when(vendorMapper.toResponseDTO(v1)).thenReturn(d1);
        when(vendorMapper.toResponseDTO(v2)).thenReturn(d2);

        List<VendorResponseDTO> result = vendorService.getAllVendors();

        assertEquals(2, result.size());
        assertEquals("Acme", result.get(0).getName());
        assertEquals("Globex", result.get(1).getName());
        verify(vendorRepository, times(1)).findAll();
        verify(vendorMapper).toResponseDTO(v1);
        verify(vendorMapper).toResponseDTO(v2);
    }

    @Test
    @DisplayName("getAllVendors returns an empty list when no vendors exist")
    void getAllVendors_returnsEmptyList() {
        when(vendorRepository.findAll()).thenReturn(Collections.emptyList());
        assertTrue(vendorService.getAllVendors().isEmpty());
    }
}
