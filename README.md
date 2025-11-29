# StreamGaze Project Page

This is the official project page for "StreamGaze: Gaze-Guided Temporal Reasoning and Proactive Understanding in Streaming Videos".

## 📂 Directory Structure

```
streamgaze.github.io/
├── index.html          # Main project page
├── README.md           # This file
└── static/
    ├── css/            # Stylesheets
    ├── js/             # JavaScript files
    ├── images/         # Image assets
    │   ├── icon.png        # Favicon/thumbnail
    │   ├── teaser.png      # Main teaser figure (Figure 1)
    │   ├── method.png      # Data construction pipeline figure
    │   ├── results.png     # Main results table/figure
    │   └── qualitative.png # Qualitative examples
    └── videos/         # Video assets (optional)
```

## 🖼️ Required Images

Please add the following images to `static/images/`:

1. **icon.png** - Website icon/thumbnail (recommended: 1200x630px for social media)
2. **teaser.png** - Main teaser figure showing the task taxonomy
3. **method.png** - Data construction pipeline figure
4. **results.png** - Main quantitative results table/figure
5. **qualitative.png** - Qualitative examples showing reasoning comparisons

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

## 📝 Customization

- Update paper/code/dataset links in `index.html`
- Add BibTeX citation when paper is published
- Replace placeholder images with actual figures

## 📄 License

This website template is based on the [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template).

