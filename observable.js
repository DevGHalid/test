export default function observable(data) {
  const events = {};

  function has(name) {
    return data.hasOwnProperty(name);
  }

  function hasEvent(name) {
    return events.hasOwnProperty(name);
  }

  function subscribe(name, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('The second argument must be a function');
    }

    if (!hasEvent(name)) {
      events[name] = [];
    }
    events[name].push(listener);
  }

  function unsubscribe(name) {
    events[name] = [];
  }

  function notify(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('The second argument must be a function');
    }

    for (let name in data) {
      if (!hasEvent(name)) {
        events[name] = [];
      }

      events[name].push(listener);
    }
  }

  function call(name) {
    if (has(name) && hasEvent(name)) {
      const listeners = events[name];

      for (let listener of listeners) {
        listener();
      }
    }
  }

  function makeReactive(name, value) {
    Object.defineProperty(data, name, {
      get() {
        return value;
      },
      set(newValue) {
        if (value !== newValue) {
          value = newValue;

          call(name);
        }
      }
    });
  }

  for (let name in data) {
    makeReactive(name, data[name]);
  }

  return { data, has, subscribe, unsubscribe, notify, call, makeReactive };
}
