package com.axiserp.dashboard;

import com.axiserp.auth.AuthService;
import com.axiserp.attendance.AttendanceService;
import com.axiserp.dashboard.api.DashboardSummaryResponse;
import com.axiserp.permission.Permission;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final AuthService authService;
    private final AttendanceService attendanceService;

    public DashboardController(AuthService authService, AttendanceService attendanceService) {
        this.authService = authService;
        this.attendanceService = attendanceService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.DASHBOARD_VIEW);
        return new DashboardSummaryResponse(
                attendanceService.todayAll().size(),
                12,
                8,
                24
        );
    }
}
