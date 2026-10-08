"""Run against a QA native build, signed in as a church pastor (Spanish/English).

UI only: creates a throw-away account, opens it, edits it, changes its password
and deletes it. Never touches SQLite directly.
"""
import argparse
import time
from pathlib import Path
from adb_driver import adb, find, open_route, screenshot, tap, text, wait

parser = argparse.ArgumentParser()
parser.add_argument('--locale', choices=['es', 'en'], default='es')
args = parser.parse_args()
labels = {
    'es': {'role_placeholder': 'Elige un rol', 'role': 'Recepción', 'password_done': 'Contraseña cambiada'},
    'en': {'role_placeholder': 'Choose a role', 'role': 'Reception', 'password_done': 'Password changed'},
}[args.locale]
out = Path('docs/qa/usuarios-movil') / ('flujo-' + args.locale)
stamp = str(int(time.time()))
name = 'QA Usuario ' + stamp
email = 'qa' + stamp + '@navis.app'
card = 'user-card-' + email


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
        if find('user-save') or find('password-save') or find('delete-user-confirm'):
            adb('shell', 'input', 'keyevent', 4)
            time.sleep(0.7)


reset_state()
open_route('users')
wait('users-add')
capture('directorio')

# Alta
tap('users-add')
wait('user-name')
text('user-name', name)
text('user-email', email)
hide_keyboard()
tap(labels['role_placeholder'], scroll=True)
wait(labels['role'])
tap(labels['role'])
text('user-password-input', 'MuySegura123')
capture('alta')
hide_keyboard()
tap('user-save', scroll=True)
wait('users-add')
# La lista va por nombre y hay más cuentas: se filtra por la marca de tiempo para localizarla.
text('users-search', stamp)
hide_keyboard()
wait(card)
capture('directorio-con-cuenta')

# Ficha y edición
tap(card)
wait('user-edit')
capture('ficha')
tap('user-edit')
wait('user-name')
text('user-name', name + ' B', replace=True)
hide_keyboard()
tap('user-save', scroll=True)
wait(name + ' B')

# Contraseña
tap('user-password', scroll=True)
wait('password-input')
text('password-input', 'OtraClave456')
hide_keyboard()
tap('password-save')
wait(labels['password_done'])
capture('contrasena')
tap('password-save')

# Baja
tap('user-delete', scroll=True)
wait('delete-user-confirm')
capture('baja')
tap('delete-user-confirm')
wait('users-add')
time.sleep(1)
assert find(card) is None, 'Deleted account is still listed'
capture('directorio-final')
print('Native users flow passed: ' + args.locale)
