# StreamGaze Project Page

This is the official project page for "StreamGaze: Gaze-Guided Temporal Reasoning and Proactive Understanding in Streaming Videos".

## 📂 Directory Structure

```
streamgaze.github.io/
├── index.html            # Main project page
├── img/                  # Paper figures and icon
└── static/
    ├── css/style.css     # Page styles (light/dark themes)
    └── js/main.js        # Interactions: gaze scanpath hero, task explorer,
                          # pipeline stepper, benchmark filter, results chart & leaderboard
```

Benchmark and results numbers shown in the interactive table/chart live in `static/js/main.js` (`MODELS`, `HUMAN`, `BENCH`).

## 🚀 Deployment

### GitHub Pages
1. Push this repository to GitHub
2. Go to Settings → Pages
3. Select "Deploy from a branch" and choose `main` branch
4. Your site will be available at `https://streamgaze.github.io/`

### Local Preview
Simply open `index.html` in a web browser or use a local server:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`

## 📄 License

This website template is based on the [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template).

