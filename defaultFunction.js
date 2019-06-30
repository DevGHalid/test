module.exports = `
const isFunc = (h) => typeof h === 'function';

function observebal(data) {
  const signal = {};
  const signals = [];

  makeObservebal();

  function $on(key, handelSignal) {
    if (!signal.hasOwnProperty(key)) signal[key] = [];
    if (isFunc(handelSignal)) {
      signal[key].push(handelSignal);
    }
  }

  function $notify(handelSignal) {
    if (isFunc(handelSignal)) {
      signals.push(handelSignal);
    }
  }

  function applySignals(_signals, options) {
    for (let handelSignal of _signals) {
      handelSignal(options);
    }
  }

  function makeReactive(key) {
    let value = data[key];
    Object.defineProperty(data, key, {
      get() {
        return value;
      },
      set(newValue) {
        if (value !== newValue) {
          value = newValue;
          const options = {key, value};
          if (signals.length > 0) {
            applySignals(signals, options);
          }
          if (signal.hasOwnProperty(key) && signal[key].length > 0) {
            applySignals(signal[key], options);
          }
        }
      },
    });
  }

  function makeObservebal() {
    for (let key in data) {
      makeReactive(key);
    }
  }

  return {$on, $notify, _data: data};
}


function element(t) {
  return document.createElement(t);
}  

function text(t) {
  return document.createTextNode(t);
}

function append(p, ch) {
  p.appendChild(ch);
}

function textContent(n, v) {
  if (v == undefined) {
    return n.textContent;
  }
  n.textContent = v;
}
`;
