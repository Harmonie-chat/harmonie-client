import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from './Separator'

const meta: Meta<typeof Separator> = {
  title: 'Components/Separator',
  component: Separator,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-6 w-80">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Separator>

export const Default: Story = {}

export const WithLabel: Story = {
  args: { label: 'ou' },
}
