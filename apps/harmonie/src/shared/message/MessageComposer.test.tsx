import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message, ReplyPreview } from '@/types/channel';
import { MessageComposer } from './MessageComposer';

const apiMocks = vi.hoisted(() => ({
  deleteFile: vi.fn(),
  uploadFile: vi.fn(),
}));

const uiMocks = vi.hoisted(() => ({
  focus: vi.fn(),
}));

vi.mock('@/api/files', () => apiMocks);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      values?.count ? `${key}:${values.count}` : key,
  }),
}));

vi.mock('@harmonie/ui', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  const RichTextMessageInput = React.forwardRef<
    { focus: (placement?: 'start' | 'end') => void },
    {
      autoFocus?: boolean;
      disabled?: boolean;
      error?: string;
      labels?: Record<string, string>;
      mentionOptions?: Array<{ userId: string; username: string; displayName?: string | null }>;
      onArrowUpWhenEmpty?: () => void;
      onAttachClick?: () => void;
      onChange: (value: string) => void;
      onMentionSelected?: (mention: {
        userId: string;
        username: string;
        displayName?: string | null;
      }) => void;
      onPasteFiles?: (files: File[]) => void;
      onSubmit: () => void;
      onToggleFormattingTools?: () => void;
      placeholder?: string;
      showFormattingTools?: boolean;
      submitDisabled?: boolean;
      value: string;
    }
  >((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      focus: uiMocks.focus,
    }));

    return (
      <section
        data-testid="rich-text-input"
        data-autofocus={String(props.autoFocus)}
        data-formatting-open={String(props.showFormattingTools)}
      >
        <textarea
          aria-label="composer"
          disabled={props.disabled}
          onChange={(event) => props.onChange(event.currentTarget.value)}
          placeholder={props.placeholder}
          value={props.value}
        />
        <input
          aria-label="paste files"
          multiple
          onChange={(event) => props.onPasteFiles?.(Array.from(event.currentTarget.files ?? []))}
          type="file"
        />
        <button disabled={props.submitDisabled} onClick={props.onSubmit} type="button">
          submit
        </button>
        <button
          onClick={() => {
            const mention = props.mentionOptions?.[0];
            if (mention) props.onMentionSelected?.(mention);
          }}
          type="button"
        >
          choose mention
        </button>
        <button
          disabled={!props.onArrowUpWhenEmpty}
          onClick={props.onArrowUpWhenEmpty}
          type="button"
        >
          edit latest
        </button>
        <button onClick={props.onAttachClick} type="button">
          attach
        </button>
        <button onClick={props.onToggleFormattingTools} type="button">
          formatting
        </button>
        <output aria-label="composer error">{props.error ?? ''}</output>
      </section>
    );
  });
  RichTextMessageInput.displayName = 'RichTextMessageInputMock';

  return {
    IconButton: ({
      children,
      title,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { title?: string }) => (
      <button aria-label={title} type="button" {...props}>
        {children}
      </button>
    ),
    RichTextMessageInput,
  };
});

const makeFile = (name: string, type: string) => new File(['content'], name, { type });

const installBrowserMocks = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: vi.fn(() => 'blob:mock-url'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: vi.fn(),
  });
};

const latestEditableMessage: Message = {
  attachments: [],
  authorUserId: 'user-1',
  content: 'previous',
  createdAtUtc: '2026-01-01T00:00:00.000Z',
  isPinned: false,
  messageId: 'message-latest',
  reactions: [],
  replyTo: null,
  updatedAtUtc: null,
};

const replyTo: ReplyPreview = {
  authorDisplayName: 'Ada Lovelace',
  authorUserId: 'user-2',
  authorUsername: 'ada',
  content: '<p>Original message</p>',
  deletedAtUtc: null,
  hasAttachments: false,
  isDeleted: false,
  messageId: 'reply-1',
};

