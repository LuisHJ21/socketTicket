import { conectarDBFish, oracledb } from "./config/db";

export async function GetUsuariosTI() {
  const conn = await conectarDBFish();

  try {
    const result = await conn.execute(
      `
        select  COD_USR, NOMBRE from usuario
where PERFIL in ('OPER_TI')
      `,
      [], // parámetros (vacío si no hay)
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    return [];
  } finally {
    await conn.close();
  }
}
