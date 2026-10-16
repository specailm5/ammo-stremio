"""Dev server for this site, with browser caching switched off.

`python -m http.server` lets the browser cache app.js heuristically, so an edited file
can keep running for several minutes and make a fixed bug look unfixed. This serves the
repository root the same way, but tells the browser never to store anything.

    python tools/serve.py
    python tools/serve.py --port 8770
"""

import argparse
import functools
import http.server
import pathlib


class NoStoreHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--directory", default=".")
    args = parser.parse_args()

    root = pathlib.Path(args.directory).resolve()
    handler = functools.partial(NoStoreHandler, directory=str(root))

    with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler) as httpd:
        base = f"http://localhost:{args.port}"
        print(f"serving {root} with no-store")
        print(f"  site:      {base}/web/")
        print(f"  viewports: {base}/tools/viewports.html")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
