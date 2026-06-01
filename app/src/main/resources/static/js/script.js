/* =========================================================================
   SISTEMA MIGRADO A API REST (CUMPLE RÚBRICA 4: CRUD FRONTEND -> BACKEND)
   ========================================================================= */

// Variables Globales
let inventarioGlobal = [];
let chartCategoriasInstance = null;
let chartStockInstance = null;
let editandoId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // El darkMode sí puede usar localStorage porque es una preferencia de UI
    if(localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        const icono = document.getElementById('iconoTema');
        if(icono) { icono.classList.replace('bi-moon-stars-fill', 'bi-sun-fill'); }
    }

    const authForm = document.getElementById('authForm');
    if(authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulación visual de login (la seguridad real requiere Spring Security)
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            iniciarApp();
        });
    } else {
        iniciarApp();
    }
});

function iniciarApp() {
    obtenerDolar();
    cargarInventario();
}

/* ================== OPERACIONES CRUD CON FETCH (API REST) ================== */

// LEER (READ)
async function cargarInventario() {
    try {
        const response = await fetch('/api/productos');
        const productos = await response.json();
        inventarioGlobal = productos;
        renderizarTabla(productos);
        actualizarDashboards();
    } catch (error) {
        console.error("Error al cargar inventario:", error);
        Swal.fire('Error', 'No se pudo conectar a la base de datos', 'error');
    }
}

// CREAR (CREATE)
document.getElementById('formProducto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevoProducto = {
        nombre: document.getElementById('nombre').value,
        categoria: { nombre: document.getElementById('categoria').value },
        cantidad: parseInt(document.getElementById('cantidad').value),
        precioCompra: parseFloat(document.getElementById('precioCompra').value),
        precioVenta: parseFloat(document.getElementById('precioVenta').value)
    };

    try {
        const response = await fetch('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoProducto)
        });
        
        if(response.ok) {
            Swal.fire('¡Éxito!', 'Producto registrado en MySQL', 'success');
            cerrarModal();
            document.getElementById('formProducto').reset();
            cargarInventario();
        } else {
            Swal.fire('Error', 'Verifica los datos del producto', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'No se pudo conectar al servidor', 'error');
    }
});

