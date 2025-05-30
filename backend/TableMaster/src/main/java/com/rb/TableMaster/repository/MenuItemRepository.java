package com.rb.TableMaster.repository;

import com.rb.TableMaster.model.MenuItem;
import com.rb.TableMaster.model.enums.DrinkType;
import com.rb.TableMaster.model.enums.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCategory(MenuCategory category);
    List<MenuItem> findByCategoryAndDrinkType(MenuCategory category, DrinkType drinkType);
    List<MenuItem> findByDrinkType(DrinkType drinkType);
    Optional<MenuItem> findByName(String name);
}
