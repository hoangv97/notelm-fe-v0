"use client";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { GenerateNoteType } from "@/services/api/types/note-types";

type QuizTypesNumber = {
  multiple_choice: number;
  true_false: number;
  short_answer: number;
};

export type GenerationConfigFormValue = {
  generationLanguageEnabled: boolean;
  generationLanguage: string;
  flashcardNumberEnabled: boolean;
  flashcardNumber: number;
  quizTypesNumberEnabled: boolean;
  quizTypesNumber: QuizTypesNumber;
  userCustomInstructionTextEnabled: boolean;
  userCustomInstructionText: string;
};

export const DEFAULT_GENERATION_CONFIG_FORM_VALUE: GenerationConfigFormValue = {
  generationLanguageEnabled: true,
  generationLanguage: "English",
  flashcardNumberEnabled: true,
  flashcardNumber: 20,
  quizTypesNumberEnabled: true,
  quizTypesNumber: {
    multiple_choice: 6,
    true_false: 2,
    short_answer: 2,
  },
  userCustomInstructionTextEnabled: false,
  userCustomInstructionText: "",
};

const LANGUAGE_OPTIONS = [
  "English",
  "Vietnamese",
  "Spanish",
  "French",
  "German",
  "Japanese",
  "Korean",
  "Chinese",
];

type GenerationConfigPayload = Partial<{
  generationLanguage: string;
  flashcardNumber: number;
  quizTypesNumber: QuizTypesNumber;
  userCustomInstructionText: string;
}>;

export function buildGenerationConfigJson(
  value: GenerationConfigFormValue,
  selectedTypes: GenerateNoteType[]
) {
  const config: GenerationConfigPayload = {};
  const hasFlashcards = selectedTypes.includes("flashcards");
  const hasQuiz = selectedTypes.includes("quiz");

  if (
    (hasFlashcards || hasQuiz) &&
    value.generationLanguageEnabled &&
    value.generationLanguage
  ) {
    config.generationLanguage = value.generationLanguage;
  }

  if (hasFlashcards && value.flashcardNumberEnabled) {
    config.flashcardNumber = value.flashcardNumber;
  }

  if (hasQuiz && value.quizTypesNumberEnabled) {
    config.quizTypesNumber = value.quizTypesNumber;
  }

  if (
    (hasFlashcards || hasQuiz) &&
    value.userCustomInstructionTextEnabled &&
    value.userCustomInstructionText.trim()
  ) {
    config.userCustomInstructionText = value.userCustomInstructionText.trim();
  }

  return Object.keys(config).length > 0 ? JSON.stringify(config) : undefined;
}

type GenerationConfigFieldsProps = {
  selectedTypes: GenerateNoteType[];
  value: GenerationConfigFormValue;
  onChange: (value: GenerationConfigFormValue) => void;
};

export default function GenerationConfigFields({
  selectedTypes,
  value,
  onChange,
}: GenerationConfigFieldsProps) {
  const hasFlashcards = selectedTypes.includes("flashcards");
  const hasQuiz = selectedTypes.includes("quiz");

  if (!hasFlashcards && !hasQuiz) return null;

  const update = (next: Partial<GenerationConfigFormValue>) => {
    onChange({ ...value, ...next });
  };

  const updateQuizNumber = (key: keyof QuizTypesNumber, nextValue: string) => {
    onChange({
      ...value,
      quizTypesNumber: {
        ...value.quizTypesNumber,
        [key]: Math.max(0, Number(nextValue) || 0),
      },
    });
  };

  return (
    <Box
      sx={{
        mt: 2,
        pt: 2,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
        Custom generation fields
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={value.generationLanguageEnabled}
                onChange={(event) =>
                  update({ generationLanguageEnabled: event.target.checked })
                }
              />
            }
            label="Language"
            sx={{ minWidth: 132, mt: 0.5 }}
          />
          <FormControl fullWidth disabled={!value.generationLanguageEnabled}>
            <InputLabel id="generation-language-label">Language</InputLabel>
            <Select
              labelId="generation-language-label"
              label="Language"
              value={value.generationLanguage}
              onChange={(event) =>
                update({ generationLanguage: event.target.value })
              }
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <MenuItem key={language} value={language}>
                  {language}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {hasFlashcards && (
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={value.flashcardNumberEnabled}
                  onChange={(event) =>
                    update({ flashcardNumberEnabled: event.target.checked })
                  }
                />
              }
              label="Flashcards"
              sx={{ minWidth: 132, mt: 0.5 }}
            />
            <TextField
              label="Flashcard number"
              type="number"
              value={value.flashcardNumber}
              onChange={(event) =>
                update({
                  flashcardNumber: Math.max(1, Number(event.target.value) || 1),
                })
              }
              fullWidth
              disabled={!value.flashcardNumberEnabled}
              slotProps={{
                htmlInput: { min: 1 },
              }}
            />
          </Box>
        )}

        {hasQuiz && (
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={value.quizTypesNumberEnabled}
                  onChange={(event) =>
                    update({ quizTypesNumberEnabled: event.target.checked })
                  }
                />
              }
              label="Quiz number"
              sx={{ minWidth: 132, mt: 0.5 }}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1,
                flex: 1,
              }}
            >
              <TextField
                label="Multiple choice"
                type="number"
                value={value.quizTypesNumber.multiple_choice}
                onChange={(event) =>
                  updateQuizNumber("multiple_choice", event.target.value)
                }
                disabled={!value.quizTypesNumberEnabled}
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <TextField
                label="True/false"
                type="number"
                value={value.quizTypesNumber.true_false}
                onChange={(event) =>
                  updateQuizNumber("true_false", event.target.value)
                }
                disabled={!value.quizTypesNumberEnabled}
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <TextField
                label="Short answer"
                type="number"
                value={value.quizTypesNumber.short_answer}
                onChange={(event) =>
                  updateQuizNumber("short_answer", event.target.value)
                }
                disabled={!value.quizTypesNumberEnabled}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Box>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={value.userCustomInstructionTextEnabled}
                onChange={(event) =>
                  update({
                    userCustomInstructionTextEnabled: event.target.checked,
                  })
                }
              />
            }
            label="Instruction"
            sx={{ minWidth: 132, mt: 0.5 }}
          />
          <TextField
            label="User custom instruction"
            value={value.userCustomInstructionText}
            onChange={(event) =>
              update({
                userCustomInstructionText: event.target.value.slice(0, 5000),
              })
            }
            fullWidth
            multiline
            minRows={3}
            disabled={!value.userCustomInstructionTextEnabled}
            helperText={`${value.userCustomInstructionText.length}/5000`}
            slotProps={{ htmlInput: { maxLength: 5000 } }}
          />
        </Box>
      </Box>
    </Box>
  );
}
