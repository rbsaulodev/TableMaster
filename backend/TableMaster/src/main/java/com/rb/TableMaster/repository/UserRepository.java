package com.rb.TableMaster.repository;

import com.rb.TableMaster.model.User;
import com.rb.TableMaster.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByCpf(String cpf);

    List<User> findByActive(boolean active);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    List<User> findByRole(UserRole role);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByCpf(String cpf);

    List<User> findByUsernameContainingOrEmailContainingOrRole(String s, String s1, UserRole userRole);
}