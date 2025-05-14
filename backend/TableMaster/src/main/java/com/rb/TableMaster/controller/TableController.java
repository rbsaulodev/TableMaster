package com.rb.TableMaster.controller;

import com.rb.TableMaster.model.RestaurantTable;
import com.rb.TableMaster.repository.TableRepository;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/table")
@AllArgsConstructor
public class TableController {

    private final TableRepository repository;

    @GetMapping
    public List<RestaurantTable> listTable(){
        return repository.findAll();
    }

}
