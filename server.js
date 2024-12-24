const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

// Puerto del servidor
const puerto = 3000;

// Configuración del servidor
app.use(express.static('public'));
app.use(express.json());

// Array para almacenar datos en memoria
let datosHistoricos = [];

// Crear carpeta para almacenar datos si no existe
const dataDir = path.join(__dirname, 'datos');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Ruta para recibir datos del receptor
app.post('/datos', (req, res) => {
  const datos = req.body;
  const timestamp = new Date().toISOString();

  // Agregar marca de tiempo a los datos
  const datosConTiempo = {
    ...datos,
    timestamp,
  };

  // Guardar datos en memoria
  datosHistoricos.push(datosConTiempo);

  // Limitar los datos almacenados a los últimos 1000 registros
  if (datosHistoricos.length > 1000) {
    datosHistoricos.shift();
  }

  // Guardar datos en un archivo CSV
  const logLine = `${timestamp},${datos.voltaje},${datos.corriente},${datos.potencia},${datos.rpm},${datos.porcentajeBateria},${datos.contador}\n`;
  fs.appendFile(path.join(dataDir, 'datos.csv'), logLine, (err) => {
    if (err) console.error('Error al guardar los datos:', err);
  });

  // Emitir los datos a los clientes conectados
  io.emit('actualizacion', datosConTiempo);

  // Responder al receptor
  res.send({ status: 'ok' });
});

// Ruta para descargar datos históricos
app.get('/descargar', (req, res) => {
  const formato = req.query.formato || 'csv';
  const fileName = `datos_sensores.${formato}`;

  if (formato === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.write('Timestamp,Voltaje(V),Corriente(mA),Potencia(mW),RPM,PorcentajeBateria(%),Contador\n');
    datosHistoricos.forEach(dato => {
      res.write(`${dato.timestamp},${dato.voltaje},${dato.corriente},${dato.potencia},${dato.rpm},${dato.porcentajeBateria},${dato.contador}\n`);
    });
    res.end();
  } else if (formato === 'txt') {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    datosHistoricos.forEach(dato => {
      res.write(`Timestamp: ${dato.timestamp}\n`);
      res.write(`Voltaje: ${dato.voltaje}V\n`);
      res.write(`Corriente: ${dato.corriente}mA\n`);
      res.write(`Potencia: ${dato.potencia}mW\n`);
      res.write(`RPM: ${dato.rpm}\n`);
      res.write(`Porcentaje de Batería: ${dato.porcentajeBateria}%\n`);
      res.write(`Contador: ${dato.contador}\n`);
      res.write('--------------\n');
    });
    res.end();
  } else {
    res.status(400).send({ error: 'Formato no soportado' });
  }
});

// Manejar conexión de clientes web
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  // Enviar datos históricos al cliente recién conectado
  socket.emit('datosHistoricos', datosHistoricos);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar el servidor
http.listen(puerto, () => {
  console.log(`Servidor corriendo en http://localhost:${puerto}`);
});
