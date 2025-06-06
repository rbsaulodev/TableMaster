package com.rb.TableMaster.model.enums;

public enum NotificationType {
    ACCOUNT_REQUEST, // Para solicitações de conta de cliente
    ORDER_STATUS_UPDATE, // Para atualizações de status de pedido (ex: pedido confirmado)
    ITEM_STATUS_UPDATE, // Para atualizações de status de item de pedido (ex: item pronto)
    TABLE_STATUS_UPDATE, // Para atualizações de status de mesa
    GENERIC_MESSAGE // Para notificações genéricas
}