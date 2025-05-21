package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.MenuItemDTO;
import com.rb.TableMaster.service.MenuItemService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-item")
@AllArgsConstructor
@Validated
public class MenuItemController {
    private final MenuItemService menuItemService;

    @GetMapping
    public List<MenuItemDTO> list() {
        return menuItemService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MenuItemDTO create(@RequestBody @Valid MenuItemDTO menuItem) {
        return menuItemService.create(menuItem);
    }

    @GetMapping("/{id}")
    public MenuItemDTO findById(@PathVariable @NotNull @Positive Long id) {
        return menuItemService.findById(id);
    }

    @PutMapping("/{id}")
    public MenuItemDTO update(@RequestBody @Valid MenuItemDTO menuItem, @PathVariable @NotNull @Positive Long id) {
        return menuItemService.update(menuItem, id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NotNull @Positive Long id) {
        menuItemService.delete(id);
    }
}
