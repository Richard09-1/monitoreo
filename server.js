
//servidor.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = requiere('socket.io')(http);
const fs = require('fs');
const path = require('path');
puerto Const = 3000;
app.use(express.static('público'));
app.use(express.json());
// Array para almacenar datos en memoria
let datosHistoricos = [];
// Crear alfombra para archivos si no existe
const dataDir = path.join(__dirname, 'datos');
¡si (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}
// Ruta para recibir datos del ESP32
app.post('/datos', (req, res) => {
  const datos = req.body;
  const timestamp = nuevo Date().toISOString();

  //Agregar marca de tiempo a los datos
  const datosConTiempo = {
    ...datos,
    marca de tiempo
  };

  // Guardar en memoria
  datosHistóricos.push(datosConTiempo);

  // Mantener solo las últimas 1000 conferencias en memoria
  if (datosHistoricos.length > 1000) {
    datosHistóricos.shift();
  }

  // Guardar en archivo
  const logLine = ${timestamp},${datos.voltaje},${datos.corriente},${datos.potencia},${datos.posicion}\n;
  fs.appendFile(path.join(dataDir, 'datos.csv'), logLine, (err) => {
    si (err) console.error('Error guardando datos:', err);
  });

  // Emitir una web de clientes
  io.emit('actualización', datosConTiempo);
  res.send({status: 'ok'});
});
// Ruta para descargar datos
app.get('/descargar', (req, res) => {
  const formato = req.query.formato || 'csv';
  const fileName = datos_sensores.${formato};

  si (formato === 'csv') {
    res.setHeader('Tipo de contenido', 'texto/csv');
    res.setHeader('Disposición de Contenido', attachment; filename=${fileName});
    res.write('Timestamp,Voltaje(V),Corriente(mA),Potencia(mW),Posicion\n');
    datosHistoricos.forEach(dato => {
      res.escribir(${dato.timestamp},${dato.voltaje},${dato.corriente},${dato.potencia},${dato.posicion}\n);
    });
    res.end();
  } más if (formato === 'txt') {
    res.setHeader('Tipo de Contenido', 'texto/llanura');
    res.setHeader('Disposición de Contenido', attachment; filename=${fileName});
    datosHistoricos.forEach(dato => {
      res.escribir(Tiempo: ${dato.timestamp}\n);
      res.escribir(Voltaje: ${dato.voltaje}V\n);
      res.escribir(Corriente: ${dato.corriente}mA\n);
      res.escribir(Potencia: ${dato.potencia}mW\n);
      res.escribir(Posición: ${dato.posicion}\n);
      res.write('--------------\n');
    });
    res.end();
  }
});
http.listen(port, () => {
  console.log(Servidor corriendo en http://localhost:${port});
});
