package com.rb.TableMaster.controller;

import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.service.RestaurantTableService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication; // Importe para obter o objeto de autenticação
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
        // Este endpoint é genérico para updates. A notificação WS já está no service.update.
        return tableService.update(table, id);
    }

    // ADICIONE ESTE ENDPOINT PARA LIBERAR A MESA ESPECIFICAMENTE
    @PatchMapping("/{id}/release") // Usar PATCH para atualização parcial de status
    @ResponseStatus(HttpStatus.OK)
    public RestaurantTableDTO releaseTable(@PathVariable @NotNull @Positive Long id) {
        // Este método no Controller vai chamar o método releaseTable no Service
        // que já contém a lógica de salvar e enviar via WebSocket.
        return tableService.releaseTable(id);
    }

    @PatchMapping("/{id}/occupy")
    @ResponseStatus(HttpStatus.OK)
    public RestaurantTableDTO occupyTable(@PathVariable @NotNull @Positive Long id, Authentication authentication) {
        String userCpf = authentication.getName();
        return tableService.occupyTable(id, userCpf); // Passa o userCpf
    }

    @PatchMapping("/{id}/reserve")
    @ResponseStatus(HttpStatus.OK)
    public RestaurantTableDTO reserveTable(@PathVariable @NotNull @Positive Long id,
                                           @RequestParam String reservedTime,
                                           Authentication authentication) {
        String userCpf = authentication.getName();
        return tableService.reserveTable(id, userCpf, reservedTime);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable @NotNull @Positive Long id) {
        tableService.delete(id);
    }
}