// ACTUALIZAR (UPDATE)
document.getElementById('formEditar')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const productoActualizado = {
        nombre: document.getElementById('editNombre').value,
        categoria: { nombre: document.getElementById('editCategoria').value },
        cantidad: parseInt(document.getElementById('editCantidad').value || 0), // Si tu modal editar no tiene cantidad, agrégalo o ignóralo
        precioCompra: parseFloat(document.getElementById('editPrecioCompra').value),
        precioVenta: parseFloat(document.getElementById('editPrecioVenta').value)
    };

    try {
        const response = await fetch(`/api/productos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productoActualizado)
        });
        
        if(response.ok) {
            Swal.fire('¡Actualizado!', 'Datos guardados en MySQL', 'success');
            cerrarModalEdicion();
            cargarInventario();
        }
    } catch (error) {
        console.error(error);
    }
});

// ELIMINAR (DELETE)
async function eliminarProducto(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Se borrará permanentemente de la Base de Datos",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, borrar'
    });

    if (result.isConfirmed) {
        try {
            await fetch(`/api/productos/${id}`, { method: 'DELETE' });
            Swal.fire('Borrado', 'El producto ha sido eliminado.', 'success');
            cargarInventario();
        } catch (error) {
            console.error(error);
        }
    }
}

/* ================== RENDERIZADO Y UI (Sin cambios drásticos) ================== */

function renderizarTabla(productos) {
    const tbody = document.getElementById('listaProductos');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    productos.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold">${p.nombre}</td>
                <td><span class="badge bg-secondary">${p.categoria.nombre}</span></td>
                <td class="text-center">
                    <span class="badge ${p.cantidad < 5 ? 'bg-danger animate-pulse' : 'bg-success'}">${p.cantidad}</span>
                </td>
                <td class="text-end">S/ ${p.precioCompra.toFixed(2)}</td>
                <td class="text-end">S/ ${p.precioVenta.toFixed(2)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary shadow-sm" onclick="abrirModalEdicion(${p.id}, '${p.nombre}', '${p.categoria.nombre}', ${p.precioCompra}, ${p.precioVenta}, ${p.cantidad})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger shadow-sm" onclick="eliminarProducto(${p.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function abrirModal() { document.getElementById('modalFormulario').classList.add('active'); }
function cerrarModal() { document.getElementById('modalFormulario').classList.remove('active'); }

// Agregué 'cantidad' al modal de edición para que el PUT no asigne Null a la BD
function abrirModalEdicion(id, nombre, cat, pC, pV, cant) {
    document.getElementById('editId').value = id;
    document.getElementById('editNombre').value = nombre;
    document.getElementById('editCategoria').value = cat;
    document.getElementById('editPrecioCompra').value = pC;
    document.getElementById('editPrecioVenta').value = pV;
    
    // Si no tienes este input en el HTML, créalo. Por ahora, el JS intentará encontrarlo.
    if(document.getElementById('editCantidad')) {
        document.getElementById('editCantidad').value = cant;
    }
    
    document.getElementById('modalEditar').classList.add('active');
}
function cerrarModalEdicion() { document.getElementById('modalEditar').classList.remove('active'); }

function actualizarDashboards() {
    const totalProd = inventarioGlobal.length;
    const valorAlmacen = inventarioGlobal.reduce((acc, p) => acc + (p.precioCompra * p.cantidad), 0);
    const criticos = inventarioGlobal.filter(p => p.cantidad < 5).length;

    if(document.getElementById('statTotal')) document.getElementById('statTotal').innerText = totalProd;
    if(document.getElementById('statValor')) document.getElementById('statValor').innerText = `S/ ${valorAlmacen.toFixed(2)}`;
    if(document.getElementById('statCritico')) document.getElementById('statCritico').innerText = criticos;

    actualizarGraficos();
}

function actualizarGraficos() {
    if(!document.getElementById('chartCategorias')) return;
    
    const categorias = {};
    inventarioGlobal.forEach(p => {
        categorias[p.categoria.nombre] = (categorias[p.categoria.nombre] || 0) + 1;
    });

    const ctxCat = document.getElementById('chartCategorias').getContext('2d');
    if(chartCategoriasInstance) chartCategoriasInstance.destroy();
    chartCategoriasInstance = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categorias),
            datasets: [{ data: Object.values(categorias), backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function filtrarInventario() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const cat = document.getElementById('filtroCategoria').value;
    const filtrados = inventarioGlobal.filter(p => {
        const coincideCat = cat === "" || p.categoria.nombre === cat;
        const coincideTex = p.nombre.toLowerCase().includes(texto);
        return coincideCat && coincideTex;
    });
    renderizarTabla(filtrados);
}

// Tipo de Cambio
async function obtenerDolar() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        const statDolar = document.getElementById('statDolar');
        if(statDolar) statDolar.innerText = `S/ ${data.rates.PEN.toFixed(3)}`;
    } catch (e) {
        if(document.getElementById('statDolar')) document.getElementById('statDolar').innerText = "Error de red";
    }
}

// Navegación Básica
function verDashboard() {
    document.getElementById('seccionDashboard').style.display = 'block';
    document.getElementById('seccionInventario').style.display = 'none';
}
function verInventario() {
    document.getElementById('seccionDashboard').style.display = 'none';
    document.getElementById('seccionInventario').style.display = 'block';
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const esOscuro = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', esOscuro);
    const icono = document.getElementById('iconoTema');
    if(icono) {
        if(esOscuro) {
            icono.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
        } else {
            icono.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
        }
    }
}