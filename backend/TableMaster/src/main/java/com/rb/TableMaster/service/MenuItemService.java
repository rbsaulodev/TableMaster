package com.rb.TableMaster.service;

import com.rb.TableMaster.DTO.MenuItemDTO;
import com.rb.TableMaster.DTO.mapper.MenuItemMapper;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.repository.MenuItemRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Service
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final MenuItemMapper menuItemMapper;

    public MenuItemService(MenuItemRepository menuItemRepository, MenuItemMapper menuItemMapper) {
        this.menuItemRepository = menuItemRepository;
        this.menuItemMapper = menuItemMapper;
    }

    public List<MenuItemDTO> list() {
        return menuItemRepository.findAll().stream()
                .map(menuItemMapper::toDTO)
                .toList();
    }

    public MenuItemDTO findById(@NotNull @Positive Long id) {
        return menuItemRepository.findById(id)
                .map(menuItemMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id, MenuItem.class));
    }

    public MenuItemDTO create(@Valid @NotNull MenuItemDTO menuItemDTO) {
        MenuItem entity = menuItemMapper.toEntity(menuItemDTO);
        MenuItem saved = menuItemRepository.save(entity);
        return menuItemMapper.toDTO(saved);
    }

    public MenuItemDTO update(@Valid @NotNull MenuItemDTO menuItemDTO, @NotNull @Positive Long id) {
        return menuItemRepository.findById(id)
                .map(recordFound -> {
                    recordFound.setName(menuItemDTO.name());
                    recordFound.setDescription(menuItemDTO.description());
                    recordFound.setPrice(menuItemDTO.price());
                    MenuItem updated = menuItemRepository.save(recordFound);
                    return menuItemMapper.toDTO(updated);
                })
                .orElseThrow(() -> new RecordNotFoundException(id, MenuItem.class));
    }

    public void delete(@NotNull @Positive Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, MenuItem.class));
        menuItemRepository.delete(item);
    }
}
