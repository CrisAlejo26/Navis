"""Add repeatable table fixtures to the isolated Android QA emulator.

Run: rtk proxy python scripts/seed-mobile-tables-qa.py --serial emulator-5556
Requires a debug Navis installation with an existing church/session and schema.
Only navis_tables_qa is allowed. Existing records and fixture edits are preserved.
Passwords are intentionally empty: create one through the native encrypted editor.
"""
import argparse
import datetime as dt
import json
from pathlib import Path
import sqlite3
import subprocess
import uuid


def seed(db, church, count, today):
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    def uid(label):
        return str(uuid.uuid5(uuid.NAMESPACE_URL, f"navis/mobile-tables-qa/{church}/{label}"))
    def insert(table, **fields):
        columns = ','.join(fields)
        db.execute(f"INSERT OR IGNORE INTO {table} ({columns}) VALUES ({','.join('?' for _ in fields)})", tuple(fields.values()))
    specs = [
        ('text', 'Nombre'), ('long_text', 'Observaciones'), ('number', 'Cantidad'),
        ('currency', 'Importe'), ('checkbox', 'Revisado'), ('date', 'Fecha'),
        ('single_select', 'Estado'), ('multi_select', 'Etiquetas'), ('email', 'Correo'),
        ('phone', 'Teléfono'), ('url', 'Enlace'), ('password', 'Clave'),
    ]
    result = []
    for stress, rows in [(False, 86), (True, count)]:
        prefix = 'stress' if stress else 'types'
        table = uid(prefix)
        insert('custom_tables', id=table, created_at=now, updated_at=now, church_id=church,
               name='QA · 30 columnas' if stress else 'QA · 12 tipos', slug=table,
               icon='archive' if stress else 'clipboard', accent='#0d9488' if stress else 'primary', position=100 if stress else 99)
        options = [dict(value=f's{i}', label=f'Estado {i + 1}', color=['primary', '#0d9488', '#e11d48'][i % 3]) for i in range(50 if stress else 3)]
        columns = specs + ([('text', f'Columna {i + 13}') for i in range(18)] if stress else [])
        for i, (kind, label) in enumerate(columns):
            key = f'qa_{kind}' if i < 12 else f'qa_extra_{i - 12}'
            config = {'currency': 'EUR', 'decimals': 2} if kind == 'currency' else {'includeTime': True} if kind == 'date' else None
            insert('custom_table_columns', id=uid(f'{prefix}/column/{i}'), created_at=now, updated_at=now,
                   table_id=table, key=key, label=label, type=kind, position=i,
                   required=int(i == 0), options=json.dumps(options) if 'select' in kind else None,
                   config=json.dumps(config) if config else None)
            saved = db.execute('SELECT options FROM custom_table_columns WHERE id=?', (uid(f'{prefix}/column/{i}'),)).fetchone()[0]
            if saved:
                saved_options = json.loads(saved)
                if any(option.get('color') in ('teal', 'rose') for option in saved_options):
                    for option in saved_options:
                        option['color'] = {'teal': '#0d9488', 'rose': '#e11d48'}.get(option.get('color'), option.get('color'))
                    db.execute('UPDATE custom_table_columns SET options=? WHERE id=?', (json.dumps(saved_options), uid(f'{prefix}/column/{i}')))
        for i in range(rows):
            date = (today.replace(day=1) + dt.timedelta(days=i % 28)).isoformat() + 'T12:00:00.000Z'
            data = dict(qa_text=f'Material QA {i + 1:04}', qa_long_text='Texto de prueba largo. Acentos: áéíóú. Segunda línea\npara comprobar alturas.',
                        qa_number=i - 4.5, qa_currency=round(i * 10.25, 2), qa_checkbox=i % 2 == 0,
                        qa_date=date if i < 500 and i % 10 != 9 else None,
                        qa_single_select=f's{i % 3}' if i % 10 != 9 else None,
                        qa_multi_select=['s0', 's1'], qa_email='qa@example.com', qa_phone='+34 600 000 000', qa_url='https://example.com')
            if stress:
                data.update({f'qa_extra_{j}': f'Dato {j + 1} · fila {i + 1}' for j in range(18)})
            insert('custom_table_rows', id=uid(f'{prefix}/row/{i}'), created_at=now, updated_at=now, table_id=table, data=json.dumps(data, ensure_ascii=False))
        for i, (kind, name) in enumerate([('kanban', 'Por estado'), ('kanban', 'Otro tablero'), ('calendar', 'Agenda'), ('calendar', 'Otra agenda')]):
            insert('custom_table_views', id=uid(f'{prefix}/view/{i}'), created_at=now, updated_at=now,
                   table_id=table, name=name, type=kind, group_by='qa_single_select' if kind == 'kanban' else None,
                   date_column='qa_date' if kind == 'calendar' else None, filters='[]', position=i)
        result.append(dict(id=table, rows=rows, columns=len(columns), options=len(options)))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--serial', default='emulator-5556')
    parser.add_argument('--church-id')
    parser.add_argument('--rows', type=int, default=2000)
    args = parser.parse_args()
    if not 1 <= args.rows <= 10000:
        parser.error('--rows must be between 1 and 10000')
    def adb(*parts):
        return subprocess.run(['rtk', 'proxy', 'adb', '-s', args.serial, *parts], check=True, capture_output=True).stdout
    if adb('emu', 'avd', 'name').decode().splitlines()[0].strip() != 'navis_tables_qa':
        parser.error('Only the isolated navis_tables_qa emulator is allowed')
    adb('shell', 'am', 'force-stop', 'org.navis.app')
    stamp = dt.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    backup = Path('.tools') / f'tables-seed-{stamp}'
    backup.mkdir(parents=True)
    files = adb('shell', 'run-as', 'org.navis.app', 'ls', 'files/SQLite').decode().splitlines()
    for name in ['navis.db', 'navis.db-wal', 'navis.db-shm']:
        if name in files:
            (backup / name).write_bytes(adb('exec-out', 'run-as', 'org.navis.app', 'cat', f'files/SQLite/{name}'))
    source = sqlite3.connect(backup / 'navis.db')
    target_path = backup / 'seeded.db'
    db = sqlite3.connect(target_path)
    source.backup(db)
    source.close()
    churches = db.execute('SELECT id FROM churches WHERE deleted_at IS NULL').fetchall()
    church = args.church_id
    if church is None:
        fixture = db.execute('SELECT church_id FROM custom_tables WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1').fetchone()
        if fixture:
            church = fixture[0]
        elif len(churches) == 1:
            church = churches[0][0]
        else:
            parser.error('Specify --church-id when there are multiple churches without tables')
    if (church,) not in churches:
        parser.error('Church does not exist')
    with db:
        result = seed(db, church, args.rows, dt.date.today())
    assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
    db.execute('PRAGMA wal_checkpoint(TRUNCATE)')
    db.execute('PRAGMA journal_mode=DELETE')
    db.close()
    remote = f'/data/local/tmp/navis-tables-seed-{stamp}.db'
    adb('push', str(target_path), remote)
    # Keep the entire previous database on-device too, including any WAL.
    moved = []
    try:
        for name in ['navis.db', 'navis.db-wal', 'navis.db-shm']:
            if name in files:
                adb('shell', 'run-as', 'org.navis.app', 'mv', f'files/SQLite/{name}', f'files/SQLite/{name}.before-seed-{stamp}')
                moved.append(name)
        adb('shell', 'run-as', 'org.navis.app', 'cp', remote, 'files/SQLite/navis.db')
    except subprocess.CalledProcessError:
        for name in moved:
            adb('shell', 'run-as', 'org.navis.app', 'mv', f'files/SQLite/{name}.before-seed-{stamp}', f'files/SQLite/{name}')
        raise
    adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'navis:///tables', 'org.navis.app')
    print(json.dumps(dict(backup=str(backup), tables=result), ensure_ascii=False))


if __name__ == '__main__':
    main()
