# Depth-driven head turn

A static preview of an upcoming `@rig-c/parts` feature. The producer is in progress.

Copy this directory unchanged to a static site, including a nested path. Serve it over HTTP; for a local preview run `python3 -m http.server 5192` from this directory. Resources use relative URLs and need no CDN or service. A current WebGL browser with the built-in gzip DecompressionStream API is required.

The four controls retain the accepted demo behaviour: gain; pivot depth (default55, range0–100); gaze range; and rear-hair counter-motion (default10%). At zero rear counter, local depth motion remains active. Move the pointer across the canvas or use Centre.

Files:

- `look.png`: the approved colour atlas.
- `depth.jpg`: the approved depth atlas, available through the page's Depth atlas link.
- `scene.json` / `scene.bin.gz`: compiled neutral dense geometry, UVs, draw order, depth displacement values and the small eye-aperture/core-mask data needed by this demo. Movement uses these compiled depth samples; it does not decode the depth JPEG on every frame.
- `app.js`, `aperture.js`, `runtime.js`: the page, bounded gaze controller and bundled Pixi runtime/renderer.
- `THIRD_PARTY_LICENSES.txt`: bundled runtime copyright and licence notices.

The gzip payload is explicitly decoded by the page, so static hosting does not need automatic compression. Serve JavaScript as text/javascript, JSON as application/json, PNG/JPEG as images, and scene.bin.gz as application/gzip (or application/octet-stream). An absent Content-Encoding header is supported; a correctly auto-decoded response is also supported. Never label raw bytes with a compression header.

The compiled data is a rendering payload, not an editable skeleton or producer configuration. The runtime notices do not relicense the demo artwork.
