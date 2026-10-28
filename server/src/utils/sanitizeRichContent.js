const sanitizeHtml = require('sanitize-html');

const cleanHtml = (html) =>
  sanitizeHtml(html, {
    // defaults me h1-h6, table, thead, tbody, tr, th, td, ul, ol, li, strong, em wagairah already hain
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan']
    },
    allowedSchemes: ['http', 'https'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' })
    }
  });

/**
 * Accepts array or JSON string (FormData case), returns clean array for Mongoose.
 */
const parseRichContents = (input) => {
  let arr = input;
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr);
    } catch {
      arr = [];
    }
  }
  if (!Array.isArray(arr)) return [];

  return arr
    .filter((rc) => rc && rc.title && rc.html)
    .map((rc) => ({
      title: String(rc.title).trim().slice(0, 200),
      topic: String(rc.topic || 'All Topics').trim().slice(0, 100),
      html: cleanHtml(String(rc.html))
    }))
    .filter((rc) => rc.html.trim().length > 0);
};

module.exports = { cleanHtml, parseRichContents };