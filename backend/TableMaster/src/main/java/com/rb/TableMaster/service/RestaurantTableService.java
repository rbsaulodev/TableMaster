package com.rb.TableMaster.service;

import com.rb.TableMaster.controller.WebSocketController;
import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.dto.mapper.RestaurantTableMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.Order;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.User; // Import para User
import com.rb.TableMaster.model.enums.OrderStatus;
import com.rb.TableMaster.model.enums.TableStatus;
import com.rb.TableMaster.repository.OrderRepository;
import com.rb.TableMaster.repository.RestaurantTableRepository;
import com.rb.TableMaster.repository.UserRepository; // Import para UserRepository
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime; // Para reservedTime
import java.time.format.DateTimeFormatter; // Para formatar reservedTime
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication; // Para obter o usuário autenticado

@Service
@RequiredArgsConstructor
public class RestaurantTableService {
    private final RestaurantTableRepository tableRepository;
    private final OrderService orderService;
    private final RestaurantTableMapper tableMapper;
    private final OrderRepository orderRepository;
    private final WebSocketController webSocketController;
    private final UserRepository userRepository; // Injete UserRepository para buscar o usuário

    @Transactional
    public List<RestaurantTableDTO> listAll() {
        return tableRepository.findAll()
                .stream()
                .map(tableMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public RestaurantTableDTO reserveTable(Long tableId, String userCpf, String reservedTime) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        User user = userRepository.findById(userCpf) // Buscar usuário pelo CPF
                .orElseThrow(() -> new RecordNotFoundException(userCpf, User.class));

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new IllegalStateException("A mesa não está disponível para reserva");
        }

        table.setStatus(TableStatus.RESERVED);
        // O campo 'reservedTime' na entidade RestaurantTable pode não existir,
        // mas ele existe na OrderDTO. Se você precisar persistir a hora da reserva na mesa,
        // adicione um campo LocalDateTime 'reservedTime' à entidade RestaurantTable.
        // Por enquanto, vamos assumir que ele é mais relevante no contexto do pedido.

        RestaurantTable savedTableEntity = tableRepository.save(table); // Salva a mesa com status RESERVED
        RestaurantTableDTO savedTableDTO = tableMapper.toDTO(savedTableEntity);

        // Embora a reserva da mesa não crie um pedido automaticamente,
        // é comum que o cliente depois crie um "rascunho" de pedido associado a essa reserva.
        // Se a reserva criar um pedido inicial, o DTO da mesa precisaria refletir isso.
        // Por enquanto, enviamos a atualização do status da mesa.
        System.out.println("DEBUG WS Backend: Enviando TableUpdate (Reserva) para: " + savedTableDTO.id() + " com Status: " + savedTableDTO.status());
        webSocketController.sendTableUpdate(savedTableDTO);
        return savedTableDTO;
    }

    @Transactional // Adicionado para garantir persistência
    public RestaurantTableDTO occupyTable(Long tableId, String userCpf) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        User user = userRepository.findById(userCpf) // Buscar usuário pelo CPF
                .orElseThrow(() -> new RecordNotFoundException(userCpf, User.class));

        if (table.getStatus() == TableStatus.OCCUPIED) {
            throw new IllegalStateException("A mesa já está ocupada");
        }

        table.setStatus(TableStatus.OCCUPIED);
        RestaurantTable savedTableEntity = tableRepository.save(table); // Salva a mesa com status OCCUPIED
        RestaurantTableDTO savedTableDTO = tableMapper.toDTO(savedTableEntity);

        System.out.println("DEBUG WS Backend: Enviando TableUpdate (Ocupar) para: " + savedTableDTO.id() + " com Status: " + savedTableDTO.status());
        System.out.println("DEBUG WS Backend: DTO completo enviado ao ocupar: " + savedTableDTO); // Log de debug

        webSocketController.sendTableUpdate(savedTableDTO);
        return savedTableDTO;
    }

    @Transactional // Adicionado para garantir persistência
    public RestaurantTableDTO releaseTable(Long tableId) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RecordNotFoundException(tableId, RestaurantTable.class));

        if (table.getStatus() == TableStatus.AVAILABLE) {
            throw new IllegalStateException("A mesa já está disponível");
        }

        // Verifica se há pedidos em aberto associados a esta mesa
        // (Assumindo que findByTableAndStatusIn funciona e que `table` é a entidade persistida)
        List<Order> openOrders = orderRepository.findByTableAndStatusIn(table,
                List.of(OrderStatus.OPEN, OrderStatus.UNPAID));

        if (!openOrders.isEmpty()) {
            throw new IllegalStateException("Não é possível liberar a mesa com pedidos em aberto");
        }

        table.setStatus(TableStatus.AVAILABLE); // Define o status para AVAILABLE
        RestaurantTable savedTableEntity = tableRepository.save(table); // SALVA a entidade ANTES de enviar
        RestaurantTableDTO savedTableDTO = tableMapper.toDTO(savedTableEntity); // Converte para DTO do objeto salvo

        System.out.println("DEBUG WS Backend: Enviando TableUpdate (Liberar) para: " + savedTableDTO.id() + " com Status: " + savedTableDTO.status());
        System.out.println("DEBUG WS Backend: DTO completo enviado ao liberar: " + savedTableDTO); // Log de debug

        webSocketController.sendTableUpdate(savedTableDTO); // Envia o DTO (que agora reflete o estado salvo)
        return savedTableDTO;
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
        // Se precisar notificar a criação de novas mesas via WS para outras interfaces
        // webSocketController.sendTableUpdate(tableMapper.toDTO(savedTable));
        return tableMapper.toDTO(savedTable);
    }

    @Transactional
    public RestaurantTableDTO update(RestaurantTableDTO tableDTO, Long id) {
        RestaurantTable existingTable = tableRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));

        tableMapper.updateEntityFromDTO(tableDTO, existingTable);
        // Se o DTO de entrada (tableDTO) contiver o status atualizado,
        // o mapeador já o terá aplicado ao existingTable.

        RestaurantTable updatedTable = tableRepository.save(existingTable);
        // Se a atualização mudar o status da mesa e você quiser que o frontend receba,
        // chame o WebSocket aqui.
        // Este `update` é genérico, então pode ser chamado para qualquer campo.
        // Se uma atualização específica de status for importante para o WS,
        // é melhor usar os métodos específicos `releaseTable` e `occupyTable`.
        System.out.println("DEBUG WS Backend: Enviando TableUpdate (Update Genérico) para: " + updatedTable.getId() + " com Status: " + updatedTable.getStatus());
        webSocketController.sendTableUpdate(tableMapper.toDTO(updatedTable));
        return tableMapper.toDTO(updatedTable);
    }

    @Transactional
    public void delete(Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new IllegalStateException("Apenas mesas disponíveis podem ser excluídas");
        }

        tableRepository.delete(table);
        // Se precisar enviar via WS que uma mesa foi DELETADA (não apenas seu status),
        // precisaria de uma lógica de notificação para deleção (ex: enviar o ID da mesa deletada).
    }
}