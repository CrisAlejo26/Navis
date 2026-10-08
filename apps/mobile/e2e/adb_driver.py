"""UI-only Android driver. Does not seed or alter the application's database."""
import re
import subprocess
import time
import xml.etree.ElementTree as ET
from pathlib import Path

def adb(*args):
    result = subprocess.run(['adb', *map(str, args)], capture_output=True, check=True, timeout=30)
    return result.stdout.decode('utf-8', errors='replace')

def nodes():
    adb('shell', 'uiautomator', 'dump', '/sdcard/navis-qa.xml')
    xml = adb('shell', 'cat', '/sdcard/navis-qa.xml')
    return list(ET.fromstring(xml[xml.index('<?xml'):]).iter('node'))

def find(label):
    candidates = nodes()
    candidates.sort(key=lambda node: (node.get('resource-id') != label,
        node.get('content-desc') != label, node.get('clickable') != 'true'))
    for node in candidates:
        if label in (node.get('resource-id'), node.get('content-desc'), node.get('text')):
            coords = list(map(int, re.findall(r'\d+', node.get('bounds', ''))))
            if len(coords) == 4 and coords[2] > coords[0] and coords[3] > coords[1]:
                return coords
    return None

def wait(label, timeout=30):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        bounds = find(label)
        if bounds:
            return bounds
        time.sleep(0.5)
    raise AssertionError('Not visible: ' + label)

def tap(label, scroll=False):
    for attempt in range(8 if scroll else 1):
        bounds = find(label)
        if bounds:
            adb('shell', 'input', 'tap', (bounds[0]+bounds[2])//2, (bounds[1]+bounds[3])//2)
            return
        swipe()
    raise AssertionError('Cannot tap: ' + label)

def swipe(up=True):
    size = adb('shell', 'wm', 'size')
    width, height = map(int, re.findall(r'(\d+)x(\d+)', size)[-1])
    footer = find('journal-save')
    bottom = min(int(height*0.7), footer[1]-80) if footer else int(height*0.7)
    top = min(int(height*0.4), bottom-300)
    adb('shell', 'input', 'swipe', width//2, bottom if up else top,
        width//2, top if up else bottom, 350)
    time.sleep(0.5)

def text(label, value, replace=False):
    tap(label, scroll=True)
    if replace:
        adb('shell', 'input', 'keycombination', 113, 29)
    adb('shell', 'input', 'text', value.replace(' ', '%s'))

def screenshot(path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    adb('shell', 'screencap', '-p', '/sdcard/navis-qa.png')
    adb('pull', '/sdcard/navis-qa.png', str(path))

def open_route(route):
    adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'navis://' + route)
    time.sleep(1)
