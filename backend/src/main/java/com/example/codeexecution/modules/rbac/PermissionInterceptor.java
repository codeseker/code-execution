package com.example.codeexecution.modules.rbac;

import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import com.example.codeexecution.common.exceptions.ForbiddenException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * The RBAC authorization middleware (Spring MVC equivalent of an Express
 * {@code checkPermission(...)} middleware).
 *
 * For every handler method annotated with {@link RequirePermissions}, the
 * authenticated user must hold <b>all</b> listed permissions or the request
 * is rejected with 403. Handlers without the annotation pass through
 * untouched, so public/auth routes are unaffected.
 *
 * Runs after {@code JwtAuthenticationFilter}, which places the userId as the
 * principal in the SecurityContext.
 */
@Component
public class PermissionInterceptor implements HandlerInterceptor {

    private final RbacService rbacService;

    public PermissionInterceptor(RbacService rbacService) {
        this.rbacService = rbacService;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) {

        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequirePermissions required = AnnotatedElementUtils
                .findMergedAnnotation(handlerMethod.getMethod(), RequirePermissions.class);

        if (required == null || required.value().length == 0) {
            return true;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication == null ? null : authentication.getPrincipal();

        if (!(principal instanceof String userId) || userId.isBlank()) {
            throw new ForbiddenException("Authentication required to access this resource");
        }

        this.rbacService.checkPermission(userId, required.value());
        return true;
    }
}
