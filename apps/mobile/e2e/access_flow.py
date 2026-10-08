"""Run against a QA build, signed in as a church pastor who owns the church.

UI only: creates a throw-away read-only access, opens it, edits it, regenerates
its password and revokes it. Never touches SQLite directly.
"""
import argparse
import time
from pathlib import Path
from adb_driver import adb, find, open_route, reveal, screenshot, tap, text, wait

parser = argparse.ArgumentParser()
parser.add_argument('--locale', choices=['es', 'en'], default='es')
args = parser.parse_args()
labels = {
    'es': {'tab': 'Accesos', 'group': 'De un grupo', 'once': 'Cópiala ahora: no vas a volver a verla.', 'close': 'Cerrar'},
    'en': {'tab': 'Access', 'group': 'For a group', 'once': 'Copy it now: you will not see it again.', 'close': 'Close'},
}[args.locale]
out = Path('docs/qa/usuarios-movil') / ('accesos-' + args.locale)
stamp = str(int(time.time()))
name = 'QA Acceso ' + stamp
card = 'access-card-qa.acceso.' + stamp


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
        if any(find(one) for one in ('viewer-create', 'access-save', 'access-lists-done',
                                     'access-revoke-confirm', 'access-credentials-done')):
            adb('shell', 'input', 'keyevent', 4)
            time.sleep(0.7)


reset_state()
open_route('users')
wait(labels['tab'])  # el selector de pestañas está siempre; el contenido de cada una, no
tap(labels['tab'])
wait('access-add')
capture('directorio')

# Alta de un acceso de grupo
tap('access-add')
wait('viewer-label')
tap(labels['group'])
text('viewer-label', name)
hide_keyboard()
capture('alta')
tap('viewer-create', scroll=True)
wait(labels['once'])
capture('contrasena-alta')
tap('viewer-done')

# Se filtra por la marca de tiempo para localizarlo entre los demás
wait('access-add')
reveal('access-search')
text('access-search', stamp, replace=True)
hide_keyboard()
wait(card)
capture('directorio-con-acceso')

# Ficha y edición
tap(card)
wait('access-edit')
capture('ficha')
tap('access-edit')
wait('access-label')
text('access-label', name + ' B', replace=True)
hide_keyboard()
tap('access-save')
wait(name + ' B')

# Contraseña nueva
tap('access-password', scroll=True)
wait('access-credentials-done')
capture('contrasena-nueva')
tap('access-credentials-done')

# Revocar
tap('access-revoke', scroll=True)
wait('access-revoke-confirm')
capture('revocar')
tap('access-revoke-confirm')
wait('access-add')
time.sleep(1)
assert find(card) is None, 'Revoked access is still listed'
capture('directorio-final')
print('Native access flow passed: ' + args.locale)
