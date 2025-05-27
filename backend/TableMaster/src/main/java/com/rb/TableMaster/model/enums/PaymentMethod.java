package com.rb.TableMaster.model.enums;

public enum PaymentMethod {
    CASH("Dinheiro"),
    CARD("Cartão"),
    PIX("PIX");

    private final String description;

    PaymentMethod(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}