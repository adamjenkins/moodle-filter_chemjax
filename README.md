# ChemJax Filter

A Moodle 5.x text filter that renders chemistry notation using the `\cjx{...}` syntax via isolated MathJax 2.

## Features

The ChemJax filter automatically detects and renders chemical structure formulas using the `\cjx{...}` syntax within course content. The filter supports multiple input formats:

- **Bare runs:** `\cjx{...}` — standalone chemistry calls, optionally separated by `\\` line breaks
- **Math-delimited:** `$$..$$`, `\(...\)`, `\[...\]` containing `\cjx` calls within math regions

Formulas are rendered in an iframe-isolated MathJax 2 environment, preventing conflicts with the site's own MathJax instance. If rendering takes longer than 20 seconds, the source text remains visible as a fallback.

## Requirements

- Moodle 5.0 or later
- Web browser with JavaScript enabled

## Installation

1. Download or clone this plugin to your Moodle installation.
2. Place the plugin in the `filter/chemjax/` directory of your Moodle installation (under the `public/` docroot on Moodle 5.x).
3. Run the Moodle upgrade process.
4. Navigate to Site Administration > Plugins > Filters > Manage Filters and enable the ChemJax filter.

## Configuration

The following settings are available under Site Administration > Plugins > Filters > ChemJax:

- **MathJax 2 URL**: The base URL of a MathJax 2.7.x installation. Defaults to the jsDelivr CDN (`https://cdn.jsdelivr.net/npm/mathjax@2.7.9`). To avoid reliance on external services, point this to a local copy of MathJax 2.7.9.

- **Length of bonds**: Default bond length used when drawing structural formulas in xy-pic units (default 20). Adjust this value to control the spacing of chemical structure drawings.

## Version History

### 2.0.0 (2026-07-16)

This is a major rewrite of the ChemJax filter for Moodle 5.x. Key changes include:

- **Moodle 5.x support**: Requires Moodle 5.0 or later (Moodle 5.0–5.2 are supported).
- **Self-contained renderer**: Chemistry formulas are rendered in an isolated iframe using MathJax 2.7.9, preventing conflicts with the site's own MathJax instance.
- **TinyMCE companion plugin**: The new `tiny_chemjax` editor plugin provides a live preview dialog for inserting chemistry notation into course content.
- **Simplified configuration**: No longer requires manual pasting of MathJax loader configuration—just set the MathJax URL and bond length.
- **Dropped legacy variants**: This version uses only the stable extension variants: `chemfig3.js`, `xypic.js`, and `mhchem-3.2.0.js`.

### Breaking Changes

If you are upgrading from a previous version:

- **Remove old ChemJax configuration from filter_mathjaxloader**: If you have manually added ChemJax lines to your MathJax loader configuration (in the `filter_mathjaxloader` settings), remove them. The new filter handles all configuration internally.
- **Update content**: Ensure all chemistry notation in your courses uses the `\cjx{...}` syntax for compatibility with the new renderer.

## Known Limitations

- **HTML attribute values**: ChemJax notation inside HTML attribute values (e.g. `<div title="\cjx{X}">`) is not supported; the filter performs text-level matching and may inject markup inside quoted attributes.
- **Code blocks**: ChemJax notation inside `<pre>` and `<code>` blocks is deliberately not rendered, consistent with MathJax 2's own behaviour.

## License

This plugin is licensed under the GNU General Public License v3 or later (http://www.gnu.org/copyleft/gpl.html).

Third-party libraries (MathJax 2 extensions) are licensed under the Apache License 2.0. See `thirdpartylibs.xml` for details.
