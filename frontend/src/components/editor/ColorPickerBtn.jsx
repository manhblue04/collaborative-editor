import { ColorPicker, Tooltip } from 'antd';

export default function ColorPickerBtn({ color, onChange, icon, title, presets }) {
  return (
    <ColorPicker
      value={color}
      onChange={(c) => onChange(c.toHexString())}
      size="small"
      presets={presets ? [{ label: 'Presets', colors: presets }] : undefined}
    >
      <Tooltip title={title} mouseEnterDelay={0.4}>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-base text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          style={{ borderBottom: `3px solid ${color || 'transparent'}` }}
        >
          {icon}
        </button>
      </Tooltip>
    </ColorPicker>
  );
}
