export function createGenerationStreamTracker(initialModelCount) {
  let generationStarted = false;
  let completed = false;
  let lastText = '';

  return {
    observe(history) {
      const modelMessages = history.filter((message) => message.role === 'model');
      const last = modelMessages.at(-1);
      if (!last) return { delta: '', done: false };

      if (!generationStarted) {
        if (modelMessages.length <= initialModelCount) {
          return { delta: '', done: false };
        }
        generationStarted = true;
        lastText = '';
      }

      const text = last.text || '';
      let delta = '';
      if (text.length > lastText.length) {
        delta = text.slice(lastText.length);
        lastText = text;
      }

      const done = Boolean(last.doneGenerating && !completed);
      if (done) completed = true;
      return { delta, done };
    },
    get text() {
      return lastText;
    },
    get completed() {
      return completed;
    },
  };
}
