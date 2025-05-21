package com.rb.TableMaster.model.enums;

public enum TableStatus {
    AVAILABLE("Disponível"),
    OCCUPIED("Ocupada"),     // ou BUSY
    RESERVED("Reservada");

    private final String displayName;

    TableStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}