// Importar Express y Googleapis
const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser"); // Importar body-parser


const cors = require('cors');
const app = express();

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json())


const auth = new google.auth.GoogleAuth({
 keyFile: "credentials.json",
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});


const spreadsheetId = "1o9HP4ZKYiF_vEuhLR0HFp3GeZDa6JCZyz4XPXqn0g6E";  
const range = "Llamadas!A:I"; // Ajusta según tu rango de datos

// Función para obtener una instancia autenticada de Google Sheets
async function getGoogleSheetsInstance() {
    const client = await auth.getClient();
    return google.sheets({ version: "v4", auth: client });
  }
  

// Endpoint para obtener el estado del lead por correo
app.get("/getState", async (req, res) => {
    try {
      const { email } = req.query; // Suponiendo que el correo es enviado como query parameter
      const googleSheets = await getGoogleSheetsInstance();
  
      // Obtener todas las filas
      const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
  
      const rows = response.data.values;
      let state = null;
  

      // Buscar el estado correspondiente al correo
      for (let i = 0; i < rows.length; i++) {
     
        if (rows[i][1] === email) { // Suponiendo que la columna del correo es la segunda columna (índice 1)
          console.log(`${rows[i][1]}`)
            state = rows[i][8]; // Suponiendo que la columna del estado es la octava columna (índice 7)
          console.log(`Estado encontrado: ${state}`); // Debugging
          break;
        }
      }
  
      if (state === null) {
        res.status(404).json({ error: `No se encontró ningún lead con el correo ${email}` });
      } else {
        res.json({ state: state, message: `El estado del lead con el correo ${email} es: ${state} ` });
      }

    } catch (err) {
      console.error("Error al leer datos de Google Sheets:", err);
      res.status(500).send("Error interno del servidor");
    }
  });
  
  // Endpoint para obtener múltiples campos del lead por correo
app.get("/getLeadData", async (req, res) => {
  try {
    const { email } = req.query; // Suponiendo que el correo es enviado como query parameter
    const googleSheets = await getGoogleSheetsInstance();

    // Obtener todas las filas
    const response = await googleSheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    let leadData = null;

    // Buscar los datos correspondientes al correo
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][1] === email) { // Suponiendo que la columna del correo es la segunda columna (índice 1)
     
        leadData = {
          campo1: rows[i][0], // Ejemplo de índice de columna para el primer campo
          campo2: rows[i][1], // Ejemplo de índice de columna para el segundo campo
          campo3: rows[i][2], // Ejemplo de índice de columna para el tercer campo
          campo4: rows[i][3], // Ejemplo de índice de columna para el cuarto campo
          campo5: rows[i][4], // Ejemplo de índice de columna para el quinto campo
          campo6: rows[i][5], // Ejemplo de índice de columna para el sexto campo
          campo7: rows[i][6], // Ejemplo de índice de columna para el séptimo campo
          campo8: rows[i][7], // Ejemplo de índice de columna para el octavo campo
          campo9: rows[i][8]
        };
        console.log(`Datos del lead encontrados: ${JSON.stringify(leadData)}`); // Debugging
        break;
      }
    }

    if (leadData === null) {
      res.status(404).json({ error: `No se encontró ningún lead con el correo ${email}` });
    } else {
      res.json({
        leadData: leadData,
        message: `Los datos del lead con el correo ${email} son: ${JSON.stringify(leadData)}`
      });
    }
  } catch (err) {
    console.error("Error al leer datos de Google Sheets:", err);
    res.status(500).send("Error interno del servidor");
  }
});



// Endpoint para actualizar estado en Google Sheets
app.post("/update", async (req, res) => {
    try {
      const { email, newState } = req.body;
  
      if (!email || !newState) {
        throw new Error("El correo y el nuevo estado son necesarios");
      }
  
      const googleSheets = await getGoogleSheetsInstance();
  
      // Obtener todas las filas
      const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
  
      const rows = response.data.values;
      let rowIndex = -1;
  
      // Buscar la fila correspondiente al correo
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][1] === email) { // Suponiendo que la columna del correo es la segunda columna (índice 1)
          rowIndex = i;
          break;
        }
      }
  
      if (rowIndex === -1) {
        throw new Error(`No se encontró ningún lead con el correo ${email}`);
      }
  
      // Actualizar el estado en Google Sheets
      const updateResponse = await googleSheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Llamadas!I${rowIndex + 1}`, // Asumiendo que H es la columna donde se encuentra el estado
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[newState]],
        },
      });
  
      console.log("Respuesta de actualización:", updateResponse.data);
  
       // Envía una respuesta JSON
    res.json({newState: newState, message: "Estado actualizado correctamente" });
    } catch (err) {
      console.error("Error al actualizar datos en Google Sheets:", err.message);
      res.status(500).send("Error interno del servidor");
    }
  });
  

// Iniciar el servidor Express
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
