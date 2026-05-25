package com.project.netops.mapper;

import com.project.netops.dto.response.CapacityRecordResponse;
import com.project.netops.model.CapacityRecord;
import org.springframework.stereotype.Component;

@Component
public class CapacityRecordMapper {

    /**
     * Resolves names from the joined Site / Interface / User so the frontend
     * table doesn't have to round-trip per row. Also exposes the interface's
     * rated capacity so the UI can render a measured/plan utilisation chip.
     */
    public CapacityRecordResponse toResponse(CapacityRecord record) {
        var b = CapacityRecordResponse.builder()
                .capacityId(record.getCapacityId())
                .measuredCapacityMbps(record.getMeasuredCapacityMbps())
                .measuredAt(record.getMeasuredAt());

        if (record.getSite() != null) {
            b.siteId(record.getSite().getSiteId())
             .siteCode(record.getSite().getSiteCode())
             .siteName(record.getSite().getName());
        }
        if (record.getIface() != null) {
            b.interfaceId(record.getIface().getInterfaceId())
             .interfaceName(record.getIface().getName())
             .interfaceCapacityMbps(record.getIface().getCapacityMbps());
        }
        if (record.getRecordedBy() != null) {
            b.recordedBy(record.getRecordedBy().getUserId().longValue())
             .recordedByName(record.getRecordedBy().getName());
        }

        return b.build();
    }
}
