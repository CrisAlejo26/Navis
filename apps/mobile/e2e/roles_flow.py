"""Read-only roles check. Works with any church pastor (no `roles.manage` needed).

UI only: opens the Roles tab, searches, opens a role and checks that a pastor
gets no edit/delete actions. Never touches SQLite directly.
"""
import argparse
import time
from pathlib import Path
from adb_driver import adb, find, open_route, screenshot, tap, text, wait

parser = argparse.ArgumentParser()
parser.add_argument('--locale', choices=['es', 'en'], default='es')
args = parser.parse_args()
labels = {
    'es': {'tab': 'Roles', 'search': 'Sonido', 'permissions': 'Permisos'},
    'en': {'tab': 'Roles', 'search': 'Sound', 'permissions': 'Permissions'},
}[args.locale]
out = Path('docs/qa/usuarios-movil') / ('roles-' + args.locale)


def capture(label):
    screenshot(out / (label + '.png'))


def hide_keyboard():
    if 'mInputShown=true' in adb('shell', 'dumpsys', 'input_method'):
        adb('shell', 'input', 'keyevent', 4)
        time.sleep(0.5)


open_route('users')
wait('users-add')
tap(labels['tab'])
wait('role-card-pastor')
capture('lista')
assert find('roles-add') is None, 'A pastor must not see the create-role button'

text('roles-search', labels['search'])
hide_keyboard()
wait('role-card-sonido')
time.sleep(1)
assert find('role-card-pastor') is None, 'The search did not filter the roles'
capture('busqueda')

tap('role-card-sonido')
wait(labels['permissions'])
capture('ficha')
assert find('role-edit') is None, 'A pastor must not see the edit action'
assert find('role-delete') is None, 'A pastor must not see the delete action'
adb('shell', 'input', 'keyevent', 4)
wait('roles-search')
print('Native roles read-only flow passed: ' + args.locale)
