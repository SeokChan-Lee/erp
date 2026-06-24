package com.axiserp.attendance;

import com.axiserp.auth.AuthService;
import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.attendance.api.AttendanceRecordResponse;
import com.axiserp.attendance.api.AttendanceChangeRequestApproveRequest;
import com.axiserp.attendance.api.AttendanceChangeRequestCreateRequest;
import com.axiserp.attendance.api.AttendanceChangeRequestRejectRequest;
import com.axiserp.attendance.api.AttendanceChangeRequestResponse;
import com.axiserp.attendance.api.AttendanceUpdateRequest;
import com.axiserp.permission.Permission;
import com.axiserp.common.api.PageResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping("/attendance/change-requests")
    public AttendanceChangeRequestResponse createChangeRequest(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody AttendanceChangeRequestCreateRequest request
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.ATTENDANCE_READ_SELF);
        return attendanceService.createChangeRequest(user.username(), request);
    }

    @PatchMapping("/attendance/me")
    public AttendanceRecordResponse updateSelf(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody AttendanceUpdateRequest request
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.ATTENDANCE_UPDATE);
        return attendanceService.updateSelf(user.username(), request);
    }

    @GetMapping("/admin/attendance/today")
    public List<AttendanceRecordResponse> todayAll(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.ATTENDANCE_READ_ALL);
        return attendanceService.todayAll();
    }

    @GetMapping("/admin/attendance/change-requests")
    public List<AttendanceChangeRequestResponse> changeRequests(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId
    ) {
        authService.requirePermission(sessionId, Permission.ATTENDANCE_APPROVE);
        return attendanceService.pendingChangeRequests();
    }

    @PatchMapping("/admin/attendance/change-requests/approve")
    public List<AttendanceChangeRequestResponse> approveChangeRequests(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody AttendanceChangeRequestApproveRequest request
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.ATTENDANCE_APPROVE);
        return attendanceService.approveChangeRequests(user.username(), request.requestIds());
    }

    @PatchMapping("/admin/attendance/change-requests/reject")
    public List<AttendanceChangeRequestResponse> rejectChangeRequests(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody AttendanceChangeRequestRejectRequest request
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.ATTENDANCE_APPROVE);
        return attendanceService.rejectChangeRequests(user.username(), request.requestIds(), request.rejectReason());
    }

    @GetMapping("/admin/attendance/change-requests/history")
    public PageResponse<AttendanceChangeRequestResponse> changeRequestHistory(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) AttendanceChangeRequestStatus status,
            @RequestParam(required = false) java.time.LocalDate startDate,
            @RequestParam(required = false) java.time.LocalDate endDate,
            @RequestParam(required = false) String search
    ) {
        authService.requirePermission(sessionId, Permission.ATTENDANCE_APPROVE);
        return attendanceService.changeRequestHistory(status, startDate, endDate, search, page, pageSize);
    }
}
