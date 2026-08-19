'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Typography,
  Paper,
  Tooltip,
  Collapse,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import QuizIcon from '@mui/icons-material/Quiz';

export interface FaqItem {
  id?: string;
  question: string;
  answer: string;
  sortOrder: number;
}

interface FaqManagerProps {
  value: FaqItem[];
  onChange: (faqs: FaqItem[]) => void;
}

const emptyFaq = (): FaqItem => ({
  question: '',
  answer: '',
  sortOrder: 0,
});

export const FaqManager: React.FC<FaqManagerProps> = ({ value, onChange }) => {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const addFaq = () => {
    const updated = [...value, { ...emptyFaq(), sortOrder: value.length }];
    onChange(updated);
  };

  const removeFaq = (index: number) => {
    const updated = value.filter((_, i) => i !== index).map((f, i) => ({ ...f, sortOrder: i }));
    onChange(updated);
    const newCollapsed = { ...collapsed };
    delete newCollapsed[index];
    setCollapsed(newCollapsed);
  };

  const updateFaq = (index: number, field: keyof FaqItem, val: string | number) => {
    const updated = value.map((f, i) => (i === index ? { ...f, [field]: val } : f));
    onChange(updated);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...value];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated.map((f, i) => ({ ...f, sortOrder: i })));
  };

  const moveDown = (index: number) => {
    if (index === value.length - 1) return;
    const updated = [...value];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated.map((f, i) => ({ ...f, sortOrder: i })));
  };

  const toggleCollapse = (index: number) => {
    setCollapsed(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <QuizIcon fontSize="small" />
          {value.length > 0
            ? `${value.length} FAQ${value.length > 1 ? 's' : ''} — will generate FAQPage JSON-LD structured data`
            : 'Add FAQs to generate FAQPage structured data (boosts SEO)'}
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={addFaq}
          variant="outlined"
          size="small"
          sx={{ borderRadius: 2 }}
        >
          Add FAQ
        </Button>
      </Box>

      {value.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          FAQs are optional. When added, they will be displayed in a FAQ section below the blog post and automatically
          generate <strong>FAQPage JSON-LD</strong> structured data for rich results in Google Search.
        </Alert>
      )}

      {value.map((faq, index) => (
        <Paper
          key={index}
          variant="outlined"
          sx={{
            mb: 1.5,
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: 2 },
          }}
        >
          {/* FAQ Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 1,
              bgcolor: 'grey.50',
              borderBottom: collapsed[index] ? 'none' : '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Drag handle (visual only for UX) */}
            <DragIndicatorIcon sx={{ color: 'text.disabled', cursor: 'grab', fontSize: 20 }} />

            {/* FAQ number */}
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </Box>

            {/* Question preview */}
            <Typography
              variant="body2"
              fontWeight={500}
              sx={{
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: faq.question ? 'text.primary' : 'text.disabled',
              }}
            >
              {faq.question || 'New FAQ Question...'}
            </Typography>

            {/* Move buttons */}
            <Tooltip title="Move Up">
              <span>
                <IconButton size="small" onClick={() => moveUp(index)} disabled={index === 0}>
                  <ExpandLessIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move Down">
              <span>
                <IconButton size="small" onClick={() => moveDown(index)} disabled={index === value.length - 1}>
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {/* Collapse */}
            <Tooltip title={collapsed[index] ? 'Expand' : 'Collapse'}>
              <IconButton size="small" onClick={() => toggleCollapse(index)}>
                {collapsed[index] ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Delete */}
            <Tooltip title="Remove FAQ">
              <IconButton size="small" onClick={() => removeFaq(index)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* FAQ Fields */}
          <Collapse in={!collapsed[index]}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Question"
                placeholder="e.g. Rewa mein plot kaise khareed sakte hain?"
                fullWidth
                size="small"
                value={faq.question}
                onChange={(e) => updateFaq(index, 'question', e.target.value)}
                inputProps={{ maxLength: 500 }}
                helperText={`${faq.question.length}/500`}
                FormHelperTextProps={{ sx: { textAlign: 'right' } }}
              />
              <TextField
                label="Answer"
                placeholder="Detailed answer..."
                fullWidth
                size="small"
                multiline
                rows={3}
                value={faq.answer}
                onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                inputProps={{ maxLength: 5000 }}
                helperText={`${faq.answer.length}/5000`}
                FormHelperTextProps={{ sx: { textAlign: 'right' } }}
              />
            </Box>
          </Collapse>
        </Paper>
      ))}

      {value.length > 0 && (
        <Button
          startIcon={<AddIcon />}
          onClick={addFaq}
          variant="text"
          size="small"
          sx={{ mt: 0.5 }}
        >
          Add Another FAQ
        </Button>
      )}
    </Box>
  );
};
