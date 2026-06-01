package com.logistock.app.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.logistock.app.model.Auditoria;

import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findAllByOrderByFechaDesc();
}