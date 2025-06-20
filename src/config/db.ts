import oracledb from "oracledb";
import dotenv from "dotenv";
import colors from "colors";
dotenv.config();

oracledb.initOracleClient();

const dbConfig = {
  user: process.env.USERDB,
  password: process.env.PASSDB,
  connectString: process.env.DATABASE,
  //"(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=192.168.10.4)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=orcl.fisholg)))",
  // Puedes agregar más opciones aquí si necesitas
  events: true, // ✅ esto es clave para habilitar DCN
};

const dbConfigFish = {
  user: process.env.USERDB2,
  password: process.env.PASSDB2,
  connectString:
    "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=192.168.10.4)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=orcl.fisholg)))",
};

const dbConfigGrupo = {
  user: process.env.USERDB3,
  password: process.env.PASSDB3,
  connectString: process.env.DATABASE3,
};

async function inicializarPool() {
  try {
    await oracledb.createPool(dbConfig);
    console.log(colors.bgGreen.white.bold("✅ POOL DE CONEXIÓN CREADO"));
  } catch (err) {
    console.error(
      colors.bgRed.white.bold("❌ ERROR AL CREAR EL POOL DE CONEXIÓN:"),
      err
    );
    process.exit(1);
  }
}

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
    console.log(colors.bgGreen.white.bold("CONEXION DB EXITOSA FISHOLG"));
    return connection;
  } catch (error) {
    console.log(
      colors.bgRed.white.bold("CONEXION DB FALLIDA FISHOLG: " + error)
    );
    throw error;
  }
}

async function cerrarPool() {
  try {
    await oracledb.getPool().close(10);
    console.log(colors.bgYellow.black("👋 POOL CERRADO CORRECTAMENTE"));
  } catch (err) {
    console.error("❌ ERROR AL CERRAR EL POOL", err);
  }
}

export { conectarDB, oracledb, conectarDBFish, inicializarPool, cerrarPool };
