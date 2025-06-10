import { conectarDBFish, oracledb } from "./config/db";

export async function GetUsuariosTI() {
  const conn = await conectarDBFish();

  try {
    const result = await conn.execute(
      `
        select u.cod_usr,u.nombre from usuario u where u.perfil='DEVELOP' and u.cod_usr!='rramir'
      `,
      [], // parámetros (vacío si no hay)
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      }
    );

    return result.rows;
  } catch (error) {
    console.error("❌ Error en polling:", error);
    return [];
  } finally {
    await conn.close();
  }
}
