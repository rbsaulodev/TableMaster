package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.dto.mapper.RestaurantTableMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.enums.TableStatus;
import com.rb.TableMaster.repository.RestaurantTableRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Service
public class RestaurantTableService {

    private final RestaurantTableRepository tableRepository;
    private final RestaurantTableMapper tableMapper;

    public RestaurantTableService(RestaurantTableRepository tableRepository, RestaurantTableMapper tableMapper) {
        this.tableRepository = tableRepository;
        this.tableMapper = tableMapper;
    }

    public List<RestaurantTableDTO> list() {
        return tableRepository.findAll().stream()
                .map(tableMapper::toDTO)
                .toList();
    }

    public RestaurantTableDTO findById(@NotNull @Positive Long id) {
        return tableRepository.findById(id)
                .map(tableMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));
    }

    public RestaurantTableDTO create(@Valid @NotNull RestaurantTableDTO tableDTO) {
        RestaurantTable entity = tableMapper.toEntity(tableDTO);
        RestaurantTable saved = tableRepository.save(entity);
        return tableMapper.toDTO(saved);
    }

    public RestaurantTableDTO update(@Valid @NotNull RestaurantTableDTO tableDTO, @NotNull @Positive Long id) {
        return tableRepository.findById(id)
                .map(recordFound -> {
                    recordFound.setNumber(tableDTO.number());
                    recordFound.setCapacity(tableDTO.capacity());
                    recordFound.setStatus(tableDTO.status());
                    recordFound.setOrders(tableDTO.orders());
                    RestaurantTable updated = tableRepository.save(recordFound);
                    return tableMapper.toDTO(updated);
                })
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));
    }

    public void delete(@NotNull @Positive Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));
        tableRepository.delete(table);
    }


    public RestaurantTableDTO reserveTable(@NotNull @Positive Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));

        if (table.getStatus() == TableStatus.RESERVED) {
            throw new IllegalStateException("A mesa já está reservada.");
        }
        if (table.getStatus() == TableStatus.OCCUPIED) {
            throw new IllegalStateException("A mesa está ocupada e não pode ser reservada.");
        }

        table.setStatus(TableStatus.RESERVED);
        RestaurantTable updated = tableRepository.save(table);
        return tableMapper.toDTO(updated);
    }

    public RestaurantTableDTO occupyTable(@NotNull @Positive Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));

        if (table.getStatus() == TableStatus.OCCUPIED) {
            throw new IllegalStateException("A mesa já está ocupada.");
        }

        table.setStatus(TableStatus.OCCUPIED);
        RestaurantTable updated = tableRepository.save(table);
        return tableMapper.toDTO(updated);
    }

    public RestaurantTableDTO releaseTable(@NotNull @Positive Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));

        if (table.getStatus() == TableStatus.AVAILABLE) {
            throw new IllegalStateException("A mesa já está disponível.");
        }

        table.setStatus(TableStatus.AVAILABLE);
        RestaurantTable updated = tableRepository.save(table);
        return tableMapper.toDTO(updated);
    }

    public List<RestaurantTableDTO> listAvailableTables() {
        return tableRepository.findAll().stream()
                .filter(table -> table.getStatus() == TableStatus.AVAILABLE)
                .map(tableMapper::toDTO)
                .toList();
    }
}
