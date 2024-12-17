const socket = io();
let chart;

// Configuración de la gráfica
function setupChart() {
    const ctx = document.getElementById('grafica').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Voltaje (V)',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Actualizar valores en la página
function actualizarValores(datos) {
    document.getElementById('voltaje').textContent = datos.voltaje.toFixed(2);
    document.getElementById('corriente').textContent = datos.corriente.toFixed(2);
    document.getElementById('potencia').textContent = datos.potencia.toFixed(2);
    document.getElementById('posicion').textContent = datos.posicion;

    // Actualizar gráfica
    const tiempo = new Date().toLocaleTimeString();
    chart.data.labels.push(tiempo);
    chart.data.datasets[0].data.push(datos.voltaje);

    // Mantener solo los últimos 50 puntos
    if (chart.data.labels.length > 50) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update();
}

// Escuchar actualizaciones
socket.on('actualizacion', (datos) => {
    actualizarValores(datos);
});

// Inicializar
document.addEventListener('DOMContentLoaded', setupChart);