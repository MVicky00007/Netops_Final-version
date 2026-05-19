package com.project.netops.service;

import com.project.netops.dto.response.CapacityRecordResponse;
import java.util.List;

public interface CapacityRecordService {
    CapacityRecordResponse recordMeasurement(Long siteId, Long interfaceId,
                                             Double measuredCapacityMbps, Long recordedById);
    List<CapacityRecordResponse> listRecords(Long siteId, Long interfaceId);
}
