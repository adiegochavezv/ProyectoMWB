package com.logistock.app.repository;
import com.logistock.app.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    // Spring Data JPA crea la query automáticamente ("SELECT p FROM Producto p WHERE p.cantidad < ?1")
    List<Producto> findByCantidadLessThan(Integer cantidad);
}