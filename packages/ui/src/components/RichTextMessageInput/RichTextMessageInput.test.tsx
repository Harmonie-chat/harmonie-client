import { createRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RichTextMessageInput, type RichTextMessageInputHandle } from './RichTextMessageInput';

const quillState = vi.hoisted(() => ({
  latest: null as null | {
    emit: (eventName: string, ...args: unknown[]) => void;
    focus: ReturnType<typeof vi.fn>;
    format: ReturnType<typeof vi.fn>;
    formatText: ReturnType<typeof vi.fn>;
    history: { cutoff: ReturnType<typeof vi.fn> };
    insertText: ReturnType<typeof vi.fn>;
    deleteText: ReturnType<typeof vi.fn>;
    selection: { index: number; length: number } | null;
    setText: ReturnType<typeof vi.fn>;
    text: string;
    formats: Record<string, unknown>;
  },
}));

vi.mock('quill', () => {
  class InlineBlot {
    static create() {
      return document.createElement('span');
    }
  }

  class MockQuill {
    static import = vi.fn(() => InlineBlot);
    static register = vi.fn();

    root = document.createElement('div');
    text = '';
    html = '<p><br></p>';
    formats: Record<string, unknown> = {};
    selection: { index: number; length: number } | null = { index: 0, length: 0 };
    handlers = new Map<string, Set<(...args: unknown[]) => void>>();
    clipboard = {
      dangerouslyPasteHTML: vi.fn((html: string) => {
        this.html = html;
        this.text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
      }),
    };
    history = { cutoff: vi.fn() };
    keyboard = { addBinding: vi.fn() };
    enable = vi.fn();
    focus = vi.fn();
    blur = vi.fn();
    format = vi.fn((name: string, value: unknown) => {
      this.formats[name] = value;
    });
    formatLine = vi.fn();
    formatText = vi.fn();
    setText = vi.fn((text: string) => {
      this.text = text;
      this.html = text ? `<p>${text}</p>` : '<p><br></p>';
    });
    insertText = vi.fn((index: number, text: string) => {
      this.text = `${this.text.slice(0, index)}${text}${this.text.slice(index)}`;
      this.html = `<p>${this.text}</p>`;
    });
    deleteText = vi.fn((index: number, length: number) => {
      this.text = `${this.text.slice(0, index)}${this.text.slice(index + length)}`;
      this.html = this.text ? `<p>${this.text}</p>` : '<p><br></p>';
    });
    setSelection = vi.fn((index: number, length: number) => {
      this.selection = { index, length };
    });

    constructor(host: HTMLElement, options: { placeholder?: string; readOnly?: boolean }) {
      this.root.className = 'ql-editor';
      this.root.dataset.placeholder = options.placeholder ?? '';
      host.appendChild(this.root);
      quillState.latest = this;
      this.enable(!options.readOnly);
    }

    on(eventName: string, handler: (...args: unknown[]) => void) {
      const handlers = this.handlers.get(eventName) ?? new Set<(...args: unknown[]) => void>();
      handlers.add(handler);
      this.handlers.set(eventName, handlers);
    }

    off(eventName: string, handler: (...args: unknown[]) => void) {
      this.handlers.get(eventName)?.delete(handler);
    }

    emit(eventName: string, ...args: unknown[]) {
      this.handlers.get(eventName)?.forEach((handler) => handler(...args));
    }

    getSelection() {
      return this.selection;
    }

    getLength() {
      return this.text.length + 1;
    }

    getText(index?: number, length?: number) {
      if (typeof index === 'number')
        return this.text.slice(index, index + (length ?? this.text.length));
      return this.text;
    }

    getSemanticHTML() {
      return this.html;
    }

    getFormat() {
      return this.formats;
    }

    getBounds() {
      return { height: 10, left: 32, top: 28, width: 48 };
    }
  }

  return { default: MockQuill };
});

vi.mock('../EmojiPickerBase/EmojiPickerBase', () => ({
  EmojiPickerBase: ({ onEmojiClick }: { onEmojiClick: (data: { emoji: string }) => void }) => (
    <button type="button" onClick={() => onEmojiClick({ emoji: '✨' })}>
      Pick sparkle
    </button>
  ),
}));

