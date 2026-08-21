// Representa la estructura del archivo INI una vez cargado
export interface EsquemaConfig {
  [sigla: string]: string; // Ej: 'REFRIGERADOS_FISHOLG': 'FISHOLG'
}

// Resultado crudo del SELECT principal
export interface TicketData {
  ID_TICKET: number;
  CREADO: number; // usu_gen
  ATENDIDO: number | null;
  FLAG_ESTADO: string;
  ASUNTO: string;
  FECH_REGISTRO: string; // Formato 'dd/mm/yyyy HH24:mi:ss'
  FECH_ACTUALIZA: string; 
  SIGLAS_EMPRESA: string;
  TIPO_TICKET: string;
  FLAG_PROCESO: string;
}

// Resultado final enriquecido con la descripción
export interface Ticketusuario extends TicketData {
  NOMBRE: string | null;
  ERROR?: string;
}

export interface IniConfig {
  Esquema: { [key: string]: string };
  Password: { [key: string]: string };
  BaseDatos: { [key: string]: string };
}
