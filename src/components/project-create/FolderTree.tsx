
import { useMemo, type ReactNode } from "react";

import type { Folder } from "../../api/folders";

export interface FolderNode {
  folder: Folder;
  children: FolderNode[];
}

interface FolderTreeProps {
  folders: Folder[];
  renderFolder: (
    node: FolderNode,
    level: number
  ) => ReactNode;
  className?: string;
}

function buildFolderTree(folders: Folder[]): FolderNode[] {
  const folderMap = new Map<number, FolderNode>();

  folders.forEach((folder) => {
    folderMap.set(folder.fid, {
      folder,
      children: [],
    });
  });

  const roots: FolderNode[] = [];

  folders.forEach((folder) => {
    const node = folderMap.get(folder.fid);

    if (!node) {
      return;
    }

    // Treat folders without a valid parent as root folders.
    if (
      !folder.pid ||
      folder.pid === 0 ||
      !folderMap.has(folder.pid)
    ) {
      roots.push(node);
      return;
    }

    const parent = folderMap.get(folder.pid);

    if (parent) {
      parent.children.push(node);
    }
  });

  return roots;
}

export default function FolderTree({
  folders,
  renderFolder,
  className = "space-y-3",
}: FolderTreeProps) {
  const folderTree = useMemo(
    () => buildFolderTree(folders),
    [folders]
  );

  function renderNode(
    node: FolderNode,
    level: number
  ): ReactNode {
    return (
      <div key={node.folder.fid}>
        {renderFolder(node, level)}

        {node.children.length > 0 && (
          <div className="mt-3 space-y-3">
            {node.children.map((child) =>
              renderNode(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  }

  if (folderTree.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {folderTree.map((node) =>
        renderNode(node, 0)
      )}
    </div>
  );
}