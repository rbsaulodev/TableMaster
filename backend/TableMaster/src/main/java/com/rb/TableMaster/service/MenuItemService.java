package com.rb.TableMaster.service;

import com.rb.TableMaster.dto.MenuItemDTO;
import com.rb.TableMaster.dto.mapper.MenuItemMapper;
import com.rb.TableMaster.model.enums.MenuCategory;
import com.rb.TableMaster.exception.RecordNotFoundException;
import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.repository.MenuItemRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.stream.Collectors;

@Validated
@Service
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final MenuItemMapper menuItemMapper;

    public MenuItemService(MenuItemRepository menuItemRepository, MenuItemMapper menuItemMapper) {
        this.menuItemRepository = menuItemRepository;
        this.menuItemMapper = menuItemMapper;
    }

    public List<MenuItem> findAll() {
        return menuItemRepository.findAll();
    }

    @Transactional()
    public List<MenuItemDTO> listAll() {
        return menuItemRepository.findAll()
                .stream()
                .map(menuItemMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<MenuItemDTO> list() {
        return menuItemRepository.findAll().stream()
                .map(menuItemMapper::toDTO)
                .toList();
    }

    public List<MenuItemDTO> listByCategory(@NotNull MenuCategory category) {
        return menuItemRepository.findByCategory(category).stream()
                .map(menuItemMapper::toDTO)
                .toList();
    }

    public MenuItemDTO findById(@NotNull @Positive Long id) {
        return menuItemRepository.findById(id)
                .map(menuItemMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id, MenuItem.class));
    }

    public MenuItemDTO create(@Valid @NotNull MenuItemDTO menuItemDTO) {
        validateMenuItem(menuItemDTO);
        MenuItem entity = menuItemMapper.toEntity(menuItemDTO);
        MenuItem saved = menuItemRepository.save(entity);
        return menuItemMapper.toDTO(saved);
    }

    public MenuItemDTO update(@Valid @NotNull MenuItemDTO menuItemDTO, @NotNull @Positive Long id) {
        validateMenuItem(menuItemDTO);
        return menuItemRepository.findById(id)
                .map(recordFound -> {
                    recordFound.setName(menuItemDTO.name());
                    recordFound.setDescription(menuItemDTO.description());
                    recordFound.setPrice(menuItemDTO.price());
                    recordFound.setImageUrl(menuItemDTO.imageUrl());
                    recordFound.setCategory(menuItemDTO.category());

                    if (menuItemDTO.category() == MenuCategory.DRINKS) {
                        recordFound.setDrinkType(menuItemDTO.drinkType());
                    } else {
                        recordFound.setDrinkType(null);
                    }

                    MenuItem updated = menuItemRepository.save(recordFound);
                    return menuItemMapper.toDTO(updated);
                })
                .orElseThrow(() -> new RecordNotFoundException(id, MenuItem.class));
    }

    @Transactional
    public void delete(Long id) {
        if (!menuItemRepository.existsById(id)) {
            throw new RecordNotFoundException("Item de menu não encontrado com ID: " + id);
        }
        menuItemRepository.deleteById(id);
    }

    private void validateMenuItem(MenuItemDTO menuItemDTO) {
        if (menuItemDTO.category() == MenuCategory.DRINKS && menuItemDTO.drinkType() == null) {
            throw new IllegalArgumentException("O tipo de bebida é obrigatório para itens da categoria BEBIDAS");
        }

        if (menuItemDTO.category() != MenuCategory.DRINKS && menuItemDTO.drinkType() != null) {
            throw new IllegalArgumentException("O tipo de bebida só pode ser definido para itens da categoria BEBIDAS");
        }
    }

    public MenuItem findEntityById(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, MenuItem.class));
    }

    @Transactional
    public MenuItemDTO toggleMenuItemAvailability(Long id, boolean available) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id, MenuItem.class));

        menuItem.setAvailable(available);
        MenuItem updatedMenuItem = menuItemRepository.save(menuItem);
        return menuItemMapper.toDTO(updatedMenuItem);
    }
}