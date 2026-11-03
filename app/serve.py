"""Dependency-free, loopback-only static server. No outbound connections."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import webbrowser

ROOT = Path(__file__).resolve().parent
CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"


class LocalHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404, "Directory listing is disabled")
        return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8767)
    parser.add_argument("--open", action="store_true", dest="open_browser")
    args = parser.parse_args()
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(LocalHandler, directory=str(ROOT)))
    except OSError as exc:
        raise SystemExit(f"Could not open localhost:{args.port}: {exc}. Choose a different --port.") from exc
    url = f"http://127.0.0.1:{server.server_port}/"
    print(f"Handoff Auditor is running at {url}", flush=True)
    print("Offline simulation and recorded Meta replay. Localhost only. Press Ctrl+C to stop.", flush=True)
    if args.open_browser:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
