import { TableColumn, type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Las descargas de una lista pública pasan a estar **apagadas de serie**.
 *
 * Nacieron encendidas y no debieron: ver quién predica el domingo en una página
 * es una cosa, y que cualquiera que abra el enlace se lleve un PDF con los
 * nombres de la congregación —que ya no caduca, ni se despublica, ni se sabe
 * dónde acaba— es otra. Es la misma decisión que ya estaba tomada para la foto
 * (RFC 0010 D16): lo que expone de más nace apagado y se enciende a conciencia.
 *
 * **También apaga las que ya existen**, y no solo el valor por defecto. Dejar
 * encendidas las de antes sería quedarse con la mitad de la decisión justo en
 * las listas que ya están repartidas por ahí, que son las que importan. Se
 * vuelve a encender con una casilla en la pestaña Compartir.
 *
 * `ALTER COLUMN … SET DEFAULT` solo existe en Postgres. En SQLite hay que pasar
 * por `changeColumn`, que recrea la tabla entera con sus índices; por eso es la
 * rama larga y no la corta.
 */
export class DefaultListDownloadOff1787875200000 implements MigrationInterface {
  name = 'DefaultListDownloadOff1787875200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await cambiarDefecto(queryRunner, false);

    const isPostgres = queryRunner.connection.options.type === 'postgres';
    await queryRunner.query(`UPDATE "lists" SET "allow_download" = ${isPostgres ? 'false' : '0'}`);
  }

  /**
   * Al revés se devuelve el valor por defecto, **pero no se vuelve a encender lo
   * que había**: aquí no se sabe cuáles estaban encendidas antes, y encender
   * descargas de listas publicadas por si acaso es exactamente lo que esta
   * migración vino a arreglar.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await cambiarDefecto(queryRunner, true);
  }
}

async function cambiarDefecto(queryRunner: QueryRunner, valor: boolean): Promise<void> {
  if (queryRunner.connection.options.type === 'postgres') {
    await queryRunner.query(
      `ALTER TABLE "lists" ALTER COLUMN "allow_download" SET DEFAULT ${valor ? 'true' : 'false'}`,
    );
    return;
  }

  await queryRunner.changeColumn(
    'lists',
    'allow_download',
    new TableColumn({
      name: 'allow_download',
      type: 'boolean',
      isNullable: false,
      default: valor,
    }),
  );
}
