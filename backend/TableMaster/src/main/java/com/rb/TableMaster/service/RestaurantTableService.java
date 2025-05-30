package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.dto.mapper.RestaurantTableMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.model.enums.TableStatus;
import com.rb.TableMaster.repository.OrderRepository;
import com.rb.TableMaster.repository.RestaurantTableRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantTableService {
    private final RestaurantTableRepository tableRepository;
    private final OrderService orderService;
    private final RestaurantTableMapper tableMapper;
    private final OrderRepository orderRepository;

    @Transactional
    public List<RestaurantTableDTO> listAll() {
        return tableRepository.findAll()
                .stream()
                .map(tableMapper::toDTO)
                .collect(Collectors.toList());
    }

    public RestaurantTableDTO reserveTable(Long tableId, String userCpf) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new IllegalStateException("A mesa não está disponível para reserva");
        }

        table.setStatus(TableStatus.RESERVED);
        RestaurantTable savedTable = tableRepository.save(table);

        orderService.createOrderForTable(tableId, userCpf);

        return tableMapper.toDTO(savedTable);
    }

    public RestaurantTableDTO occupyTable(Long tableId, String userCpf) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        if (table.getStatus() == TableStatus.OCCUPIED) {
            throw new IllegalStateException("A mesa já está ocupada");
        }

        table.setStatus(TableStatus.OCCUPIED);
        RestaurantTable savedTable = tableRepository.save(table);

        orderService.createOrderForTable(tableId, userCpf);

        return tableMapper.toDTO(savedTable);
    }

    public RestaurantTableDTO releaseTable(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        if (table.getStatus() == TableStatus.AVAILABLE) {
            throw new IllegalStateException("A mesa já está disponível");
        }

        List<Order> openOrders = orderRepository.findByTableAndStatusIn(table,
                List.of(OrderStatus.OPEN, OrderStatus.UNPAID));

        if (!openOrders.isEmpty()) {
            throw new IllegalStateException("Não é possível liberar a mesa com pedidos em aberto");
        }

        table.setStatus(TableStatus.AVAILABLE);
        RestaurantTable savedTable = tableRepository.save(table);
        return tableMapper.toDTO(savedTable);
    }

    public List<RestaurantTableDTO> getAvailableTables() {
        return tableRepository.findByStatus(TableStatus.AVAILABLE).stream()
                .map(tableMapper::toDTO)
                .toList();
    }

    public List<RestaurantTableDTO> list() {
        return tableRepository.findAll().stream()
                .map(tableMapper::toDTO)
                .toList();
    }

    public RestaurantTableDTO findById(Long id) {
        return tableRepository.findById(id)
                .map(tableMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));
    }

    @Transactional
    public RestaurantTableDTO create(RestaurantTableDTO tableDTO) {
        RestaurantTable table = tableMapper.toEntity(tableDTO);
        table.setStatus(TableStatus.AVAILABLE);
        RestaurantTable savedTable = tableRepository.save(table);
        return tableMapper.toDTO(savedTable);
    }

    @Transactional
    public RestaurantTableDTO update(RestaurantTableDTO tableDTO, Long id) {
        RestaurantTable existingTable = tableRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));

        tableMapper.updateEntityFromDTO(tableDTO, existingTable);

        RestaurantTable updatedTable = tableRepository.save(existingTable);
        return tableMapper.toDTO(updatedTable);
    }

    @Transactional
    public void delete(Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new IllegalStateException("Only available tables can be deleted");
        }

        tableRepository.delete(table);
    }
}