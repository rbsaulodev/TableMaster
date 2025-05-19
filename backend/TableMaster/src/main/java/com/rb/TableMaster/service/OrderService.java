package com.rb.TableMaster.service;

import com.rb.TableMaster.DTO.OrderDTO;
import com.rb.TableMaster.DTO.OrderItemDTO;
import com.rb.TableMaster.DTO.mapper.OrderItemMapper;
import com.rb.TableMaster.DTO.mapper.OrderMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.repository.MenuItemRepository;
import com.rb.TableMaster.repository.OrderRepository;
import com.rb.TableMaster.repository.RestaurantTableRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.stream.Collectors;

@Validated
@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;

    public OrderService(OrderRepository orderRepository,
                        RestaurantTableRepository tableRepository,
                        MenuItemRepository menuItemRepository,
                        OrderMapper orderMapper,
                        OrderItemMapper orderItemMapper) {
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
    }

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

    public OrderDTO create(@Valid @NotNull OrderDTO orderDTO) {
        RestaurantTable table = tableRepository.findById(orderDTO.tableId())
                .orElseThrow(() -> new RecordNotFoundException(orderDTO.tableId(), RestaurantTable.class));

        List<MenuItem> menuItems = menuItemRepository.findAllById(
                orderDTO.items().stream()
                        .map(OrderItemDTO::menuItemId)
                        .collect(Collectors.toList())
        );

        Order entity = orderMapper.toEntity(orderDTO, table, menuItems);
        Order saved = orderRepository.save(entity);
        return orderMapper.toDTO(saved);
    }

    public void delete(@NotNull @Positive Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, Order.class));
        orderRepository.delete(order);
    }
}
