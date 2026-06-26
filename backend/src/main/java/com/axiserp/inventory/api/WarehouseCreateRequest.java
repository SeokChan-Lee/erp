package com.axiserp.inventory.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record WarehouseCreateRequest(
        @NotBlank
        @Size(max = 40)
        @Pattern(regexp = "^[A-Z0-9_-]+$", message = "창고 코드는 영문 대문자, 숫자, -, _만 사용할 수 있습니다.")
        String code,
        @NotBlank
        @Size(max = 100)
        String name
) {
}
