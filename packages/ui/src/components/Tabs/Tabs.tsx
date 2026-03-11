export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const Tabs = ({ tabs, activeTab, onChange }: TabsProps) => (
  <div className="flex gap-1 border-b border-border-2">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={[
          'px-4 py-2 text-sm font-body border-b-2 -mb-px transition-colors cursor-pointer',
          activeTab === tab.id
            ? 'border-primary text-primary font-medium'
            : 'border-transparent text-text-3 hover:text-text-2',
        ].join(' ')}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
