"""Creates, edits and deletes a throw-away role. Needs a SUPERADMIN session.

Only the superadmin holds `roles.manage`; with any other role the create-role
button does not exist and the script stops at the first wait. UI only: never
touches SQLite directly.
"""
import argparse
import time
from pathlib import Path
from adb_driver import adb, find, open_route, reveal, screenshot, tap, text, wait

parser = argparse.ArgumentParser()
parser.add_argument('--locale', choices=['es', 'en'], default='es')
args = parser.parse_args()
labels = {'es': {'tab': 'Roles', 'view': 'Ver'}, 'en': {'tab': 'Roles', 'view': 'View'}}[args.locale]
out = Path('docs/qa/usuarios-movil') / ('gestion-roles-' + args.locale)
stamp = str(int(time.time()))
name = 'QA Rol ' + stamp
card = 'role-card-qa-rol-' + stamp


def capture(label):
    screenshot(out / (label + '.png'))


def hide_keyboard():
    if 'mInputShown=true' in adb('shell', 'dumpsys', 'input_method'):
        adb('shell', 'input', 'keyevent', 4)
        time.sleep(0.5)


def reset_state():
    """Cierra lo que haya quedado abierto de una ejecución interrumpida."""
    hide_keyboard()
    for _ in range(3):
        if find('role-save') or find('role-delete-confirm'):
            adb('shell', 'input', 'keyevent', 4)
            time.sleep(0.7)


reset_state()
open_route('users')
wait(labels['tab'])
tap(labels['tab'])
wait('roles-add')

# Alta, con el primer permiso de la lista marcado
tap('roles-add')
wait('role-name')
text('role-name', name)
hide_keyboard()
tap(labels['view'], scroll=True)
capture('alta')
tap('role-save', scroll=True)
wait('roles-add')
# Se ordena por alcance y hay más roles: se filtra por la marca de tiempo para localizarlo.
reveal('roles-search')
text('roles-search', stamp, replace=True)
hide_keyboard()
wait(card)
capture('lista-con-rol')

# Ficha y edición
tap(card)
wait('role-edit')
wait('summary-dashboard')
capture('ficha')
tap('role-edit')
wait('role-name')
text('role-name', name + ' B', replace=True)
hide_keyboard()
tap('role-save')
wait(name + ' B')

# Baja
tap('role-delete', scroll=True)
wait('role-delete-confirm')
capture('baja')
tap('role-delete-confirm')
wait('roles-add')
time.sleep(1)
assert find(card) is None, 'Deleted role is still listed'
capture('lista-final')
print('Native roles management flow passed: ' + args.locale)
