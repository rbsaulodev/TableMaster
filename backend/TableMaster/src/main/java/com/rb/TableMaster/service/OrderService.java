package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.OrderDTO;
import com.rb.TableMaster.dto.OrderItemDTO;
import com.rb.TableMaster.dto.mapper.OrderItemMapper;
import com.rb.TableMaster.dto.mapper.OrderMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.repository.MenuItemRepository;
import com.rb.TableMaster.repository.OrderRepository;
import com.rb.TableMaster.repository.RestaurantTableRepository;
import com.rb.TableMaster.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Validated
@Service
@AllArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;

    public List<OrderDTO> list() {
        return orderRepository.findAll().stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public OrderDTO findById(@NotNull @Positive Long id) {
        return orderRepository.findById(id)
                .map(orderMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));
    }

    @Transactional
    public OrderDTO create(@Valid @NotNull OrderDTO orderDTO) {
        RestaurantTable table = tableRepository.findById(orderDTO.tableId())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.tableId(), RestaurantTable.class));

        User user = userRepository.findByCpf(orderDTO.userCpf())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.userCpf(), User.class));

        if (!user.isActive()) {
            throw new IllegalStateException("Usuário com CPF " + orderDTO.userCpf() + " está inativo e não pode fazer pedidos");
        }

        List<MenuItem> menuItems = menuItemRepository.findAllById(
                orderDTO.items().stream()
                        .map(OrderItemDTO::menuItemId)
                        .collect(Collectors.toList())
        );

        Order entity = orderMapper.toEntity(orderDTO, table, user, menuItems);
        Order saved = orderRepository.save(entity);
        saved.setTotalValue(calculateTotalValue(saved));
        return orderMapper.toDTO(saved);
    }

    @Transactional
    public OrderDTO update(@NotNull @Positive Long id, @Valid @NotNull OrderDTO orderDTO) {

        Order existingOrder = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));

        RestaurantTable table = tableRepository.findById(orderDTO.tableId())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.tableId(), RestaurantTable.class));

        User user = userRepository.findByCpf(orderDTO.userCpf())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.userCpf(), User.class));

        if (!user.isActive()) {
            throw new IllegalStateException("Usuário com CPF " + orderDTO.userCpf() + " está inativo e não pode atualizar pedidos");
        }

        List<MenuItem> menuItems = menuItemRepository.findAllById(
                orderDTO.items().stream()
                        .map(OrderItemDTO::menuItemId)
                        .collect(Collectors.toList())
        );

        Order entity = orderMapper.toEntity(orderDTO, table, user, menuItems);
        entity.setId(id);

        Order saved = orderRepository.save(entity);
        saved.setTotalValue(calculateTotalValue(saved));
        return orderMapper.toDTO(saved);
    }

    @Transactional
    public void delete(@NotNull @Positive Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));
        orderRepository.delete(order);
    }

    public List<OrderDTO> findByUserCpf(@NotNull @NotBlank String cpf) {
        User user = userRepository.findByCpf(cpf)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));

        return orderRepository.findByUser(user).stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public List<OrderDTO> findByTableId(@NotNull @Positive Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        return orderRepository.findByTable(table).stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public List<OrderDTO> findByUserCpfAndTableId(@NotNull @NotBlank String cpf, @NotNull @Positive Long tableId) {
        User user = userRepository.findByCpf(cpf)
                .orElseThrow(() -> new RecordNotFoundException(cpf, User.class));

        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        return orderRepository.findByUserAndTable(user, table).stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    @Transactional
    public OrderDTO finishOrder(@NotNull @Positive Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() != OrderStatus.OPEN) {
            throw new IllegalStateException("A comanda só pode ser finalizada se estiver em aberto.");
        }

        order.setStatus(OrderStatus.UNPAID);
        return orderMapper.toDTO(orderRepository.save(order));
    }

    @Transactional
    public OrderDTO payOrder(@NotNull @Positive Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        if (order.getStatus() != OrderStatus.UNPAID) {
            throw new IllegalStateException("A comanda só pode ser paga se estiver como 'Não Pago'.");
        }

        order.setStatus(OrderStatus.PAID);
        return orderMapper.toDTO(orderRepository.save(order));
    }

    @Transactional
    public OrderDTO updateStatus(@NotNull @Positive Long orderId, @NotNull OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RecordNotFoundException(orderId, Order.class));

        OrderStatus currentStatus = order.getStatus();

        if (currentStatus == OrderStatus.PAID) {
            throw new IllegalStateException("Comanda já foi paga e não pode ser modificada.");
        }

        if (newStatus == OrderStatus.PAID && currentStatus != OrderStatus.UNPAID) {
            throw new IllegalStateException("A comanda só pode ser paga se estiver como 'Não Pago'.");
        }

        if (newStatus == OrderStatus.UNPAID && currentStatus != OrderStatus.OPEN) {
            throw new IllegalStateException("A comanda só pode ser finalizada se estiver em aberto.");
        }

        order.setStatus(newStatus);
        return orderMapper.toDTO(orderRepository.save(order));
    }

    public List<OrderDTO> findByStatus(@NotNull OrderStatus status) {
        return orderRepository.findByStatus(status).stream()
                .map(orderMapper::toDTO)
                .toList();
    }

    public BigDecimal calculateTotalValue(Order order) {
        return order.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}