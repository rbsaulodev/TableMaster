package com.rb.TableMaster;

import com.rb.TableMaster.dto.RestaurantTableDTO;
import com.rb.TableMaster.dto.mapper.RestaurantTableMapper;
import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.model.enums.TableStatus;
import com.rb.TableMaster.repository.OrderRepository;
import com.rb.TableMaster.repository.RestaurantTableRepository;
import com.rb.TableMaster.exception.RecordNotFoundException; // Importe sua exceção
import com.rb.TableMaster.service.OrderService;
import com.rb.TableMaster.service.RestaurantTableService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RestaurantTableServiceTest {

    @Mock
    private RestaurantTableRepository tableRepository;

    @Mock
    private RestaurantTableMapper tableMapper;

    @Mock
    private OrderService orderService; // Mockar se for usado em outros métodos, não para listAll/getAvailableTables

    @Mock
    private OrderRepository orderRepository; // Mockar se for usado em outros métodos

    @InjectMocks
    private RestaurantTableService restaurantTableService;

    private RestaurantTable table1;
    private RestaurantTable table2;
    private RestaurantTableDTO table1DTO;
    private RestaurantTableDTO table2DTO;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        table1 = RestaurantTable.builder()
                .id(1L)
                .number(1)
                .status(TableStatus.AVAILABLE)
                .capacity(4)
                .build();

        table2 = RestaurantTable.builder()
                .id(2L)
                .number(2)
                .status(TableStatus.OCCUPIED)
                .capacity(2)
                .build();

        table1DTO = new RestaurantTableDTO(1L, 1, TableStatus.AVAILABLE, 4, null);
        table2DTO = new RestaurantTableDTO(2L, 2, TableStatus.OCCUPIED, 2, null);
    }

    @Test
    void listAll_ShouldReturnAllTables() {
        when(tableRepository.findAll()).thenReturn(Arrays.asList(table1, table2));
        when(tableMapper.toDTO(table1)).thenReturn(table1DTO);
        when(tableMapper.toDTO(table2)).thenReturn(table2DTO);

        List<RestaurantTableDTO> result = restaurantTableService.listAll();

        assertNotNull(result);
        assertEquals(2, result.size());
        assertTrue(result.contains(table1DTO));
        assertTrue(result.contains(table2DTO));
        verify(tableRepository, times(1)).findAll();
        verify(tableMapper, times(1)).toDTO(table1);
        verify(tableMapper, times(1)).toDTO(table2);
    }

    @Test
    void getAvailableTables_ShouldReturnOnlyAvailableTables() {
        when(tableRepository.findByStatus(TableStatus.AVAILABLE)).thenReturn(Arrays.asList(table1));
        when(tableMapper.toDTO(table1)).thenReturn(table1DTO);

        List<RestaurantTableDTO> result = restaurantTableService.getAvailableTables();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertTrue(result.contains(table1DTO));
        assertFalse(result.contains(table2DTO)); // table2 is OCCUPIED, should not be in available
        verify(tableRepository, times(1)).findByStatus(TableStatus.AVAILABLE);
        verify(tableMapper, times(1)).toDTO(table1);
    }

    @Test
    void findById_ShouldReturnTableWhenFound() {
        when(tableRepository.findById(1L)).thenReturn(Optional.of(table1));
        when(tableMapper.toDTO(table1)).thenReturn(table1DTO);

        RestaurantTableDTO result = restaurantTableService.findById(1L);

        assertNotNull(result);
        assertEquals(table1DTO, result);
        verify(tableRepository, times(1)).findById(1L);
        verify(tableMapper, times(1)).toDTO(table1);
    }

    @Test
    void findById_ShouldThrowExceptionWhenNotFound() {
        when(tableRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RecordNotFoundException.class, () -> restaurantTableService.findById(99L));
        verify(tableRepository, times(1)).findById(99L);
        verify(tableMapper, never()).toDTO(any()); // toDTO should not be called
    }
}