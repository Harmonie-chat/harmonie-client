import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { LanguageSelector } from './LanguageSelector'

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
]

const meta: Meta<typeof LanguageSelector> = {
  title: 'Components/LanguageSelector',
  component: LanguageSelector,
  tags: ['autodocs'],
  args: {
    languages: LANGUAGES,
    currentLang: 'fr',
    onChange: () => {},
  },
}

export default meta
type Story = StoryObj<typeof LanguageSelector>

export const Default: Story = {}

export const EnglishSelected: Story = {
  args: { currentLang: 'en' },
}

const InteractiveRender = () => {
  const [lang, setLang] = useState('fr')
  return (
    <div className="p-6 flex items-start gap-4">
      <LanguageSelector languages={LANGUAGES} currentLang={lang} onChange={setLang} />
      <span className="font-body text-sm text-text-2 mt-1.5">
        Langue active : <strong>{lang}</strong>
      </span>
    </div>
  )
}

export const Interactive: Story = {
  render: () => <InteractiveRender />,
}
