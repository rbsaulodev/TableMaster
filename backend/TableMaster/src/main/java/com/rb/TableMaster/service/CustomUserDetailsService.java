package com.rb.TableMaster.service;

import com.rb.TableMaster.model.User;
import com.rb.TableMaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        Optional<User> userByCpf = userRepository.findById(identifier);

        if (userByCpf.isPresent()) {
            return new UserDetailsImpl(userByCpf.get());
        }

        Optional<User> userByUsername = userRepository.findByUsername(identifier);

        if (userByUsername.isPresent()) {
            return new UserDetailsImpl(userByUsername.get());
        }

        throw new UsernameNotFoundException("Usuário ou CPF não encontrado: " + identifier);
    }
}