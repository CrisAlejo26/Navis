"""Run against a QA native build, signed in as a church owner (Spanish/German)."""
import argparse
import re
import time
from datetime import date, timedelta
from pathlib import Path
from adb_driver import adb, find, nodes, open_route, screenshot, swipe, tap, text, wait

parser = argparse.ArgumentParser()
parser.add_argument('--locale', choices=['es', 'de'], default='es')
args = parser.parse_args()
labels = {
 'es': {'edit':'Editar entrada', 'reminder':'Recordatorio', 'when':'Cuándo',
        'done':'Atendido', 'share':'Compartir imagen', 'delete':'Eliminar'},
 'de': {'edit':'Eintrag bearbeiten', 'reminder':'Erinnerung', 'when':'Wann',
        'done':'Erledigt', 'share':'Bild teilen', 'delete':'Löschen'},
}[args.locale]
out = Path('docs/qa/cuaderno-movil') / ('flujo-' + args.locale)
title = 'QA Cuaderno ' + str(int(time.time()))

def capture(name):
    screenshot(out / (name + '.png'))

def enable_reminder():
    tap(labels['reminder'], scroll=True)
    for _ in range(5):
        for node in nodes():
            if node.get('checkable') == 'true' and node.get('content-desc') == labels['reminder']:
                b = list(map(int, re.findall(r'\d+', node.get('bounds'))))
                if len(b) != 4 or b[2] <= b[0] or b[3] <= b[1]:
                    continue
                adb('shell', 'input', 'tap', (b[0]+b[2])//2, (b[1]+b[3])//2)
                time.sleep(0.5)
                return
        swipe()
    raise AssertionError('Reminder switch missing')

open_route('journal/list')
wait('journal-add')
tap('journal-add')
wait('journal-title')
text('journal-title', title)
text('journal-annotation', 'Conversacion completa de QA')
capture('editor-teclado')
enable_reminder()
tap(labels['when'], scroll=True)
tomorrow = (date.fromisoformat(adb('shell','date','+%F').strip()) + timedelta(days=1)).isoformat()
wait(tomorrow)
tap(tomorrow)
tap('journal-save')
wait(title)
tap(title)
wait('journal-edit')
capture('detalle')
tap('journal-edit')
text('journal-title', title + ' editada', replace=True)
tap('journal-save')
wait('journal-edit')
tap('journal-attend', scroll=True)
wait(labels['done'])
capture('atendido')
tap(labels['share'], scroll=True)
wait('Sharing image')
capture('imagen-compartir')
adb('shell', 'input', 'keyevent', 4)
tap('journal-delete', scroll=True)
tap(labels['delete'])
wait('journal-add')
text('journal-search', title)
time.sleep(1)
assert find(title + ' editada') is None, 'Deleted entry is still visible'
capture('borrado')
print('Native journal flow passed: ' + args.locale)
