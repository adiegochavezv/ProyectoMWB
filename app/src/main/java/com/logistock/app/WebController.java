package com.logistock.app;

import com.logistock.app.model.Producto;
import com.logistock.app.repository.AuditoriaRepository;
import com.logistock.app.repository.CategoriaRepository;
import com.logistock.app.repository.ProductoRepository;
import com.logistock.app.service.AuditoriaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
public class WebController {

    @Autowired private ProductoRepository productoRepository;
    @Autowired private CategoriaRepository categoriaRepository;
    @Autowired private AuditoriaRepository auditoriaRepository;
    @Autowired private AuditoriaService auditoriaService;

    @GetMapping({"/", "/index"})
    public String index() { return "index"; }

    @GetMapping("/login")
    public String login() { return "login"; }

    // 1. DASHBOARD: Solo métricas y resumen (Separado del almacén)
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("productos", productoRepository.findAll());
        model.addAttribute("categorias", categoriaRepository.findAll());
        return "app/dashboard";
    }

    // 2. ALMACÉN: Gestión completa de productos
    @GetMapping("/productos")
    public String productos(Model model) {
        model.addAttribute("productos", productoRepository.findAll());
        model.addAttribute("categorias", categoriaRepository.findAll());
        return "app/productos";
    }

    // 3. AUDITORÍA: Recuperada y conectada
    @GetMapping("/auditoria")
    public String auditoria(Model model) {
        model.addAttribute("auditorias", auditoriaRepository.findAllByOrderByFechaDesc());
        auditoriaService.registrarAccion("CONSULTA", "El usuario visualizó el registro de auditoría");
        return "app/auditoria";
    }

    // Guardar o Editar Producto
    @PostMapping("/productos/guardar")
    public String guardarProducto(@Valid @ModelAttribute Producto producto, BindingResult result) {
        if (result.hasErrors()) return "redirect:/productos?error=validacion";
        
        boolean esNuevo = (producto.getId() == null);
        productoRepository.save(producto);
        
        String accion = esNuevo ? "CREAR_PRODUCTO" : "EDITAR_PRODUCTO";
        auditoriaService.registrarAccion(accion, "Producto: " + producto.getNombre());
        return "redirect:/productos";
    }

    // 4. NUEVO: Lógica de Movimientos (Ingreso, Venta, Merma, Defectuoso)
    @PostMapping("/productos/{id}/movimiento")
    public String registrarMovimiento(@PathVariable Long id, 
                                      @RequestParam String tipoMovimiento, 
                                      @RequestParam int cantidad) {
        Long safeId = java.util.Objects.requireNonNull(id);
        productoRepository.findById(safeId).ifPresent(p -> {
            int stockAnterior = p.getCantidad();
            if ("INGRESO".equals(tipoMovimiento)) {
                p.setCantidad(p.getCantidad() + cantidad);
            } else {
                p.setCantidad(Math.max(0, p.getCantidad() - cantidad)); 
            }
            productoRepository.save(p);
            String detalle = String.format("Tipo: %s | Prod: %s | Stock: %d -> %d", 
                                           tipoMovimiento, p.getNombre(), stockAnterior, p.getCantidad());
            auditoriaService.registrarAccion("MOVIMIENTO_INVENTARIO", detalle);
        });
        return "redirect:/productos";
    }

    @PostMapping("/productos/eliminar/{id}")
    public String eliminarProducto(@PathVariable Long id) {
        Long safeId = java.util.Objects.requireNonNull(id);
        productoRepository.findById(safeId).ifPresent(p -> {
            productoRepository.deleteById(safeId);
            auditoriaService.registrarAccion("ELIMINAR_PRODUCTO", "Eliminado: " + p.getNombre());
        });
        return "redirect:/productos";
    }

    @GetMapping("/stock-critico")
    public String stockCritico(Model model) {
        model.addAttribute("criticos", productoRepository.findByCantidadLessThan(5));
        auditoriaService.registrarAccion("VISTA_CRITICA", "Acceso a panel crítico");
        return "app/stock_critico";
    }
}