describe('RichTextMessageInput', () => {
  beforeEach(() => {
    quillState.latest = null;
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('allows the native editor context menu without bubbling to parent menus', async () => {
    const onParentContextMenu = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <div onContextMenu={onParentContextMenu}>
        <RichTextMessageInput value="Hello" onChange={vi.fn()} />
      </div>
    );

    await waitFor(() => expect(quillState.latest).not.toBeNull());
    const editor = document.querySelector('.ql-editor') as HTMLElement;
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

    expect(editor.dispatchEvent(contextMenuEvent)).toBe(true);
    expect(contextMenuEvent.defaultPrevented).toBe(false);
    expect(onParentContextMenu).not.toHaveBeenCalled();
  });

  it('wires toolbar, emoji, attach, submit, paste, and imperative focus actions', async () => {
    const onAttachClick = vi.fn();
    const onChange = vi.fn();
    const onPasteFiles = vi.fn();
    const onSubmit = vi.fn();
    const onToggleFormattingTools = vi.fn();
    const ref = createRef<RichTextMessageInputHandle>();

    render(
      <RichTextMessageInput
        ref={ref}
        value="Hello"
        onChange={onChange}
        placeholder="Write"
        showFormattingTools
        onToggleFormattingTools={onToggleFormattingTools}
        onAttachClick={onAttachClick}
        onPasteFiles={onPasteFiles}
        onSubmit={onSubmit}
        labels={{ send: 'Send message' }}
      />
    );

    await waitFor(() => expect(quillState.latest).not.toBeNull());
    const quill = quillState.latest!;

    fireEvent.click(screen.getByRole('button', { name: 'Attach a file' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show or hide formatting tools' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open emoji picker' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pick sparkle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    const editor = document.querySelector('.ql-editor') as HTMLElement;
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    fireEvent.paste(editor, {
      clipboardData: {
        files: [file],
        getData: () => '',
      },
    });

    ref.current?.focus('start');

    expect(onAttachClick).toHaveBeenCalledOnce();
    expect(onToggleFormattingTools).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalled();
    expect(onPasteFiles).toHaveBeenCalledWith([file]);
    expect(quill.history.cutoff).toHaveBeenCalled();
    expect(quill.insertText).toHaveBeenCalledWith(0, '✨', 'user');
    expect(quill.focus).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts, mentions, emoji autocomplete, links, and errors', async () => {
    const onChange = vi.fn();
    const onEscape = vi.fn();
    const onSubmit = vi.fn();
    const onArrowUpWhenEmpty = vi.fn();
    const onMentionSelected = vi.fn();

    render(
      <RichTextMessageInput
        value=""
        onChange={onChange}
        onEscape={onEscape}
        onSubmit={onSubmit}
        onArrowUpWhenEmpty={onArrowUpWhenEmpty}
        mentionOptions={[
          { userId: 'user-1', username: 'ada', displayName: 'Ada Lovelace' },
          { userId: 'user-2', username: 'grace' },
        ]}
        onMentionSelected={onMentionSelected}
        error="Could not send"
      />
    );

    await waitFor(() => expect(quillState.latest).not.toBeNull());
    const quill = quillState.latest!;
    const editor = document.querySelector('.ql-editor') as HTMLElement;

    fireEvent.keyDown(editor, { key: 'ArrowUp' });
    fireEvent.keyDown(editor, { key: 'Escape' });
    fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true });

    quill.text = '@ad';
    quill.selection = { index: 3, length: 0 };
    quill.emit('selection-change', quill.selection);
    fireEvent.keyDown(editor, { key: 'ArrowDown' });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Ada Lovelace/ })).toBeInTheDocument()
    );
    fireEvent.mouseDown(screen.getByRole('button', { name: /Ada Lovelace/ }));

    quill.text = ':smi';
    quill.selection = { index: 4, length: 0 };
    quill.emit('selection-change', quill.selection);
    fireEvent.keyDown(editor, { key: 'Tab' });

    quill.text = 'site';
    quill.selection = { index: 0, length: 4 };
    fireEvent.paste(editor, {
      clipboardData: {
        files: [],
        getData: () => 'https://example.com',
      },
    });

    quill.formats = { link: 'https://example.com' };
    quill.selection = { index: 0, length: 0 };
    fireEvent.mouseUp(editor, { button: 0 });

    expect(screen.getByText('Could not send')).toBeInTheDocument();
    expect(onArrowUpWhenEmpty).toHaveBeenCalledOnce();
    expect(onEscape).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalled();
    expect(onMentionSelected).toHaveBeenCalledWith({
      userId: 'user-1',
      username: 'ada',
      displayName: 'Ada Lovelace',
    });
    expect(quill.formatText).toHaveBeenCalledWith(0, 4, 'link', 'https://example.com', 'user');
    expect(screen.getByRole('link', { name: 'https://example.com' })).toBeInTheDocument();
  });

  it('handles keyboard autocomplete branches and direct URL insertion', async () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const onMentionSelected = vi.fn();

    render(
      <RichTextMessageInput
        value=""
        onChange={onChange}
        onSubmit={onSubmit}
        mentionOptions={[
          { userId: 'user-1', username: 'ada', displayName: 'Ada Lovelace' },
          { userId: 'user-2', username: 'grace' },
        ]}
        onMentionSelected={onMentionSelected}
      />
    );

    await waitFor(() => expect(quillState.latest).not.toBeNull());
    const quill = quillState.latest!;
    const editor = document.querySelector('.ql-editor') as HTMLElement;

    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledOnce();

    quill.text = '@ad';
    quill.selection = { index: 3, length: 0 };
    quill.emit('selection-change', quill.selection);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Ada Lovelace/ })).toBeInTheDocument()
    );
    fireEvent.keyDown(editor, { key: 'ArrowDown' });
    fireEvent.keyDown(editor, { key: 'ArrowUp' });
    fireEvent.keyDown(editor, { key: 'Enter' });

    expect(onMentionSelected).toHaveBeenCalledWith({
      userId: 'user-1',
      username: 'ada',
      displayName: 'Ada Lovelace',
    });

    quill.text = ':smi';
    quill.selection = { index: 4, length: 0 };
    quill.emit('selection-change', quill.selection);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /:smiley:/ })).toBeInTheDocument()
    );
    fireEvent.keyDown(editor, { key: 'ArrowDown' });
    fireEvent.keyDown(editor, { key: 'ArrowUp' });
    fireEvent.keyDown(editor, { key: 'Enter' });

    expect(quill.deleteText).toHaveBeenCalledWith(0, 4, 'api');

    quill.text = ':smi';
    quill.selection = { index: 4, length: 0 };
    quill.emit('selection-change', quill.selection);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /:smiley:/ })).toBeInTheDocument()
    );
    fireEvent.keyDown(editor, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: /:smiley:/ })).not.toBeInTheDocument();

    quill.text = '';
    quill.selection = { index: 0, length: 0 };
    fireEvent.paste(editor, {
      clipboardData: {
        files: [],
        getData: () => 'https://example.com/plain',
      },
    });

    expect(quill.insertText).toHaveBeenCalledWith(
      0,
      'https://example.com/plain',
      { link: 'https://example.com/plain' },
      'user'
    );

    quill.text = ':smi';
    quill.selection = { index: 4, length: 0 };
    quill.emit('selection-change', quill.selection);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /:smiley:/ })).toBeInTheDocument()
    );
    fireEvent.mouseDown(screen.getByRole('button', { name: /:smiley:/ }));

    quill.formats = { link: 'https://example.com/plain' };
    quill.selection = { index: 0, length: 0 };
    fireEvent.mouseUp(editor, { button: 0 });
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'https://example.com/plain' })).toBeInTheDocument()
    );
    fireEvent.keyDown(editor, { key: 'Escape' });
    fireEvent.keyDown(editor, { key: 'Escape' });

    fireEvent.paste(editor, {
      clipboardData: {
        files: [new File(['x'], 'x.txt')],
        getData: () => '',
      },
    });
  });

  it('dismisses floating toolbar and carries inline formats after Enter', async () => {
    const onChange = vi.fn();

    render(
      <RichTextMessageInput value="Hello" onChange={onChange} labels={{ bold: 'Floating bold' }} />
    );

    await waitFor(() => expect(quillState.latest).not.toBeNull());
    const quill = quillState.latest!;
    const editor = document.querySelector('.ql-editor') as HTMLElement;

    quill.selection = { index: 0, length: 2 };
    quill.formats = { bold: true };
    quill.emit('selection-change', quill.selection);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Floating bold' })).toBeInTheDocument()
    );
    fireEvent.keyDown(editor, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: 'Floating bold' })).not.toBeInTheDocument();

    quill.selection = { index: 5, length: 0 };
    quill.formats = { bold: true };
    vi.useFakeTimers();
    fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true });
    quill.selection = { index: 6, length: 0 };
    vi.runAllTimers();
    vi.useRealTimers();

    expect(quill.format).toHaveBeenCalledWith('bold', true, 'user');
  });
});
