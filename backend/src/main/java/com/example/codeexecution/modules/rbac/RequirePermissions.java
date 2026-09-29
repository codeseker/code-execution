package com.example.codeexecution.modules.rbac;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declarative RBAC check: every permission listed must be held by the
 * authenticated user, otherwise the request is rejected with 403.
 *
 * Example:
 * <pre>
 * &#64;RequirePermissions("problem:create")
 * public ApiResponse&lt;?&gt; create(...) { ... }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermissions {

    String[] value();
}
