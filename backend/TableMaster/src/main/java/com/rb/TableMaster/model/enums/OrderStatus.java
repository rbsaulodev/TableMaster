package com.rb.TableMaster.model.enums;

public enum OrderStatus {
    DRAFT("Rascunho"),
    OPEN("Em Aberto"),
    UNPAID("Não Pago"),
    PAID("Pago");

    private final String displayName;

    OrderStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}