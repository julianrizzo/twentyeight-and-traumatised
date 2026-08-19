# Twentyeight and Traumatised

Static full-screen site with three sequential videos:

1. Tap to begin (unlocks audio), then **video 1** loops.
2. Tap the screen **three times** at any point during video 1 to start **video 2** (plays once).
3. When video 2 ends, **video 3** takes over and loops forever.

Transitions use two stacked `<video>` layers so the previous last frame stays visible until the next clip is actually playing — no black flash between videos.

## Run locally

Serve over HTTP (opening `index.html` via `file://` often breaks video/audio):

```bash
cd ~/Developer/twentyeight-and-traumatised
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

Or:

```bash
npx serve .
```

## Replace the placeholder videos

Drop your final files here, keeping these names:

- `videos/video1.mp4`
- `videos/video2.mp4`
- `videos/video3.mp4`

Use MP4 (H.264 + AAC) for the widest browser support. Prefer similar resolution/aspect ratio across all three for the cleanest handoffs.

Current placeholders are short SampleLib clips for development only.