describe('MessageComposer', () => {
  beforeEach(() => {
    installBrowserMocks();
    apiMocks.deleteFile.mockResolvedValue(undefined);
    apiMocks.uploadFile.mockResolvedValue({ fileId: 'file-1' });
    uiMocks.focus.mockClear();
    vi.spyOn(Math, 'random').mockReturnValue(0.42);
  });

  it('sends text with selected mentions, clears reply state and throttles typing notifications', async () => {
    const user = userEvent.setup();
    const sendFn = vi.fn().mockResolvedValue(undefined);
    const onCancelReply = vi.fn();
    const onEditingRequested = vi.fn();
    const onTypingStart = vi.fn();
    const dateNow = vi.spyOn(Date, 'now');

    render(
      <MessageComposer
        latestEditableMessage={latestEditableMessage}
        mentionOptions={[{ userId: 'user-2', username: 'ada', displayName: 'Ada Lovelace' }]}
        onCancelReply={onCancelReply}
        onEditingRequested={onEditingRequested}
        onTypingStart={onTypingStart}
        replyTo={replyTo}
        sendFn={sendFn}
      />
    );

    await waitFor(() => expect(uiMocks.focus).toHaveBeenCalledWith('end'));

    dateNow.mockReturnValue(5000);
    fireEvent.change(screen.getByLabelText('composer'), { target: { value: 'Hi' } });
    expect(onTypingStart).toHaveBeenCalledTimes(1);

    dateNow.mockReturnValue(6000);
    fireEvent.change(screen.getByLabelText('composer'), { target: { value: 'Hi @Ada' } });
    expect(onTypingStart).toHaveBeenCalledTimes(1);

    dateNow.mockReturnValue(10000);
    fireEvent.change(screen.getByLabelText('composer'), { target: { value: 'Hi @Ada Lovelace' } });
    expect(onTypingStart).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('button', { name: 'choose mention' }));
    await user.click(screen.getByRole('button', { name: 'edit latest' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(sendFn).toHaveBeenCalledWith('Hi @Ada Lovelace', [], 'reply-1', ['user-2'])
    );
    expect(onEditingRequested).toHaveBeenCalledWith('message-latest');
    expect(onCancelReply).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('composer')).toHaveValue('');
  });

  it('uploads attachments from file input and removes uploaded files with preview cleanup', async () => {
    const user = userEvent.setup();
    const sendFn = vi.fn().mockResolvedValue(undefined);
    const picture = makeFile('picture.png', 'image/png');

    render(<MessageComposer sendFn={sendFn} />);

    await user.upload(screen.getByLabelText('channel.input.attachFile'), picture);

    expect(apiMocks.uploadFile).toHaveBeenCalledWith(picture);
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'picture.png' })).toBeInTheDocument()
    );

    await user.click(screen.getByLabelText('channel.input.removeAttachment'));

    await waitFor(() => expect(apiMocks.deleteFile).toHaveBeenCalledWith('file-1'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(screen.queryByRole('img', { name: 'picture.png' })).not.toBeInTheDocument();
  });

  it('sends uploaded attachments dropped on the composer and ignores unsupported files', async () => {
    const user = userEvent.setup();
    const sendFn = vi.fn().mockResolvedValue(undefined);
    const textFile = makeFile('notes.txt', 'text/plain');
    const unsupported = makeFile('script.sh', 'application/x-sh');

    render(<MessageComposer sendFn={sendFn} />);

    const dropTarget = screen.getByTestId('rich-text-input').parentElement!;
    fireEvent.dragOver(dropTarget);
    fireEvent.drop(dropTarget, {
      dataTransfer: {
        files: [textFile, unsupported],
      },
    });

    expect(apiMocks.uploadFile).toHaveBeenCalledTimes(1);
    expect(apiMocks.uploadFile).toHaveBeenCalledWith(textFile);

    await waitFor(() => expect(screen.getByText('TXT')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() => expect(sendFn).toHaveBeenCalledWith('', ['file-1'], null, []));
  });

  it('keeps drag state while moving inside the composer and ignores unsupported drops', () => {
    const sendFn = vi.fn().mockResolvedValue(undefined);
    const unsupported = makeFile('script.sh', 'application/x-sh');

    render(<MessageComposer sendFn={sendFn} />);

    const dropTarget = screen.getByTestId('rich-text-input').parentElement!;
    fireEvent.dragOver(dropTarget);
    expect(dropTarget).toHaveClass('ring-primary');

    const insideLeave = createEvent.dragLeave(dropTarget);
    Object.defineProperty(insideLeave, 'relatedTarget', { value: dropTarget });
    fireEvent(dropTarget, insideLeave);
    expect(dropTarget).toHaveClass('ring-primary');

    fireEvent.dragLeave(dropTarget, { relatedTarget: document.body });
    expect(dropTarget).not.toHaveClass('ring-primary');

    fireEvent.drop(dropTarget, {
      dataTransfer: {
        files: [unsupported],
      },
    });

    expect(apiMocks.uploadFile).not.toHaveBeenCalled();
  });

  it('forwards attach clicks to the hidden file input', async () => {
    const user = userEvent.setup();
    const sendFn = vi.fn().mockResolvedValue(undefined);

    render(<MessageComposer sendFn={sendFn} />);

    const fileInput = screen.getByLabelText('channel.input.attachFile');
    const click = vi.spyOn(fileInput, 'click');

    await user.click(screen.getByRole('button', { name: 'attach' }));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('surfaces upload, validation and API errors', async () => {
    const user = userEvent.setup();
    const sendFn = vi.fn().mockRejectedValue({ code: 'MESSAGE_MENTIONED_USER_NOT_MEMBER' });
    apiMocks.uploadFile.mockRejectedValueOnce(new Error('upload failed'));

    render(<MessageComposer sendFn={sendFn} />);

    await user.upload(
      screen.getByLabelText('paste files'),
      makeFile('broken.pdf', 'application/pdf')
    );

    await waitFor(() =>
      expect(screen.getByLabelText('composer error')).toHaveTextContent('channel.input.uploadError')
    );
    expect(screen.getByText('!')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('composer'), { target: { value: 'x'.repeat(4001) } });

    expect(screen.getByLabelText('composer error')).toHaveTextContent('channel.input.tooLong:4001');
    expect(screen.getByRole('button', { name: 'submit' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('composer'), { target: { value: 'hello' } });
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(screen.getByLabelText('composer error')).toHaveTextContent(
        'channel.input.mentionUserNotMember'
      )
    );
  });

  it('surfaces missing mention and generic API errors', async () => {
    const user = userEvent.setup();
    const sendFn = vi
      .fn()
      .mockRejectedValueOnce({ code: 'MESSAGE_MENTIONED_USER_NOT_FOUND' })
      .mockRejectedValueOnce(new Error('network'));

    render(<MessageComposer sendFn={sendFn} />);

    fireEvent.change(screen.getByLabelText('composer'), { target: { value: 'hello' } });
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(screen.getByLabelText('composer error')).toHaveTextContent(
        'channel.input.mentionUserNotFound'
      )
    );

    fireEvent.change(screen.getByLabelText('composer'), { target: { value: 'hello again' } });
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(screen.getByLabelText('composer error')).toHaveTextContent('channel.input.error')
    );
  });

  it('toggles formatting tools and keeps submit disabled for empty content', async () => {
    const user = userEvent.setup();
    const sendFn = vi.fn().mockResolvedValue(undefined);

    render(<MessageComposer sendFn={sendFn} />);

    expect(screen.getByTestId('rich-text-input')).toHaveAttribute('data-formatting-open', 'false');
    expect(screen.getByRole('button', { name: 'submit' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'formatting' }));

    expect(screen.getByTestId('rich-text-input')).toHaveAttribute('data-formatting-open', 'true');
  });
});
