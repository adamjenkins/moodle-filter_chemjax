// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Swap ChemJax placeholder spans for isolated MathJax 2 renderer iframes.
 *
 * @module     filter_chemjax/loader
 * @copyright  2017 Kenichi Miura (miura-k@tokyo-kasei.ac.jp)
 * @copyright  2026 Adam Jenkins <adam@wisecat.net>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {eventTypes} from 'core_filters/events';
import {getString} from 'core/str';

const SELECTOR = 'span.filter-chemjax-formula:not([data-chemjax-done])';
// A cold-cache first render (MathJax.js + TeX-AMS_HTML config + the
// chemfig3/xypic/mhchem extensions + HTML-CSS fonts, all from the CDN) was
// measured taking ~13-14s in real E2E testing, so 10s was too tight and
// caused spurious fallback. 20s gives that headroom while still bounding a
// genuinely broken renderer.
const RENDER_TIMEOUT_MS = 20000;

let config = null;
// Map of iframe contentWindow -> {iframe, span, timer}.
const frames = new Map();

/**
 * Initialise the loader once per page.
 *
 * @param {Object} params
 * @param {string} params.mathjaxurl MathJax 2 base URL
 * @param {number} params.bondlen Default bond length
 */
export const init = (params) => {
    if (config !== null) {
        return;
    }
    config = params;
    window.addEventListener('message', onMessage);
    document.addEventListener(eventTypes.filterContentUpdated, () => enhance(document));
    enhance(document);
};

/**
 * Decode the base64 UTF-8 payload of a placeholder.
 *
 * @param {string} b64
 * @returns {string}
 */
const decodeTex = (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
};

/**
 * Replace all unprocessed placeholders under root with renderer iframes.
 *
 * @param {HTMLElement|Document} root
 */
const enhance = (root) => {
    root.querySelectorAll(SELECTOR).forEach((span) => {
        span.dataset.chemjaxDone = '1';
        let tex;
        try {
            tex = decodeTex(span.dataset.chemjax || '');
        } catch (e) {
            return; // Corrupt payload: leave the fallback text.
        }
        if (!tex.includes('\\cjx')) {
            return;
        }
        const iframe = document.createElement('iframe');
        iframe.className = 'filter-chemjax-frame';
        iframe.setAttribute('scrolling', 'no');
        iframe.title = tex;
        iframe.style.height = '0';
        iframe.src = M.cfg.wwwroot + '/filter/chemjax/renderer.html';
        iframe.addEventListener('load', () => {
            frames.set(iframe.contentWindow, {
                iframe,
                span,
                timer: setTimeout(() => fail(iframe, span), RENDER_TIMEOUT_MS),
            });
            iframe.contentWindow.postMessage({type: 'chemjax-config', ...config}, window.location.origin);
            iframe.contentWindow.postMessage({type: 'chemjax-render', tex}, window.location.origin);
        });
        span.after(iframe);
    });
};

/**
 * Give up on an iframe: remove it and flag the visible fallback source.
 *
 * The title is a nice-to-have enhancement on top of the fallback text (which
 * is already visible once the iframe is removed), so a getString() rejection
 * must not surface as an unhandled promise rejection in the parent page.
 *
 * @param {HTMLIFrameElement} iframe
 * @param {HTMLElement} span
 */
const fail = (iframe, span) => {
    frames.delete(iframe.contentWindow);
    iframe.remove();
    getString('rendererfailed', 'filter_chemjax')
        .then((s) => {
            span.title = s;
            return;
        })
        .catch(() => {
            // Fallback source text is already visible; the title is optional.
        });
};

/**
 * Handle height reports from renderer iframes.
 *
 * @param {MessageEvent} e
 */
const onMessage = (e) => {
    if (e.origin !== window.location.origin || !e.data || e.data.type !== 'chemjax-height') {
        return;
    }
    const entry = frames.get(e.source);
    if (!entry) {
        return;
    }
    clearTimeout(entry.timer);
    entry.iframe.style.height = e.data.height + 'px';
    entry.span.classList.add('filter-chemjax-rendered');
};
