'use client';

import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import {
  Box,
  IconButton,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Paper,
  Typography,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ImageIcon from '@mui/icons-material/Image';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import TableChartIcon from '@mui/icons-material/TableChart';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import TitleIcon from '@mui/icons-material/Title';
import { useUploadMedia } from '@/features/media/api/useMedia';
import toast from 'react-hot-toast';


interface RichTextEditorProps {
  value?: Record<string, unknown> | null;
  onChange?: (json: Record<string, unknown>) => void;
  error?: boolean;
  helperText?: string;
  minHeight?: number;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
  <Tooltip title={title} placement="top">
    <span>
      <IconButton
        size="small"
        onClick={onClick}
        disabled={disabled}
        sx={{
          borderRadius: 1,
          bgcolor: active ? 'primary.main' : 'transparent',
          color: active ? 'white' : 'text.primary',
          '&:hover': { bgcolor: active ? 'primary.dark' : 'action.hover' },
          width: 30,
          height: 30,
        }}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

const HeadingButton: React.FC<{ editor: Editor; level: 1 | 2 | 3 }> = ({ editor, level }) => (
  <ToolbarButton
    onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
    active={editor.isActive('heading', { level })}
    title={`Heading ${level}`}
  >
    <Typography variant="caption" fontWeight="bold" lineHeight={1}>
      H{level}
    </Typography>
  </ToolbarButton>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  error,
  helperText,
  minHeight = 400,
}) => {
  const { mutateAsync: uploadMedia } = useUploadMedia();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ horizontalRule: false }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'editor-image' },
      }),
      Youtube.configure({ controls: true, nocookie: true }),
      Table,
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      HorizontalRule,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: { class: 'tiptap-editor-content' },
    },
  });

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;
      try {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        await new Promise<void>((resolve) => { img.onload = () => resolve(); });
        URL.revokeObjectURL(img.src);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.85));
        if (!blob) return;
        const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp' });

        const data = await uploadMedia(webpFile);
        if ((data as any)?.url) {
          const altText = prompt('Enter image alt text (recommended for SEO):') || '';
          const caption = prompt('Enter image caption (optional):') || '';
          editor.chain().focus().setImage({ src: (data as any).url, alt: altText, title: caption }).run();
          toast.success('Image inserted');
        }
      } catch {
        toast.error('Failed to upload image');
      }
    };
    input.click();
  }, [editor, uploadMedia]);

  const openLinkDialog = () => {
    const prev = editor?.getAttributes('link').href || '';
    setLinkUrl(prev);
    setLinkDialogOpen(true);
  };

  const applyLink = () => {
    if (!editor) return;
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setLinkDialogOpen(false);
    setLinkUrl('');
  };

  const applyYoutube = () => {
    if (!editor || !youtubeUrl) return;
    editor.commands.setYoutubeVideo({ src: youtubeUrl });
    setYoutubeDialogOpen(false);
    setYoutubeUrl('');
  };

  if (!editor) return null;

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          border: error ? '1px solid #d32f2f' : '1px solid',
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          {/* Undo / Redo */}
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
            <UndoIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
            <RedoIcon fontSize="small" />
          </ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Headings */}
          <HeadingButton editor={editor} level={1} />
          <HeadingButton editor={editor} level={2} />
          <HeadingButton editor={editor} level={3} />
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive('paragraph')}
            title="Paragraph"
          >
            <TitleIcon fontSize="small" />
          </ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Inline formatting */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
            <FormatBoldIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
            <FormatItalicIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
            <FormatUnderlinedIcon fontSize="small" />
          </ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Lists */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
            <FormatListBulletedIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
            <FormatListNumberedIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
            <FormatQuoteIcon fontSize="small" />
          </ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Alignment */}
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
            <FormatAlignLeftIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
            <FormatAlignCenterIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
            <FormatAlignRightIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
            <FormatAlignJustifyIcon fontSize="small" />
          </ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {/* Link */}
          <ToolbarButton onClick={openLinkDialog} active={editor.isActive('link')} title="Insert Link">
            <InsertLinkIcon fontSize="small" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} title="Remove Link">
            <LinkOffIcon fontSize="small" />
          </ToolbarButton>

          {/* Image */}
          <ToolbarButton onClick={handleImageUpload} title="Insert Image">
            <ImageIcon fontSize="small" />
          </ToolbarButton>

          {/* YouTube */}
          <ToolbarButton onClick={() => setYoutubeDialogOpen(true)} title="Embed YouTube Video">
            <OndemandVideoIcon fontSize="small" />
          </ToolbarButton>

          {/* Table */}
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableChartIcon fontSize="small" />
          </ToolbarButton>

          {/* HR */}
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
            <HorizontalRuleIcon fontSize="small" />
          </ToolbarButton>
        </Box>

        {/* Editor Area */}
        <Box
          sx={{
            minHeight,
            px: 2,
            py: 1.5,
            '& .tiptap-editor-content': {
              minHeight,
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '1rem',
              lineHeight: 1.7,
              color: 'text.primary',
              '& h1': { fontSize: '2rem', fontWeight: 700, mt: 3, mb: 1.5 },
              '& h2': { fontSize: '1.5rem', fontWeight: 600, mt: 2.5, mb: 1 },
              '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 2, mb: 0.75 },
              '& p': { mb: 1.5 },
              '& ul, & ol': { pl: 3, mb: 1.5 },
              '& li': { mb: 0.5 },
              '& blockquote': {
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                pl: 2, py: 0.5, my: 2,
                color: 'text.secondary',
                fontStyle: 'italic',
                bgcolor: 'grey.50',
                borderRadius: '0 4px 4px 0',
              },
              '& a': { color: 'primary.main', textDecoration: 'underline' },
              '& code': {
                fontFamily: 'monospace',
                bgcolor: 'grey.100',
                px: 0.5, py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.875em',
              },
              '& pre': {
                bgcolor: '#1e1e1e',
                color: '#d4d4d4',
                p: 2, borderRadius: 1,
                overflowX: 'auto', mb: 2,
              },
              '& hr': { my: 3, border: 'none', borderTop: '2px solid', borderColor: 'divider' },
              '& img': { maxWidth: '100%', borderRadius: 1, my: 1 },
              '& figure': { my: 2, textAlign: 'center' },
              '& figcaption': { fontSize: '0.85rem', color: 'text.secondary', mt: 0.5 },
              '& table': { width: '100%', borderCollapse: 'collapse', mb: 2 },
              '& th, & td': {
                border: '1px solid', borderColor: 'divider',
                px: 1.5, py: 1, textAlign: 'left',
              },
              '& th': { bgcolor: 'grey.100', fontWeight: 600 },
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </Paper>

      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, ml: 1.5, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Insert Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="URL"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          {editor.isActive('link') && (
            <Button onClick={() => { editor.chain().focus().unsetLink().run(); setLinkDialogOpen(false); }} color="error">
              Remove Link
            </Button>
          )}
          <Button onClick={applyLink} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>

      {/* YouTube Dialog */}
      <Dialog open={youtubeDialogOpen} onClose={() => setYoutubeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Embed YouTube Video</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyYoutube(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYoutubeDialogOpen(false)}>Cancel</Button>
          <Button onClick={applyYoutube} variant="contained" disabled={!youtubeUrl}>Embed</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
