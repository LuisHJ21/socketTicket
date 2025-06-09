import oracledb from "oracledb";
import dotenv from "dotenv";
import colors from "colors";
dotenv.config();

oracledb.initOracleClient();

const dbConfig = {
  user: process.env.USERDB,
  password: process.env.PASSDB,
  connectString:
    "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=192.168.10.4)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=orcl.fisholg)))",
  // Puedes agregar más opciones aquí si necesitas
  events: true, // ✅ esto es clave para habilitar DCN
};

const dbConfigFish = {
  user: process.env.USERDB2,
  password: process.env.PASSDB2,
  connectString:
    "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=192.168.10.4)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=orcl.fisholg)))",
};

async function conectarDB() {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    console.log(colors.bgGreen.white.bold("CONEXION DB EXITOSA"));
    return connection;
  } catch (error) {
    console.log(colors.bgRed.white.bold("CONEXION DB FALLIDA: " + error));
    throw error;
  }
}

async function conectarDBFish() {
  try {
    const connection = await oracledb.getConnection(dbConfigFish);
    console.log(colors.bgGreen.white.bold("CONEXION DB EXITOSA"));
    return connection;
  } catch (error) {
    console.log(colors.bgRed.white.bold("CONEXION DB FALLIDA: " + error));
    throw error;
  }
}

export { conectarDB, oracledb, conectarDBFish };
