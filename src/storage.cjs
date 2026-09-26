// Single ordered write queue: a late native write must never restore older progress.
function createStorage({ get, set, notify = () => {} }) {
  let value = null, loaded = false, queue = Promise.resolve();
  return {
    async init(key) { value = await get(key); loaded = true; },
    getItem() { if (!loaded) throw new Error('Storage not loaded'); return value; },
    setItem(key, next) {
      if (!loaded) throw new Error('Storage not loaded');
      value = next;
      queue = queue.catch(() => {}).then(() => set(key, next));
      queue.then(() => notify(true), () => notify(false));
    },
    flush() { return queue; }
  };
}
module.exports = { createStorage };
