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

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerPorId(@PathVariable Long id) {
        return productoRepository.findById(java.util.Objects.requireNonNull(id))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Producto> crearProducto(@Valid @RequestBody Producto producto) {
        Producto nuevoProducto = productoRepository.save(java.util.Objects.requireNonNull(producto));
        return ResponseEntity.ok(nuevoProducto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizarProducto(@PathVariable Long id, @Valid @RequestBody Producto detalles) {
        return productoRepository.findById(java.util.Objects.requireNonNull(id)).map(producto -> {
            producto.setNombre(detalles.getNombre());
            producto.setCantidad(detalles.getCantidad());
            producto.setPrecioCompra(detalles.getPrecioCompra());
            producto.setPrecioVenta(detalles.getPrecioVenta());
            producto.setCategoria(detalles.getCategoria());
            return ResponseEntity.ok(productoRepository.save(producto));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id) {
        Long safeId = java.util.Objects.requireNonNull(id);
        if (productoRepository.existsById(safeId)) {
            productoRepository.deleteById(safeId);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}