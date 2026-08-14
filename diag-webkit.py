#!/usr/bin/env python3
"""Iconified WebKitGTK probe — verifies a URL renders (not a blank white page)
using the SAME engine as the orbital desktop app. Ephemeral context = no cache.
"""
import gi, sys, json
gi.require_version('WebKit2', '4.1')
gi.require_version('Gtk', '3.0')
from gi.repository import WebKit2, Gtk, GLib

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173/app/hermes/'
BASE = sys.argv[2] if len(sys.argv) > 2 else '/app/hermes/'

ctx = WebKit2.WebContext.new_ephemeral()
view = WebKit2.WebView.new_with_context(ctx)
view.set_settings(WebKit2.Settings.new())
win = Gtk.Window()
win.set_default_size(1280, 900)
win.add(view)
win.iconify()  # keep off-screen so we don't disturb the user
win.show_all()

PROBE = """
(function(){
  var BASE = "%s";
  var leaks = [];
  try {
    performance.getEntriesByType('resource').forEach(function(e){
      var n = e.name || '';
      if (n.indexOf('localhost') > -1 || n.indexOf('192.168') > -1) {
        var m = n.replace(/^https?:\\/\\/[^\\/]+/, '');
        if (m.charAt(0) === '/' && m.indexOf(BASE) !== 0 && m !== '/') leaks.push(m);
      }
    });
  } catch (e) { leaks.push('ERR:' + e.message); }
  return JSON.stringify({
    title: document.title,
    bodyLen: (document.body ? document.body.innerText.length : -1),
    htmlLen: document.documentElement.outerHTML.length,
    bodyHTML: (document.body ? document.body.innerHTML.slice(0, 900) : ''),
    leaks: leaks.slice(0, 15),
    all: performance.getEntriesByType('resource').map(function(e){return e.name;}).slice(0, 30),
    readyState: document.readyState
  });
})()
""" % BASE

def on_load(view, ev):
    if ev != WebKit2.LoadEvent.FINISHED:
        return
    GLib.timeout_add(9000, probe)

def probe():
    def done(view, task):
        try:
            r = view.run_javascript_finish(task)
            v = r.get_js_value().to_string()
            d = json.loads(v)
            print(json.dumps(d, indent=2))
            ok = (d['bodyLen'] > 50 or d['htmlLen'] > 2000) and not d['leaks']
            print('VERDICT:', 'OK' if ok else 'BLANK/LEAKY')
        except Exception as e:
            print('PROBE_ERROR:', e)
        finally:
            Gtk.main_quit()
    view.run_javascript(PROBE, None, done)
    return False

view.connect('load-changed', on_load)
view.load_uri(URL)
GLib.timeout_add_seconds(30, lambda: (print('TIMEOUT'), Gtk.main_quit()))
Gtk.main()
