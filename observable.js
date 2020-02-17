export default function observable(data) {
 const events = {};

 /**
  * @param {string} name
  * @returns {boolean}
  */
 function has(name) {
  return data.hasOwnProperty(name);
 }

 /**
  * @param {string} name
  * @returns {boolean}
  */
 function hasEvent(name) {
  return events.hasOwnProperty(name);
 }

 /**
  * @param {string} name
  * @param {Function} listener
  * @returns {void}
  */
 function subscribe(name, listener) {
  if (typeof listener !== 'function') {
   throw new TypeError('The second argument must be a function');
  }

  if (!hasEvent(name)) {
   events[name] = [];
  }
  events[name].push(listener);
 }

 /**
  * @param {string} name
  * @returns {void}
  */
 function unsubscribe(name) {
  events[name] = [];
 }

 /**
  * @param {Function} listener
  * @returns {void}
  */
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

 /**
  * @param {string} name
  * @returns {void}
  */
 function call(name) {
  if (has(name) && hasEvent(name)) {
   const listeners = events[name];

   for (let listener of listeners) {
    listener();
   }
  }
 }

 /**
  * @param {string} name
  * @param {void} value
  */
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
