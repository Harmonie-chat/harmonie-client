import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const COUNTRY_OPTIONS = [
  { value: 'fr', label: 'France' },
  { value: 'us', label: 'United States' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
];

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Member', label: 'Member' },
];

const meta: Meta<typeof Select> = {
  title: 'Forms/Select',
  component: Select,
  tags: ['autodocs'],
  args: {
    options: COUNTRY_OPTIONS,
    label: 'Country',
    value: 'fr',
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Role',
    options: ROLE_OPTIONS,
    value: 'Admin',
  },
};

export const WithoutLabel: Story = {
  args: {
    label: undefined,
    options: ROLE_OPTIONS,
    value: 'Member',
  },
};

export const WithError: Story = {
  args: {
    label: 'Country',
    options: COUNTRY_OPTIONS,
    value: '',
    error: 'Please select a valid country.',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Country',
    options: COUNTRY_OPTIONS,
    value: 'fr',
    disabled: true,
  },
};

export const Interactive: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState('Admin');
    return (
      <div className="flex flex-col gap-6 p-6 max-w-xs">
        <Select label="Role" options={ROLE_OPTIONS} value={value} onChange={setValue} />
        <p className="text-sm text-text-2">
          Selected: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [defaultVal, setDefaultVal] = useState('fr');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [smVal, setSmVal] = useState('Admin');
    return (
      <div className="flex flex-col gap-6 p-6 max-w-xs">
        <Select
          label="Default size"
          options={COUNTRY_OPTIONS}
          size="default"
          value={defaultVal}
          onChange={setDefaultVal}
        />
        <Select
          label="Small size"
          options={ROLE_OPTIONS}
          size="sm"
          value={smVal}
          onChange={setSmVal}
        />
      </div>
    );
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 max-w-xs">
      <Select label="Default" options={COUNTRY_OPTIONS} value="fr" />
      <Select
        label="With error"
        options={COUNTRY_OPTIONS}
        value=""
        error="This field is required."
      />
      <Select label="Disabled" options={COUNTRY_OPTIONS} value="fr" disabled />
    </div>
  ),
};
