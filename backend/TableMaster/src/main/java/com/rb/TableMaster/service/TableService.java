package com.rb.TableMaster.service;

import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.repository.TableRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Service
public class TableService {

    private final TableRepository tableRepository;

    public TableService(TableRepository tableRepository) {
        this.tableRepository = tableRepository;
    }

    public List<RestaurantTable> list() {
        return tableRepository.findAll();
    }

    public RestaurantTable findById(@NotNull @Positive Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));
    }


    public RestaurantTable create(@Valid RestaurantTable table) {
        return tableRepository.save(table);
    }

    public RestaurantTable update(@Valid RestaurantTable table, @NotNull @Positive Long id) {
        return tableRepository.findById(id)
                .map(recordFound -> {
                    recordFound.setNumber(table.getNumber());
                    recordFound.setCapacity(table.getCapacity());
                    recordFound.setStatus(table.getStatus());
                    recordFound.setOrders(table.getOrders());
                    return tableRepository.save(recordFound);
                }).orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class));
    }

    public void delete(@NotNull @Positive Long id) {
        tableRepository.delete(tableRepository.findById(id)
            .orElseThrow(() -> new RecordNotFoundException(id, RestaurantTable.class)));
    }
}
