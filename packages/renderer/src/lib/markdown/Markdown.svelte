<style>
.markdown > :global(p) {
  line-height: revert;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.markdown > :global(h1),
:global(h2),
:global(h3),
:global(h4),
:global(h5) {
  font-size: revert;
  line-height: normal;
  font-weight: revert;
  border-bottom: 1px solid #444;
  margin-bottom: 20px;
}

.markdown > :global(ul) {
  line-height: normal;
  list-style: revert;
  margin: revert;
  padding: revert;
}
</style>

<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import { micromark } from 'micromark';
import { directive, directiveHtml } from 'micromark-extension-directive';
import { button } from './micromark-button-directive';

let text: string;
let html: string;

// Optional attribute to specify the markdown to use
// the user can use: <Markdown>**bold</Markdown> or <Markdown markdown="**bold**" /> syntax
export let markdown = '';
export let inProgressMarkdownCommandExecutionCallback: (
  command: string,
  state: 'starting' | 'failed' | 'successful',
  value?: unknown,
) => void = () => {};

$: markdown
  ? (html = micromark(markdown, {
      extensions: [directive()],
      htmlExtensions: [directiveHtml({ button })],
    }))
  : undefined;

const eventListeners: ((e: any) => void)[] = [];

onMount(() => {
  if (markdown) {
    text = markdown;
  }
  // provide our custom extension that allow to create buttons
  html = micromark(text, {
    extensions: [directive()],
    htmlExtensions: [directiveHtml({ button })],
  });

  const clickListener = (e: any) => {
    if (e.target instanceof HTMLButtonElement) {
      const command = e.target.dataset.command;
      if (command && !e.target.disabled) {
        inProgressMarkdownCommandExecutionCallback(command, 'starting');
        e.target.disabled = true;
        e.target.firstChild.style.display = 'inline-block';
        window
          .executeCommand(command)
          .then(value => inProgressMarkdownCommandExecutionCallback(command, 'successful', value))
          .catch((reason: unknown) => inProgressMarkdownCommandExecutionCallback(command, 'failed', reason))
          .finally(() => {
            e.target.disabled = false;
            e.target.firstChild.style.display = 'none';
          });
      }
    }
  };
  eventListeners.push(clickListener);
  document.addEventListener('click', clickListener);
});
onDestroy(() => {
  eventListeners.forEach(listener => document.removeEventListener('click', listener));
});
</script>

<!-- placeholder to grab the content if people are using <Markdown>**bold</Markdown> -->
<span contenteditable="false" bind:textContent="{text}" class="hidden">
  <slot />
</span>

<section class="markdown" aria-label="markdown-content">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html html}
</section>
