package com.logistock.app.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // PERMITIR INDEX Y RECURSOS: Soluciona la redirección forzada
                .requestMatchers("/", "/index", "/css/**", "/js/**", "/img/**", "/assets/**", "/favicon.ico").permitAll()
                // RUTAS PROTEGIDAS ESPECÍFICAS
                .requestMatchers("/dashboard", "/productos/**", "/auditoria", "/perfil").authenticated()
                .requestMatchers("/stock-critico", "/administracion").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/login") // SPRING TOMA EL CONTROL DEL POST AQUÍ
                .defaultSuccessUrl("/dashboard", true) // REDIRIGE TRAS ÉXITO
                .failureUrl("/login?error=true")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/?logout=true") // DEVUELVE AL INDEX AL SALIR
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}