/**
 * Input.figma.tsx — Figma Code Connect binding.
 */

import { figma } from '@figma/code-connect'

import { Input } from './Input'

figma.connect(
  Input,
  'https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines?node-id=2857-32277',
  {
    props: {
      label: figma.string('Label'),
      helperText: figma.string('Supporting text'),
      error: figma.string('Error'),
      state: figma.enum('State', {
        Default: 'default',
        Focused: 'focused',
        Typing: 'typing',
        Complete: 'complete',
        Error: 'error',
        Disabled: 'disabled',
        'Disabled-Filled': 'disabled-filled',
        'Disabled-Empty': 'disabled-empty',
      }),
      clearable: figma.boolean('Clearable'),
      required: figma.boolean('Required'),
      optional: figma.boolean('Optional'),
      disabled: figma.boolean('Disabled'),
      placeholder: figma.string('Placeholder'),
    },
    example: ({ label, helperText, error, state, clearable, required, optional, disabled, placeholder }) => (
      <Input
        label={label}
        helperText={helperText}
        error={error}
        state={state}
        clearable={clearable}
        required={required}
        optional={optional}
        disabled={disabled}
        placeholder={placeholder}
      />
    ),
  },
)
