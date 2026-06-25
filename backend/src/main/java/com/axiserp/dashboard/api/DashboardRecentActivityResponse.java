package com.axiserp.dashboard.api;

import java.time.LocalDateTime;

public record DashboardRecentActivityResponse(
        String id,
        String type,
        String label,
        String description,
        String referenceNo,
        LocalDateTime occurredAt,
        String processedBy
) {
}
