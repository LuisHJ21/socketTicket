import { conectarDB, oracledb } from "./config/db";

export async function Polling(sendUpdateToClients, intervalMs = 5000) {
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

      sendUpdateToClients(result.rows);
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
}
