package com.logistock.app.controller;

import com.logistock.app.model.Producto;
import com.logistock.app.repository.ProductoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoRestController {

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping
    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

   // Importa esto arriba si no lo tienes: import java.util.Objects;

    @PostMapping
    public ResponseEntity<Producto> crearProducto(@Valid @RequestBody Producto producto) {
        // CORRECCIÓN NULL TYPE SAFETY: Obligamos a Java a confirmar que no es nulo
        Producto nuevoProducto = productoRepository.save(java.util.Objects.requireNonNull(producto));
        return ResponseEntity.ok(nuevoProducto);
    }
    // CORRECCIÓN NULL TYPE SAFETY (Línea 43)
    @GetMapping("/{id}")

public ResponseEntity<Producto> obtenerPorId(@PathVariable Long id) {
    if (id == null) return ResponseEntity.badRequest().build();
    return productoRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
}

    // CORRECCIÓN NULL TYPE SAFETY (Línea 58)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id) {
        if (id == null) return ResponseEntity.badRequest().build();

        if (productoRepository.existsById(id)) {
            productoRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}