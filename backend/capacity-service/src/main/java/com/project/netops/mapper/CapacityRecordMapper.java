package com.project.netops.mapper;

import com.project.netops.dto.response.CapacityRecordResponse;
import com.project.netops.model.CapacityRecord;
import org.springframework.stereotype.Component;

@Component
public class CapacityRecordMapper {

    public CapacityRecordResponse toResponse(CapacityRecord record) {
        return CapacityRecordResponse.builder()
                .capacityId(record.getCapacityId())
                .siteId(record.getSite().getSiteId())
                .interfaceId(record.getIface().getInterfaceId())
                .measuredCapacityMbps(record.getMeasuredCapacityMbps())
                .measuredAt(record.getMeasuredAt())
                .recordedBy(record.getRecordedBy().getUserId().longValue())
                .build();
    }
}
