let activeEffect;

class Dep {
  // imeplement this
  subscribers = new Set();

  constructor(value) {
    this._value = value;
  }

  get value() {
    this.depend();
    return this._value;
  }

  set value(value) {
    this._value = value;
    this.notify();
  }

  depend() {
    if (activeEffect) {
      this.subscribers.add(activeEffect);
    }
  }

  notify() {
    this.subscribers.forEach((effect) => {
      effect();
    });
  }
}

function watchEffect(effect) {
  activeEffect = effect;
  effect();
  activeEffect = null;
}

// proxy version
const reactiveHandlers = {
  get(target, key) {
    // how do we get the dep for this key?
    const value = getDep(target, key).value;
    if (value && typeof value === "object") {
      return reactive(value);
    } else {
      return value;
    }
  },
  set(target, key, value) {
    getDep(target, key).value = value;
  },
};

const targetToHashMap = new WeakMap();

function getDep(target, key) {
  let depMap = targetToHashMap.get(target);
  if (!depMap) {
    depMap = new Map();
    targetToHashMap.set(target, depMap);
  }

  let dep = depMap.get(key);
  if (!dep) {
    dep = new Dep(target[key]);
    depMap.set(key, dep);
  }

  return dep;
}

function reactive(obj) {
  return new Proxy(obj, reactiveHandlers);
}

function h(tag, props, children) {
  return { tag, props, children };
}

function mount(vnode, container, anchor) {
  const el = document.createElement(vnode.tag);
  vnode.el = el;
  // props
  if (vnode.props) {
    for (const key in vnode.props) {
      if (key.startsWith("on")) {
        el.addEventListener(key.slice(2).toLowerCase(), vnode.props[key]);
      } else {
        el.setAttribute(key, vnode.props[key]);
      }
    }
  }
  if (vnode.children) {
    if (typeof vnode.children === "string") {
      el.textContent = vnode.children;
    } else {
      vnode.children.forEach((child) => {
        mount(child, el);
      });
    }
  }
  if (anchor) {
    container.insertBefore(el, anchor);
  } else {
    container.appendChild(el);
  }
}

function patch(n1, n2) {
  // Implement this
  // 1. check if n1 and n2 are of the same type
  if (n1.tag !== n2.tag) {
    // 2. if not, replace
    const parent = n1.el.parentNode;
    const anchor = n1.el.nextSibling;
    parent.removeChild(n1.el);
    mount(n2, parent, anchor);
    return;
  }

  const el = (n2.el = n1.el);

  // 3. if yes
  // 3.1 diff props
  const oldProps = n1.props || {};
  const newProps = n2.props || {};
  for (const key in newProps) {
    const newValue = newProps[key];
    const oldValue = oldProps[key];
    if (newValue !== oldValue) {
      if (newValue != null) {
        el.setAttribute(key, newValue);
      } else {
        el.removeAttribute(key);
      }
    }
  }
  for (const key in oldProps) {
    if (!(key in newProps)) {
      el.removeAttribute(key);
    }
  }
  // 3.2 diff children
  const oc = n1.children;
  const nc = n2.children;
  if (typeof nc === "string") {
    if (nc !== oc) {
      el.textContent = nc;
    }
  } else if (Array.isArray(nc)) {
    if (Array.isArray(oc)) {
      // array diff
      const commonLength = Math.min(oc.length, nc.length);
      for (let i = 0; i < commonLength; i++) {
        patch(oc[i], nc[i]);
      }
      if (nc.length > oc.length) {
        nc.slice(oc.length).forEach((c) => mount(c, el));
      } else if (oc.length > nc.length) {
        oc.slice(nc.length).forEach((c) => {
          el.removeChild(c.el);
        });
      }
    } else {
      el.innerHTML = "";
      nc.forEach((c) => mount(c, el));
    }
  }
}

function patch(n1, n2) {
  // Implement this
  // 1. check if n1 and n2 are of the same type
  if (n1.tag !== n2.tag) {
    // 2. if not, replace
    const parent = n1.el.parentNode;
    const anchor = n1.el.nextSibling;
    parent.removeChild(n1.el);
    mount(n2, parent, anchor);
    return;
  }

  const el = (n2.el = n1.el);

  // 3. if yes
  // 3.1 diff props
  const oldProps = n1.props || {};
  const newProps = n2.props || {};
  for (const key in newProps) {
    const newValue = newProps[key];
    const oldValue = oldProps[key];
    if (newValue !== oldValue) {
      if (newValue != null) {
        el.setAttribute(key, newValue);
      } else {
        el.removeAttribute(key);
      }
    }
  }
  for (const key in oldProps) {
    if (!(key in newProps)) {
      el.removeAttribute(key);
    }
  }
  // 3.2 diff children
  const oc = n1.children;
  const nc = n2.children;
  if (typeof nc === "string") {
    if (nc !== oc) {
      el.textContent = nc;
    }
  } else if (Array.isArray(nc)) {
    if (Array.isArray(oc)) {
      // array diff
      const commonLength = Math.min(oc.length, nc.length);
      for (let i = 0; i < commonLength; i++) {
        patch(oc[i], nc[i]);
      }
      if (nc.length > oc.length) {
        nc.slice(oc.length).forEach((c) => mount(c, el));
      } else if (oc.length > nc.length) {
        oc.slice(nc.length).forEach((c) => {
          el.removeChild(c.el);
        });
      }
    } else {
      el.innerHTML = "";
      nc.forEach((c) => mount(c, el));
    }
  }
}

function createApp(Component, container) {
  // implement this
  const state = reactive(Component.data());
  let isMount = true;
  let prevTree;
  watchEffect(() => {
    const tree = Component.render.call(state);
    if (isMount) {
      mount(tree, container);
      isMount = false;
    } else {
      patch(prevTree, tree);
    }
    prevTree = tree;
  });
}

const Component = {
  data() {
    return {
      count: 0,
    };
  },
  render() {
    return h(
      "button",
      {
        onClick: () => {
          this.count++;
        },
      },
      String(this.count)
    );
  },
};

// calling this should actually mount the component.
createApp(Component, document.getElementById("app"));
