const uuidv1 = require('uuid/v1');

const {
  parse,
  NodeType: { ELEMENT_NODE, TEXT_NODE }
} = require('node-html-parser');
const defaultFn = require('./defaultFunc');
// var
const PATTERN_INIT_VAR = '(\\w+)\\s(\\w+)';
const PATTERN_INIT_DECLARE_VAR = `${PATTERN_INIT_VAR}\\s\=\\s?(\\w+)\;?`;
const PATTERN_INIT_VAR_VAL_TAG = `${PATTERN_INIT_VAR}\\s?\=\\s?\\(\\s+?\<template>(.*?)<\/template>\;?\\s+?\\)\;?`;
const REGEXP_INIT_VAR_VAL_TAG = new RegExp(PATTERN_INIT_VAR_VAL_TAG, 'g');
const REGEXP_INIT_DECLARE_VAR = new RegExp(PATTERN_INIT_DECLARE_VAR, 'g');
// template
const REGEXP_TEMPLATE_TAG = /\<template[^>]*>(.*?)<\/template>\;?/g;
const REGEXP_TEMPLATE = /\{\{(.*?)\}\}/g;

function isTm(str) {
  return REGEXP_TEMPLATE.test(str);
}

function compiler(template) {
  let __id = 1;
  let $tm = template.replace(/\n|\s\s+/g, ' ').trim();
  let $reactVar = {};
  let vars = getAllVar();

  function getAllVar() {
    let match;
    let arr = [];
    do {
      match = REGEXP_INIT_DECLARE_VAR.exec($tm);
      arr.push(match);
    } while (match != null);
    return arr;
  }

  function isVar(name) {
    return vars.some(a => a && a[2] == name);
  }

  function clearVars(name) {
    vars.forEach(_var => {
      if (_var) {
        if (!name) {
          $tm = $tm.replace(_var[0], '');
          return;
        }
        if (_var[0] === name) {
          $tm = $tm.replace(_var[0], '');
        }
      }
    });
  }

  function createElement(tag) {
    return `element('${tag}')`;
  }

  function createText(txt) {
    return `text(${txt})`;
  }

  function appendChild(parent, child) {
    return `append(${parent}, ${child})`;
  }

  function textContent(n, v) {
    return `textContent(${n}, ${v})`;
  }

  function compilHtml(tm) {
    const dom = parse(tm);

    function textNode(rawText, _tagName) {
      if (isTm(rawText)) {
        rawText = rawText.replace(REGEXP_TEMPLATE, (match, body) => {
          const varTm = body.trim();
          if (isVar(varTm)) {
            if (!$reactVar[varTm]) $reactVar[varTm] = [];
            $reactVar[varTm].push(_tagName);
            return `\$\{${'$'.repeat(3)}.${varTm}\}`;
          }
          return `\$\{${varTm}\}`;
        });
      }
      rawText = `\`${rawText}\``;
      return rawText;
    }

    const tags = [];
    const texts = [];
    function toArrayNode(node) {
      if (node && Array.isArray(node.childNodes)) {
        const len = node.childNodes.length;
        for (let i = 0; i < len; i++) {
          const childNodes = node.childNodes[i];
          tags.unshift(toArrayNode(childNodes));
        }
      }
      return node;
    }

    toArrayNode(dom);

    function parseHtml() {
      let jsHtmlTm = '';

      tags
        .filter(node => {
          if (node.tagName) {
            node._tagName = `_${node.tagName}${(__id += 1)}`;
            const { tagName, _tagName } = node;
            jsHtmlTm += `let ${_tagName} = ${createElement(tagName)};\n`;
          }

          return node.parentNode != null;
        })
        .reverse()
        .forEach(node => {
          jsHtmlTm +=
            appendChild(node.parentNode._tagName, node._tagName) + ';\n';

          node.childNodes
            .filter(
              child => child.nodeType === TEXT_NODE && child.rawText.trim()
            )
            .forEach(child => {
              const rawText = child.rawText;
              child.rawText = textNode(rawText, node._tagName);
              jsHtmlTm +=
                appendChild(node._tagName, createText(child.rawText)) + ';\n';
            });
          return node;
        });
      return jsHtmlTm;
    }

    return parseHtml();
  }

  if (REGEXP_INIT_VAR_VAL_TAG.test($tm) == true) {
    const REGEXP_INIT_VAR_EQ = new RegExp(`${PATTERN_INIT_VAR}\\s?\=\\s?`);
    $tm.match(REGEXP_INIT_VAR_VAL_TAG).forEach(html => {
      const cleanHtml = html
        .replace(REGEXP_INIT_VAR_EQ, '')
        .replace(REGEXP_TEMPLATE_TAG, '$1')
        .trim()
        .slice(1, -2);
      const newTemplateJsCode = compilHtml(cleanHtml);
      const firstVar = newTemplateJsCode.match(PATTERN_INIT_VAR);
      const nameVar = firstVar[2];

      const rootVar = html.match(REGEXP_INIT_VAR_EQ);
      const rootInitDeclareVar = rootVar[0];
      const newTemplateWithWrapFunc = `${newTemplateJsCode}${rootInitDeclareVar}${nameVar};\n`;

      $tm = $tm.replace(html, newTemplateWithWrapFunc);
    });
  }
  if (REGEXP_TEMPLATE_TAG.test($tm)) {
    $tm.match(REGEXP_TEMPLATE_TAG).forEach(html => {
      const cleanHtml = html.replace(REGEXP_TEMPLATE_TAG, '$1').trim();
      const newTemplateJsCode = compilHtml(cleanHtml);
      $tm = $tm.replace(html, newTemplateJsCode);
    });
  }

  if (Object.keys($reactVar).length) {
    let _argvObserve = '_opts_';
    let initObserveTm = '';
    let setObserveTm = '';
    let jsonStr = '';

    if (vars.length) {
      for (let _var of vars) {
        if (_var != null) {
          const key = _var[2];
          const val = _var[3];
          initObserveTm += `${key},`;
          jsonStr += `${key}: ${val},`;
        }
      }
      jsonStr = `{${jsonStr.slice(0, -1)}}`;
      initObserveTm = `\nlet $$ = ${jsonStr};\nlet __ob__ = observebal($$);\n\n`;

      for (let key in $reactVar) {
        const varItems = $reactVar[key];
        setObserveTm += `__ob__.$on('${key}', (${_argvObserve}) => {\n`;

        varItems.forEach(_var => {
          setObserveTm += `textContent(${_var}, ${_argvObserve}.value);\n`;
        });

        setObserveTm += '});\n\n';
      }
      clearVars();

      $tm = `${initObserveTm} ${$tm} ${setObserveTm}`;
    }
  }

  return `${defaultFn} ${$tm}`;
}

module.exports = compiler;
