package com.rb.TableMaster.controller;

import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.service.TableService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/table")
@AllArgsConstructor
@Validated
public class TableController {

    private final TableService tableService;

    @GetMapping
    public List<RestaurantTable> list() {
        return tableService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RestaurantTable create(@RequestBody @Valid RestaurantTable table) {
        return tableService.create(table);
    }

        @GetMapping("/{id}")
        public RestaurantTable findById(@PathVariable @NotNull @Positive Long id) {
            return tableService.findById(id);
        }

    @PutMapping("/{id}")
    public RestaurantTable update(@RequestBody @Valid RestaurantTable table, @PathVariable @NotNull @Positive Long id) {
        return tableService.update(table, id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NotNull @Positive Long id) {
        tableService.delete(id);
    }
}
