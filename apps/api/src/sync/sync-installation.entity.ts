import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Una sola fila. `generation` identifica esta vida de la base de datos: si el
 * servidor se restaura desde una copia antigua, cambia, y los cursores que los
 * móviles guardaron dejan de valer (hay que rehacer desde un bootstrap).
 * `capturing` enciende los triggers; con la sincronización apagada no se
 * escribe nada en el registro.
 */
@Entity('sync_installation')
export class SyncInstallation {
    @PrimaryColumn({ type: 'varchar', length: 16 })
    id: string;

    @Column({ type: 'varchar', length: 64 })
    generation: string;

    @Column({ type: 'boolean', default: false })
    capturing: boolean;
}
