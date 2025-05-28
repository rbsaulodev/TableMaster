package com.rb.TableMaster.model.enums;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public enum UserRole {
    ADMIN(Set.of(
            Permission.MANAGE_USERS,
            Permission.VIEW_REPORTS,
            Permission.MANAGE_MENU,
            Permission.MANAGE_TABLES,
            Permission.VIEW_ALL_ORDERS
    )),
    WAITER(Set.of(
            Permission.CREATE_ORDERS,
            Permission.VIEW_TABLE_ORDERS,
            Permission.UPDATE_TABLE_STATUS,
            Permission.VIEW_MENU_ITEMS
    )),
    CHEF(Set.of(
            Permission.VIEW_KITCHEN_ORDERS,
            Permission.UPDATE_ORDER_STATUS,
            Permission.VIEW_MENU_ITEMS
    )),
    CUSTOMER(Set.of(
            Permission.VIEW_MENU_ITEMS,
            Permission.VIEW_OWN_PROFILE
    ));

    private final Set<Permission> permissions;

    UserRole(Set<Permission> permissions) {
        this.permissions = permissions;
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }

    public List<SimpleGrantedAuthority> getAuthorities() {
        var authorities = getPermissions()
                .stream()
                .map(permission -> new SimpleGrantedAuthority(permission.name()))
                .collect(Collectors.toList());
        authorities.add(new SimpleGrantedAuthority("ROLE_" + this.name()));
        return authorities;
    }
}