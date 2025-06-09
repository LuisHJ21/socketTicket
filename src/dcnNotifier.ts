import { conectarDB, oracledb } from "./config/db";

export async function startDCN(sendUpdateToClients) {
  try {
    //await eliminarSuscripcionesActivas(); //  cancela todo antes de suscribirse

    const connection = await conectarDB();

    await connection.subscribe(`subs_tickets_${Date.now()}`, {
      sql: `select t.id_ticket,t.usu_gen as CREADO,a.usu_operador as ATENDIDO,t.flag_estado,t.asunto,
  to_char(t.fech_registro,'dd/mm/yyyy HH24:mi:ss')as FECH_REGISTRO,t.siglas_empresa,t.tipo_ticket
  from  TICKET t left join ASIG_TICKET a on t.id_ticket=a.id_ticket`,
      callback: async (message) => {
        console.log("🔔 Notificación DCN recibida:", message);
        try {
          console.log("🔔 Cambio detectado:", message);

          const conn = await conectarDB();
          const result = await conn.execute(
            `select t.id_ticket,t.usu_gen as CREADO,a.usu_operador as ATENDIDO,t.flag_estado,t.asunto,
  to_char(t.fech_registro,'dd/mm/yyyy HH24:mi:ss')as FECH_REGISTRO,t.siglas_empresa,t.tipo_ticket
  from  TICKET t left join ASIG_TICKET a on t.id_ticket=a.id_ticket`,
            [], // parámetros (vacío si no hay)
            {
              outFormat: oracledb.OUT_FORMAT_OBJECT,
            }
          );
          await conn.close();

          sendUpdateToClients(result.rows);
          console.log("resultado");
        } catch (queryErr) {
          console.error(
            "❌ Error al consultar datos tras notificación:",
            queryErr
          );
        }
      },
      qos: oracledb.SUBSCR_QOS_ROWIDS,
      timeout: 0,
    });

    console.log("✅ Suscripción DCN activa.");
  } catch (err) {
    console.error("❌ Error al iniciar DCN:", err.message || err);
    if (err.message?.includes("ORA-29972")) {
      console.error(
        "➡️ Revisa si tienes el privilegio: GRANT CHANGE NOTIFICATION TO tu_usuario;"
      );
    }
  }
}

export async function getTicketData() {
  const conn = await conectarDB();
  try {
    const result = await conn.execute(
      ` select t.id_ticket,t.usu_gen as CREADO,a.usu_operador as ATENDIDO,t.flag_estado,t.asunto,
  to_char(t.fech_registro,'dd/mm/yyyy HH24:mi:ss')as FECH_REGISTRO,t.siglas_empresa,t.tipo_ticket
  from  TICKET t left join ASIG_TICKET a on t.id_ticket=a.id_ticket where t.flag_estado!='5'  order by t.fech_registro asc`,
      [], // parámetros (vacío si no hay)
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    return result.rows;
  } finally {
    await conn.close();
  }
}

async function eliminarSuscripcionesActivas() {
  const conn = await conectarDB();
  try {
    const result = await conn.execute(
      `SELECT REGID FROM USER_CHANGE_NOTIFICATION_REGS`
    );

    const regids = result.rows.map((row) => row[0]);

    for (const regid of regids) {
      console.log(`⛔ Eliminando suscripción con REGID: ${regid}`);
      await conn.execute(
        `BEGIN DBMS_CHANGE_NOTIFICATION.DEREGISTER(:regid); END;`,
        [regid]
      );
    }

    console.log(`✅ Suscripciones activas eliminadas: ${regids.length}`);
  } catch (err) {
    console.error("❌ Error al eliminar suscripciones activas:", err);
  } finally {
    await conn.close();
  }
}
