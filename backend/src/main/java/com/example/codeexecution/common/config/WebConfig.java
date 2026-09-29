package com.example.codeexecution.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.example.codeexecution.modules.rbac.PermissionInterceptor;

/**
 * Registers the RBAC {@link PermissionInterceptor} for all handler methods.
 * It only acts on methods annotated with {@code @RequirePermissions}, so
 * public auth endpoints (register/login/OTP/reset) pass through unchanged.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final PermissionInterceptor permissionInterceptor;

    public WebConfig(PermissionInterceptor permissionInterceptor) {
        this.permissionInterceptor = permissionInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this.permissionInterceptor);
    }
}
