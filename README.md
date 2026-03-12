# Obsidian Spoilers

Hide sensitive or spoiler text in your notes using Discord-style `||text||` syntax.

## Usage

Wrap any text with double pipes to mask it:

```markdown
The secret code is ||1234-5678||
My API key is ||sk-abc123xyz||
```

Masked text appears as a solid bar. **Click to reveal**, click again to hide.

## Features

- **Inline syntax** — `||your text here||`
- **Reading mode** — spoilers are always hidden until clicked
- **Live preview** — spoilers are masked, but raw syntax shows when your cursor is inside the range for easy editing
- **Theme-aware** — mask color adapts to your Obsidian theme

## Installation

### Community Plugins

1. Open **Settings → Community Plugins → Browse**
2. Search for **Obsidian Spoilers**
3. Click **Install**, then **Enable**

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/chiubaca/obsidian-spoilers/releases/latest)
2. Create a folder at `<your-vault>/.obsidian/plugins/obsidian-spoilers/`
3. Copy the three files into that folder
4. Enable the plugin in **Settings → Community Plugins**
