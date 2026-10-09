"""Read-only roles check. Works with any church pastor (no `roles.manage` needed).

UI only: opens the Roles tab, searches, opens a role and checks that a pastor
gets no edit/delete actions. Never touches SQLite directly.
"""
import argparse
import time
from pathlib import Path
from adb_driver import adb, find, open_route, reveal, screenshot, tap, text, wait

parser = argparse.ArgumentParser()
parser.add_argument('--locale', choices=['es', 'en', 'de', 'fr', 'it', 'pt'], default='es')
args = parser.parse_args()
labels = {
    'es': {'tab': 'Roles', 'search': 'Sonido', 'permissions': 'Permisos', 'clear': 'Borrar la búsqueda'},
    'de': {'tab': 'Rollen', 'search': 'Ton', 'permissions': 'Berechtigungen', 'clear': 'Suche löschen'},
    'fr': {'tab': 'Rôles', 'search': 'Son', 'permissions': 'Permissions', 'clear': 'Effacer la recherche'},
    'it': {'tab': 'Ruoli', 'search': 'Audio', 'permissions': 'Permessi', 'clear': 'Cancella la ricerca'},
    'pt': {'tab': 'Funções', 'search': 'Som', 'permissions': 'Permissões', 'clear': 'Limpar a pesquisa'},
    'en': {'tab': 'Roles', 'search': 'Sound', 'permissions': 'Permissions', 'clear': 'Clear the search'},
}[args.locale]
out = Path('docs/qa/usuarios-movil') / ('roles-' + args.locale)


def capture(label):
    screenshot(out / (label + '.png'))


def hide_keyboard():
    if 'mInputShown=true' in adb('shell', 'dumpsys', 'input_method'):
        adb('shell', 'input', 'keyevent', 4)
        time.sleep(0.5)


open_route('users')
wait(labels['tab'])
tap(labels['tab'])
reveal('roles-search')
assert find('roles-add') is None, 'A pastor must not see the create-role button'

# La búsqueda se conserva entre visitas: se fija una y se borra después, sin suponer la inicial
text('roles-search', labels['search'], replace=True)
hide_keyboard()
wait('role-card-sonido')
time.sleep(1)
assert find('role-card-pastor') is None, 'The search did not filter the roles'
capture('busqueda')
tap(labels['clear'])
wait('role-card-pastor')
capture('lista')

tap('role-card-sonido', scroll=True)
wait(labels['permissions'])
capture('ficha')
assert find('role-edit') is None, 'A pastor must not see the edit action'
assert find('role-delete') is None, 'A pastor must not see the delete action'
adb('shell', 'input', 'keyevent', 4)
reveal('roles-search')
print('Native roles read-only flow passed: ' + args.locale)
