package com.rb.TableMaster.model.enums;

import lombok.Getter;

@Getter
public enum Permission {
    // Admin
    MANAGE_USERS,
    VIEW_REPORTS,
    MANAGE_MENU,
    MANAGE_TABLES,
    VIEW_ALL_ORDERS,

    // Garçom
    CREATE_ORDERS,
    VIEW_TABLE_ORDERS,
    UPDATE_TABLE_STATUS,

    // Chef
    VIEW_KITCHEN_ORDERS,
    UPDATE_ORDER_STATUS,

    // Cliente
    VIEW_MENU_ITEMS,
    VIEW_OWN_PROFILE
}