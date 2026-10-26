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

## Confirmed depth revision (2026-10-26)

The linked depth image and compiled displacement values come from the same confirmed atlas. The field reader, dense scene extractor and exact tuple deduplicator are unchanged. Before this revision, an old-atlas control regenerated the previous fields and reproduced the complete previous gzip and scene JSON bytes, including gzip headers. This establishes the re-bake chain; the new depth intentionally changes turned poses.

SHA-256 provenance:

| Input or output | SHA-256 |
| --- | --- |
| Confirmed `depth.jpg` | `c814960c7e40dd1d5573a5e6d6e5d97eefeb309d015dea924359dc87f8e998a0` |
| Regenerated depth fields | `27e1ad3bf4f0a9b5ac983e786eda04fd33c33d5b168befac31f989c488e28af9` |
| Frozen field reader | `450b69019ee9cef8a92e53bb8d4ba94027418a60bd4d251fb5db2bd49ee5324e` |
| Frozen scene extractor | `55f81d766f1c71a663faa166464091678523321dd6dc83a2eaff3ce7f7b3cfbf` |
| Frozen tuple deduplicator | `e3f7f116b29932bfd1d9cfb429f505849a77b70f312e7bd22d073e21a9f417fb` |
| Decoded geometry payload | `0106351273baf144f276895e986c1f6e95c013bf3de64071d8561d0c678f3e19` |
| `scene.bin.gz` | `4e52da5a46e86e200ca82a4ff5a1befbe1d5daa62ddd442f6aa3038e3a0b3e80` |
| `scene.json` | `51a5bfdf5c2687871b9290fd2dcec9004b892c165e1ab098f1d008aa78b89f2a` |

The gzip recipe is `gzip.compress(raw, compresslevel=9, mtime=0)`, reproduced with Python 3.13.1 and zlib 1.2.12 (compile and runtime). This is a reproduced invocation, not a recovered historical command log. The scene finalization changes only its `buffer` name from `scene.bin` to `scene.bin.gz`; gzip headers are not patched. The decoded payload is 6,294,257 bytes; its raw gzip file is 3,405,993 bytes.

All 19 parts retain their ordered triangle-expanded Float64 base positions and UVs, 224,144 ordered triangles, common/iris drivers, eye masks and core data, bounds, basis and gain. Exact depth-dependent tuple deduplication increases the stored vertex count from 132,534 to 132,540. Packed indices and offsets may consequently differ. The renderer, gaze controller, colour atlas, original entry and runtime licence notices retain their previous bytes.
