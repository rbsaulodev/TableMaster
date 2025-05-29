    package com.rb.TableMaster.model.enums;

    public enum OrderStatus {
        OPEN("Em Aberto"),            // Cliente ainda consumindo
        UNPAID("Não Pago"),           // Finalizado, mas ainda não pago
        PAID("Pago");                 // Pedido quitado

        private final String displayName;

        OrderStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
