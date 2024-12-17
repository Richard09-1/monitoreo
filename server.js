const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

// Array para almacenar datos en memoria
let datosHistoricos = [];

// Crear carpeta para archivos si no existe
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}

// Ruta para recibir datos del ESP32
app.post('/datos', (req, res) => {
  const datos = req.body;
  const timestamp = new Date().toISOString();
  
  // Agregar timestamp a los datos
  const datosConTiempo = {
    ...datos,
    timestamp
  };
  
  // Guardar en memoria
  datosHistoricos.push(datosConTiempo);
  
  // Mantener solo las últimas 1000 lecturas en memoria
  if (datosHistoricos.length > 1000) {
    datosHistoricos.shift();
  }
  
  // Guardar en archivo
  // MODIFICADO: Añadido campo de porcentaje de batería
  const logLine = `${timestamp},${datos.voltaje},${datos.corriente},${datos.potencia},${datos.posicion},${datos.bateriaPorcentaje}\n`;
  fs.appendFile(path.join(dataDir, 'datos.csv'), logLine, (err) => {
    if (err) console.error('Error guardando datos:', err);
  });
  
  // Emitir a clientes web
  io.emit('actualizacion', datosConTiempo);
  res.send({status: 'ok'});
});

// Ruta para descargar datos
app.get('/descargar', (req, res) => {
  const formato = req.query.formato || 'csv';
  const fileName = `datos_sensores.${formato}`;
  
  if (formato === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    // MODIFICADO: Añadido encabezado para porcentaje de batería
    res.write('Timestamp,Voltaje(V),Corriente(mA),Potencia(mW),Posicion,Bateria(%)\n');
    datosHistoricos.forEach(dato => {
      // MODIFICADO: Añadido campo de porcentaje de batería
      res.write(`${dato.timestamp},${dato.voltaje},${dato.corriente},${dato.potencia},${dato.posicion},${dato.bateriaPorcentaje}\n`);
    });
    res.end();
  } else if (formato === 'txt') {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    datosHistoricos.forEach(dato => {
      res.write(`Tiempo: ${dato.timestamp}\n`);
      res.write(`Voltaje: ${dato.voltaje}V\n`);
      res.write(`Corriente: ${dato.corriente}mA\n`);
      res.write(`Potencia: ${dato.potencia}mW\n`);
      res.write(`Posición: ${dato.posicion}\n`);
      // MODIFICADO: Añadido campo de porcentaje de batería
      res.write(`Batería: ${dato.bateriaPorcentaje}%\n`);
      res.write('------------------------\n');
    });
    res.end();
  }
});

http.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
