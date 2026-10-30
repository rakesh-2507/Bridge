
import { useState } from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { ProjectFolder } from "../../api/projects";

interface FolderTreeProps {
  folders: ProjectFolder[];
  onFolderClick: (folder: ProjectFolder) => void;
}

interface FolderTreeItemProps {
  folder: ProjectFolder;
  level: number;
  onFolderClick: (folder: ProjectFolder) => void;
  isLast: boolean;
  ancestorLastItems: boolean[];
}

function folderContainsFiles(folder: ProjectFolder): boolean {
  const ownFileCount = Number(folder.fileCount ?? 0);

  if (ownFileCount > 0) return true;

  return (folder.children ?? []).some((child) =>
    folderContainsFiles(child)
  );
}

function FolderTreeItem({
  folder,
  level,
  onFolderClick,
  isLast,
  ancestorLastItems,
}: FolderTreeItemProps) {
  const [expanded, setExpanded] = useState(true);

  const children = folder.children ?? [];
  const hasChildren = children.length > 0;
  const hasFiles = (folder.fileCount ?? 0) > 0;
  const containsFiles = folderContainsFiles(folder);
  const lineColor = containsFiles
    ? "border-primary/60"
    : "border-slate-300 dark:border-slate-700";

  return (
    <div className="relative">
      {/* Vertical lines belonging to ancestor folders */}
      {ancestorLastItems.map((ancestorIsLast, index) =>
        ancestorIsLast ? null : (
          <span
            key={index}
            aria-hidden="true"
            className={`absolute bottom-0 top-0 w-px border-l ${lineColor}`}
            style={{ left: `${index * 24 + 19}px` }}
          />
        )
      )}

      {/* Connector for this folder */}
      {level > 0 && (
        <>
          <span
            aria-hidden="true"
            className={`absolute top-0 w-px border-l ${lineColor}`}
            style={{
              left: `${(level - 1) * 24 + 19}px`,
              height: isLast ? "20px" : "100%",
            }}
          />
          <span
            aria-hidden="true"
            className={`absolute top-5 w-6 border-t ${lineColor}`}
            style={{
              left: `${(level - 1) * 24 + 19}px`,
            }}
          />
        </>
      )}

      {/* Folder row */}
      <div
        className="group relative flex min-w-0 items-center gap-2  rounded-tl-xl rounded-br-xl   pr-2 transition hover:bg-primary/5 dark:hover:bg-primary/10"
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((previous) => !previous)}
            aria-label={expanded ? "Collapse folder" : "Expand folder"}
            className="z-10 shrink-0 rounded p-1 text-slate-500 hover:bg-primary/10 hover:text-primary"
          >
            {expanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onFolderClick(folder)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {hasChildren ? (
            <FolderOpen
              size={19}
              className="shrink-0 text-primary"
            />
          ) : hasFiles ? (
            <Folder
              size={19}
              className="shrink-0 text-primary"
            />
          ) : (
            <Folder
              size={19}
              className="shrink-0 text-slate-400 dark:text-slate-500"
            />
          )}

          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 group-hover:text-primary dark:text-slate-100">
            {folder.fname}
          </span>

          {hasChildren && (
            <span className="shrink-0 text-xs text-slate-400">
              {children.length} subfolders
            </span>
          )}

          {hasFiles && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {folder.fileCount ?? 0} files
            </span>
          )}
        </button>
      </div>

      {/* Child folders */}
      {hasChildren && expanded && (
        <div className="relative">
          {children.map((child, index) => (
            <FolderTreeItem
              key={child.fid}
              folder={child}
              level={level + 1}
              onFolderClick={onFolderClick}
              isLast={index === children.length - 1}
              ancestorLastItems={[...ancestorLastItems, isLast]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  onFolderClick,
}: FolderTreeProps) {
  if (!folders.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No folders available
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {folders.map((folder, index) => (
        <FolderTreeItem
          key={folder.fid}
          folder={folder}
          level={0}
          onFolderClick={onFolderClick}
          isLast={index === folders.length - 1}
          ancestorLastItems={[]}
        />
      ))}
    </div>
  );
}
