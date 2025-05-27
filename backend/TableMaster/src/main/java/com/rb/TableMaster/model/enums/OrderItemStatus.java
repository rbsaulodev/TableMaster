package com.rb.TableMaster.model.enums;

public enum OrderItemStatus {
    PENDING("Pendente"),
    PREPARING("Preparando"),
    READY("Pronto"),
    DELIVERED("Entregue");

    private final String description;

    OrderItemStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}