import { conectarDB, oracledb,conectarDBFish } from "./config/db";
import fs from "fs";
import ini from "ini";
import { EsquemaConfig, IniConfig, TicketData, Ticketusuario } from "./types";

const configIni: IniConfig = ini.parse(
  fs.readFileSync("D:\\SYNERGY\\exe\\empresas.ini", "utf-8")
);

const userCache= new Map()

export const Polling = async (sendUpdateToClients, intervalMs = 5000) => {
  const conn = await conectarDB();
  console.log("🔗 Conexión abierta para polling persistente");

  const pollingInterval = setInterval(async () => {
    try {
      const result = await conn.execute(
        `
         select t.id_ticket,t.usu_gen as CREADO,a.usu_operador as ATENDIDO,t.flag_estado,t.asunto,
  to_char(t.fech_registro,'dd/mm/yyyy HH24:mi:ss')as FECH_REGISTRO,
  to_char(nvl((select max(d.fech_registro) from DET_TICKET d where d.id_ticket=t.id_ticket),t.fech_registro),'dd/mm/yyyy HH24:mi:ss')as FECH_ACTUALIZA,
  to_char(a.fech_asigna,'dd/mm/yyyy HH24:mi:ss')as FECH_ASIG,
  to_char(t.fech_cierre,'dd/mm/yyyy HH24:mi:ss')as FECH_CIERRE,
  t.siglas_empresa,tt.descripcion tipo_ticket,t.flag_proceso
  from  TICKET t left join (select id_ticket, usu_operador, fech_asigna from (select id_ticket, usu_operador, fech_asigna, row_number() over (partition by id_ticket order by fech_asigna desc) rn from ASIG_TICKET) where rn=1) a on t.id_ticket=a.id_ticket left join TIPO_TICKET tt on t.tipo_ticket=tt.id_ticket where (t.flag_estado!='5' or trunc(a.fech_asigna)=trunc(sysdate) or trunc(t.fech_cierre)=trunc(sysdate))  order by  t.flag_proceso desc,t.fech_registro asc
      `,
        [], // parámetros (vacío si no hay)
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        }
      );
      //console.log(userCache)

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


      const esquema = configIni.Esquema[row.SIGLAS_EMPRESA.trim()]?.trim();
      const password = configIni.Password[row.SIGLAS_EMPRESA.trim()]?.trim();
      const baseDatos = configIni.BaseDatos[row.SIGLAS_EMPRESA.trim()]
        ?.trim()
        .replace(/'/g, "");

      const clave=`${row.SIGLAS_EMPRESA.trim()}-${row.CREADO.trim()}`

      if(userCache.has(clave))
      {
          nuevaSalida.push({...row,NOMBRE:userCache.get(clave).NOMBRE})
          continue;

      }

      const consultarUser=await obtenerUsuarioDB(esquema,row)


        if(consultarUser.NOMBRE && consultarUser.NOMBRE!=='BD ERROR')
        userCache.set(clave,consultarUser)

        nuevaSalida.push({...row,NOMBRE:consultarUser.NOMBRE})


  }

  return nuevaSalida;
};


const obtenerUsuarioDB= async(esquema:string,dataUsuario:TicketData)=>
{
//console.log('consultando base de datos')
  let descripcion = null;
  let error = null;

  try{

    const conn = await conectarDBFish()

    if (!esquema) {
      error = `No se encontró esquema`;
    } else {
      try {
        // const sql = `SELECT nombre FROM ${esquema}.usuario WHERE cod_usr = :id`;
        const sql = `SELECT nombre FROM MV_REGISTRO_USUARIO WHERE cod_usr = :id AND trim(siglas)= trim(:siglasEmpresa)`;
        const res = await conn.execute<{ NOMBRE: string }>(
            sql,
            [dataUsuario.CREADO,dataUsuario.SIGLAS_EMPRESA],
            {
              outFormat: oracledb.OUT_FORMAT_OBJECT,
            }
        );
       // console.log(sql,res,dataUsuario)
        descripcion = res.rows[0]?.NOMBRE || null;
      } catch (err) {
        error = err.message;
      }
    }


    await conn.close();
    return  {NOMBRE:descripcion || `USER ${dataUsuario.CREADO} NOT FOUND`}


  } catch (error) {

    return  {NOMBRE:"BD ERROR"}

  }
}


export { obtenerUsuarios };
