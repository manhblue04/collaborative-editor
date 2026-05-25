import { Input, Button } from 'antd';
import {
  SearchOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import useSearchReplace from '../../hooks/useSearchReplace';

export default function SearchReplaceBar({ editor, onClose }) {
  const {
    searchQuery,
    setSearchQuery,
    replaceQuery,
    setReplaceQuery,
    matches,
    currentIndex,
    goToNext,
    goToPrev,
    replace,
    replaceAll,
  } = useSearchReplace(editor);

  return (
    <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <Input
        size="small"
        prefix={<SearchOutlined className="text-gray-400" />}
        placeholder="Find..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="!w-44"
        autoFocus
      />
      <span className="text-xs text-gray-400 min-w-[3rem] text-center">
        {matches.length > 0 ? `${currentIndex + 1} of ${matches.length}` : matches.length}
      </span>
      <button
        type="button"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
        onClick={goToPrev}
        disabled={matches.length === 0}
      >
        <UpOutlined className="text-xs" />
      </button>
      <button
        type="button"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
        onClick={goToNext}
        disabled={matches.length === 0}
      >
        <DownOutlined className="text-xs" />
      </button>
      <Input
        size="small"
        placeholder="Replace..."
        value={replaceQuery}
        onChange={(e) => setReplaceQuery(e.target.value)}
        className="!w-36"
      />
      <Button size="small" onClick={replace} disabled={matches.length === 0}>
        Replace
      </Button>
      <Button size="small" onClick={replaceAll} disabled={matches.length === 0}>
        All
      </Button>
      <button
        type="button"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        onClick={onClose}
      >
        <CloseOutlined className="text-xs" />
      </button>
    </div>
  );
}
