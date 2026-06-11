import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RichTextLinkDialog } from './RichTextLinkDialog';

describe('RichTextLinkDialog', () => {
  beforeEach(() => {
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

  it('edits link fields, saves, removes, and cancels', () => {
    const onClose = vi.fn();
    const onRemove = vi.fn();
    const onSave = vi.fn();
    const setLinkText = vi.fn();
    const setLinkUrl = vi.fn();

    render(
      <RichTextLinkDialog
        title="Add link"
        closeLabel="Close"
        cancelLabel="Cancel"
        saveLabel="Save"
        removeLabel="Remove"
        linkText="Example"
        linkTextLabel="Text"
        linkUrl="https://example.com"
        linkUrlLabel="URL"
        setLinkText={setLinkText}
        setLinkUrl={setLinkUrl}
        onClose={onClose}
        onRemove={onRemove}
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Docs' } });
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://docs.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.submit(screen.getByRole('button', { name: 'Save' }).closest('form')!);

    expect(setLinkText).toHaveBeenCalledWith('Docs');
    expect(setLinkUrl).toHaveBeenCalledWith('https://docs.test');
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('disables saving until both fields have content', () => {
    const { rerender } = render(
      <RichTextLinkDialog
        title="Add link"
        closeLabel="Close"
        cancelLabel="Cancel"
        saveLabel="Save"
        removeLabel="Remove"
        linkText=""
        linkTextLabel="Text"
        linkUrl=""
        linkUrlLabel="URL"
        setLinkText={vi.fn()}
        setLinkUrl={vi.fn()}
        onClose={vi.fn()}
        onRemove={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();

    rerender(
      <RichTextLinkDialog
        title="Add link"
        closeLabel="Close"
        cancelLabel="Cancel"
        saveLabel="Save"
        removeLabel="Remove"
        linkText="Docs"
        linkTextLabel="Text"
        linkUrl="   "
        linkUrlLabel="URL"
        setLinkText={vi.fn()}
        setLinkUrl={vi.fn()}
        onClose={vi.fn()}
        onRemove={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    rerender(
      <RichTextLinkDialog
        title="Add link"
        closeLabel="Close"
        cancelLabel="Cancel"
        saveLabel="Save"
        removeLabel="Remove"
        linkText="Docs"
        linkTextLabel="Text"
        linkUrl="https://example.com"
        linkUrlLabel="URL"
        setLinkText={vi.fn()}
        setLinkUrl={vi.fn()}
        onClose={vi.fn()}
        onRemove={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });
});
