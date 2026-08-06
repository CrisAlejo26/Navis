import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HolidayCache } from './holiday-cache.entity';
import { HOLIDAYS_FETCH, HolidaysService } from './holidays.service';

/**
 * Los festivos del calendario (RFC 0011).
 *
 * No tiene controlador: no se consultan sueltos, se pegan a los días del tramo
 * que ya devuelve el calendario. Quien lo necesite importa este módulo.
 */
// Envuelto en una flecha y no con `.bind`: `fetch` está sobrecargado y `bind`
// se lo come devolviendo `any`, que es justo lo que no queremos (Regla 10).
const salirALaCalle: typeof fetch = (input, init) => globalThis.fetch(input, init);

@Module({
  imports: [TypeOrmModule.forFeature([HolidayCache])],
  providers: [HolidaysService, { provide: HOLIDAYS_FETCH, useValue: salirALaCalle }],
  exports: [HolidaysService],
})
export class HolidaysModule {}
