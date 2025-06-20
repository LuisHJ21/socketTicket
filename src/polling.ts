import { conectarDB, oracledb } from "./config/db";
import fs from "fs";
import ini from "ini";
import { EsquemaConfig, IniConfig, TicketData, Ticketusuario } from "./types";

const configIni: IniConfig = ini.parse(
  fs.readFileSync("D:\\SYNERGY\\exe\\empresas.ini", "utf-8")
);

export const Polling = async (sendUpdateToClients, intervalMs = 5000) => {
  const conn = await conectarDB();
  console.log("🔗 Conexión abierta para polling persistente");

  const pollingInterval = setInterval(async () => {
    try {
      const result = await conn.execute(
        `
         select t.id_ticket,t.usu_gen as CREADO,a.usu_operador as ATENDIDO,t.flag_estado,t.asunto,
  to_char(t.fech_registro,'dd/mm/yyyy HH24:mi:ss')as FECH_REGISTRO,t.siglas_empresa,tt.descripcion tipo_ticket,t.flag_proceso
  from  TICKET t left join ASIG_TICKET a on t.id_ticket=a.id_ticket left join TIPO_TICKET tt on t.tipo_ticket=tt.id_ticket where t.flag_estado!='5'  order by  t.flag_proceso desc,t.fech_registro asc
      `,
        [], // parámetros (vacío si no hay)
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        }
      );

      const dataCompleta = await obtenerUsuarios(result.rows);
      //console.log(dataCompleta);

      sendUpdateToClients(dataCompleta);
      console.log("🔄 Datos enviados por polling (conexion persistente)");
    } catch (error) {
      console.error("❌ Error en polling:", error);
    }
  }, intervalMs);

  return async () => {
    clearInterval(pollingInterval);
    await conn.close();
    console.log("🛑 Polling detenido y conexión cerrada");
  };
};

const obtenerUsuarios = async (arrayTickets) => {
  const nuevaSalida = [];

  for (const row of arrayTickets) {
    try {
      let descripcion = null;
      let error = null;

      const esquema = configIni.Esquema[row.SIGLAS_EMPRESA.trim()]?.trim();
      const password = configIni.Password[row.SIGLAS_EMPRESA.trim()]?.trim();
      const baseDatos = configIni.BaseDatos[row.SIGLAS_EMPRESA.trim()]
        ?.trim()
        .replace(/'/g, "");

      const conn = await oracledb.getConnection({
        user: esquema,
        password,
        connectionString: baseDatos,
      });

      if (!esquema) {
        error = `No se encontró esquema para sigla ${row.SIGLAS_EMPRESA}`;
      } else {
        try {
          const sql = `SELECT nombre FROM ${esquema}.usuario WHERE cod_usr = :id`;
          const res = await conn.execute<{ NOMBRE: string }>(
            sql,
            [row.CREADO],
            {
              outFormat: oracledb.OUT_FORMAT_OBJECT,
            }
          );
          descripcion = res.rows[0]?.NOMBRE || null;
        } catch (err) {
          error = err.message;
        }
      }

      nuevaSalida.push({
        ...row,
        NOMBRE: descripcion || "USER NOT FOUND",
        error,
      });
      await conn.close();
    } catch (error) {
      nuevaSalida.push({
        ...row,
        NOMBRE: "BD ERROR",
        error,
      });
    }
  }

  return nuevaSalida;
};
