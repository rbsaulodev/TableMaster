package com.rb.TableMaster.model.enums;

public enum MenuCategory {
    APPETIZERS("Entradas"),
    MAIN_COURSES("Pratos Principais"),
    DESSERTS("Sobremesas"),
    DRINKS("Bebidas");

    private final String displayName;

    MenuCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
