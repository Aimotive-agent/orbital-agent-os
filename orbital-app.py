#!/usr/bin/env python3
"""Orbital Agent OS — standalone desktop window (WebKitGTK).

Launches the local Node server if it isn't running, then opens the
dashboard in its own window instead of a browser.
"""
import os
import socket
import subprocess
import sys
import time
import urllib.request

APP_URL = 'http://localhost:5173/'
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
ICON_PATH = os.path.join(PROJECT_DIR, 'assets', 'orbital-icon.svg')
LOG_PATH = os.path.join(PROJECT_DIR, 'orbital-server.log')

# Local agent web UIs the dashboard proxies under /app/<name>/.
# Each is started on demand if its port isn't already listening.
AGENTS = [
    {'name': 'hermes', 'port': 9119,
     'cmd': ['/home/chrispc/.local/bin/hermes', 'dashboard', '--port', '9119', '--host', '127.0.0.1', '--no-open'],
     'cwd': '/home/chrispc/.hermes/hermes-agent'},
    {'name': 'opencode', 'port': 36783,
     'cmd': ['/home/chrispc/.local/bin/opencode', 'serve', '--port', '36783', '--hostname', '127.0.0.1'],
     'cwd': '/home/chrispc'},
    {'name': 'unsloth', 'port': 8888,
     'cmd': ['/home/chrispc/.local/bin/unsloth', 'studio', '--port', '8888', '--host', '127.0.0.1'],
     'cwd': '/home/chrispc'},
]


def server_up():
    try:
        with urllib.request.urlopen(APP_URL, timeout=1.5) as resp:
            return resp.status == 200
    except Exception:
        return False


def ensure_server():
    """Start the local Node server if it isn't already running."""
    if server_up():
        return
    with open(LOG_PATH, 'a') as log:
        log.write('\n=== orbital-app.py started server (%s) ===\n' % time.ctime())
        subprocess.Popen(
            ['node', 'server.cjs'],
            cwd=PROJECT_DIR,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
    for _ in range(50):
        if server_up():
            return
        time.sleep(0.2)


def port_open(port):
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=0.5):
            return True
    except OSError:
        return False


def ensure_agents():
    """Start the local agent web UIs (Hermes, OpenCode, Unsloth) if needed."""
    for agent in AGENTS:
        if port_open(agent['port']):
            continue
        with open(LOG_PATH, 'a') as log:
            log.write('=== orbital-app.py starting %s (%s) ===\n' % (agent['name'], time.ctime()))
            subprocess.Popen(
                agent['cmd'],
                cwd=agent['cwd'],
                stdout=log,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )


def main():
    ensure_server()
    ensure_agents()

    import gi
    gi.require_version('Gtk', '3.0')
    gi.require_version('WebKit2', '4.1')
    from gi.repository import Gtk, WebKit2, Gdk

    # Software compositing: avoids white-screen/EGL issues on some GPU/driver combos.
    os.environ.setdefault('WEBKIT_DISABLE_COMPOSITING_MODE', '1')

    win = Gtk.Window(title='Orbital Agent OS')
    win.set_wmclass('orbital', 'Orbital Agent OS')
    win.set_default_size(1460, 940)
    if os.path.exists(ICON_PATH):
        win.set_icon_from_file(ICON_PATH)
    win.connect('destroy', Gtk.main_quit)

    # Persistent storage so the login token survives between launches.
    data_dir = os.path.join(PROJECT_DIR, '.webdata')
    os.makedirs(data_dir, exist_ok=True)
    dm = WebKit2.WebsiteDataManager(base_data_directory=data_dir)
    ctx = WebKit2.WebContext.new_with_website_data_manager(dm)
    web = WebKit2.WebView.new_with_context(ctx)
    web.set_vexpand(True)
    web.set_hexpand(True)

    def on_create(view, action):
        # Open popup windows in the system browser instead.
        if action is not None:
            request = action.get_request()
            if request is not None:
                Gtk.show_uri_on_window(win, request.get_uri(), Gdk.CURRENT_TIME)
        return None

    web.connect('create', on_create)
    web.load_uri(APP_URL)
    win.add(web)
    win.show_all()
    Gtk.main()


if __name__ == '__main__':
    main()
