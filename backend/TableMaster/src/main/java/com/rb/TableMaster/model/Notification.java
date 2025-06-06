package com.rb.TableMaster.model;

import com.rb.TableMaster.model.enums.PaymentMethod;
import com.rb.TableMaster.model.enums.NotificationType; // Importar o novo enum
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private Long tableId;

    @Column(nullable = false)
    private Integer tableNumber;

    private Long orderId;
    private Long itemId;

    @Column(length = 100)
    private String itemName;

    @Column(length = 100)
    private String userName;

    @Column(length = 255)
    private String itemsSummary;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_payment_method")
    private PaymentMethod requestedPaymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private NotificationType notificationType;

    @Column(nullable = false)
    private boolean isRead;
}