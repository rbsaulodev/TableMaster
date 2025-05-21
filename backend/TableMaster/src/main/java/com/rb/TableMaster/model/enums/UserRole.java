package com.rb.TableMaster.model.enums;

import java.util.Set;

public enum UserRole {
    ADMIN("Administrador", Set.of(
            Permission.MANAGE_USERS,
            Permission.VIEW_REPORTS,
            Permission.MANAGE_MENU,
            Permission.MANAGE_TABLES,
            Permission.VIEW_ALL_ORDERS
    )),
    WAITER("Garçom", Set.of(
            Permission.MANAGE_TABLES,
            Permission.CREATE_ORDERS,
            Permission.VIEW_TABLE_ORDERS,
            Permission.UPDATE_ORDER_STATUS
    )),
    CHEF("Cozinheiro", Set.of(
            Permission.VIEW_KITCHEN_ORDERS,
            Permission.UPDATE_ORDER_STATUS,
            Permission.VIEW_MENU_ITEMS
    ));

    private final String displayName;
    private final Set<Permission> permissions;

    UserRole(String displayName, Set<Permission> permissions) {
        this.displayName = displayName;
        this.permissions = permissions;
    }
}
