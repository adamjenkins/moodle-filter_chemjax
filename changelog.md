# Changelog

## 2.0.0 (2026-07-16)

**Rewrite for Moodle 5.x**

- Added support for Moodle 5.0–5.2 (removed support for earlier versions).
- Implemented self-contained ChemJax renderer using iframe isolation with MathJax 2.7.9.
- Chemistry formulas are now rendered via the `\cjx{...}` syntax in an isolated iframe, preventing conflicts with the site's own MathJax instance.
- Created companion `tiny_chemjax` TinyMCE editor plugin with live preview support.
- Simplified configuration: automatic filter enablement and streamlined settings (only MathJax URL and bond length).
- Consolidated extension set to stable variants: `chemfig3.js`, `xypic.js`, and `mhchem-3.2.0.js` (removed legacy variants).
- Improved compatibility and maintainability with modern Moodle coding standards.
