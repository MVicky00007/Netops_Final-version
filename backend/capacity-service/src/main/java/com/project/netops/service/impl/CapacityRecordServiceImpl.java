package com.project.netops.service.impl;

import com.project.netops.dto.response.CapacityRecordResponse;
import com.project.netops.exception.ResourceNotFoundException;
import com.project.netops.mapper.CapacityRecordMapper;
import com.project.netops.model.*;
import com.project.netops.repository.*;
import com.project.netops.service.AuditLogService;
import com.project.netops.service.CapacityRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CapacityRecordServiceImpl implements CapacityRecordService {

    private final CapacityRecordRepository recordRepository;
    private final SiteRepository siteRepository;
    private final InterfaceRepository interfaceRepository;
    private final UserRepo userRepository;
    private final AuditLogService auditLogService;
    private final CapacityRecordMapper mapper;

    @Override
    @Transactional
    public CapacityRecordResponse recordMeasurement(Long siteId, Long interfaceId,
                                                     Double measuredCapacityMbps, Long recordedById) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new ResourceNotFoundException("Site not found."));
        Interface iface = interfaceRepository.findById(interfaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Interface not found."));
        User recordedBy = userRepository.findById(recordedById.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        CapacityRecord record = CapacityRecord.builder()
                .site(site)
                .iface(iface)
                .measuredCapacityMbps(measuredCapacityMbps)
                .recordedBy(recordedBy)
                .build();

        CapacityRecord saved = recordRepository.save(record);

        auditLogService.logAction(recordedById, "RECORD_CAPACITY_MEASUREMENT",
                "CapacityRecord", saved.getCapacityId(),
                "Measured " + measuredCapacityMbps + " Mbps on interfaceId " + interfaceId);

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CapacityRecordResponse> listRecords(Long siteId, Long interfaceId) {
        List<CapacityRecord> records;
        if (siteId != null && interfaceId != null) {
            records = recordRepository.findBySiteSiteIdAndIfaceInterfaceId(siteId, interfaceId);
        } else if (siteId != null) {
            records = recordRepository.findBySiteSiteId(siteId);
        } else if (interfaceId != null) {
            records = recordRepository.findByIfaceInterfaceId(interfaceId);
        } else {
            records = recordRepository.findAll();
        }
        return records.stream().map(mapper::toResponse).collect(Collectors.toList());
    }
}
