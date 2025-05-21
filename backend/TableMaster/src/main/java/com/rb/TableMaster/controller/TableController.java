package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.service.RestaurantTableService;
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

    private final RestaurantTableService tableService;

    @GetMapping
    public List<RestaurantTableDTO> list() {
        return tableService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RestaurantTableDTO create(@RequestBody @Valid RestaurantTableDTO table) {
        return tableService.create(table);
    }

    @GetMapping("/{id}")
    public RestaurantTableDTO findById(@PathVariable @NotNull @Positive Long id) {
        return tableService.findById(id);
    }

    @PutMapping("/{id}")
    public RestaurantTableDTO update(@RequestBody @Valid RestaurantTableDTO table, @PathVariable @NotNull @Positive Long id) {
        return tableService.update(table, id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NotNull @Positive Long id) {
        tableService.delete(id);
    }
}
