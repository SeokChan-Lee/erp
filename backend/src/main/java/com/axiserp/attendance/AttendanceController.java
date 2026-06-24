package com.axiserp.attendance;

import com.axiserp.auth.AuthService;
import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.attendance.api.AttendanceRecordResponse;
import com.axiserp.permission.Permission;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AttendanceController {

    private final AuthService authService;
    private final AttendanceService attendanceService;

    public AttendanceController(AuthService authService, AttendanceService attendanceService) {
        this.authService = authService;
        this.attendanceService = attendanceService;
    }

    @PostMapping("/attendance/check-in")
    public AttendanceRecordResponse checkIn(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.ATTENDANCE_CHECK_IN);
        return attendanceService.checkIn(user.username());
    }

    @PostMapping("/attendance/check-out")
    public AttendanceRecordResponse checkOut(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.ATTENDANCE_CHECK_OUT);
        return attendanceService.checkOut(user.username());
    }

    @GetMapping("/attendance/me/today")
    public AttendanceRecordResponse today(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.ATTENDANCE_READ_SELF);
        return attendanceService.todayFor(user.username());
    }

    @GetMapping("/attendance/me/monthly")
    public List<AttendanceRecordResponse> monthly(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam int year,
            @RequestParam int month
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.ATTENDANCE_READ_SELF);
        return attendanceService.monthlyFor(user.username(), year, month);
    }

    @GetMapping("/admin/attendance/today")
    public List<AttendanceRecordResponse> todayAll(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.ATTENDANCE_READ_ALL);
        return attendanceService.todayAll();
    }
}
