package com.rb.TableMaster.model.enums;

public enum DrinkType {
    WATER("Água"),
    SODA("Refrigerante"),
    NATURAL_JUICE("Suco Natural"),
    BEER("Cerveja"),
    WINE("Vinho"),
    COCKTAIL("Drink");

    private final String displayName;

    DrinkType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
