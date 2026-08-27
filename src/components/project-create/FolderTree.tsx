import type { ReactNode } from "react";
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

import type { Folder as FolderType } from "../../api/folders";

export interface FolderNode {
  folder: FolderType;
  children: FolderNode[];
}

interface FolderTreeProps {
  folders: FolderType[];

  renderFolder?: (
    folder: FolderType,
    node: FolderNode,
    level: number
  ) => ReactNode;

  defaultExpanded?: boolean;

  selectable?: boolean;

  selectedFolderIds?: number[];

  onFolderSelect?: (
    folder: FolderType
  ) => void;
}

export default function FolderTree({
  folders,
  renderFolder,
  defaultExpanded = true,
  selectable = false,
  selectedFolderIds = [],
  onFolderSelect,
}: FolderTreeProps) {
  const [expanded, setExpanded] =
    useState<Set<number>>(
      () => new Set(
        defaultExpanded
          ? folders.map(
              (folder) => folder.fid
            )
          : []
      )
    );

  /*
   * ----------------------------------------
   * Build hierarchy
   * ----------------------------------------
   */

  const buildTree = (): FolderNode[] => {
    const map = new Map<
      number,
      FolderNode
    >();

    folders.forEach((folder) => {
      map.set(folder.fid, {
        folder,
        children: [],
      });
    });

    const roots: FolderNode[] = [];

    folders.forEach((folder) => {
      const node = map.get(folder.fid);

      if (!node) {
        return;
      }

      /*
       * Root
       */

      if (
        !folder.pid ||
        folder.pid === 0 ||
        !map.has(folder.pid)
      ) {
        roots.push(node);
        return;
      }

      /*
       * Child
       */

      const parent = map.get(
        folder.pid
      );

      if (parent) {
        parent.children.push(node);
      }
    });

    return roots;
  };

  const tree = buildTree();

  /*
   * ----------------------------------------
   * Toggle folder
   * ----------------------------------------
   */

  function toggle(folderId: number) {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }

      return next;
    });
  }

  /*
   * ----------------------------------------
   * Render
   * ----------------------------------------
   */

  function renderNode(
    node: FolderNode,
    level: number
  ): ReactNode {
    const folder = node.folder;

    const hasChildren =
      node.children.length > 0;

    const isExpanded =
      expanded.has(folder.fid);

    const selected =
      selectedFolderIds.includes(
        folder.fid
      );

    return (
      <div key={folder.fid}>
        <div
          className={`
            flex
            items-center
            gap-2
            rounded-lg
            px-2
            py-2
            transition
            ${
              selected
                ? "bg-blue-50"
                : "hover:bg-gray-50"
            }
          `}
          style={{
            paddingLeft: `${
              8 + level * 24
            }px`,
          }}
        >
          {/* Expand */}

          {hasChildren ? (
            <button
              type="button"
              onClick={() =>
                toggle(folder.fid)
              }
              className="
                flex
                h-6
                w-6
                shrink-0
                items-center
                justify-center
                rounded
                text-gray-400
                hover:bg-gray-100
                hover:text-gray-700
              "
              aria-label={
                isExpanded
                  ? "Collapse folder"
                  : "Expand folder"
              }
            >
              {isExpanded ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </button>
          ) : (
            <span className="h-6 w-6 shrink-0" />
          )}

          {/* Folder icon */}

          {hasChildren && isExpanded ? (
            <FolderOpen
              size={18}
              className="shrink-0 text-blue-600"
            />
          ) : (
            <Folder
              size={18}
              className="shrink-0 text-blue-500"
            />
          )}

          {/* Custom content */}

          <div
            className="min-w-0 flex-1"
            onClick={() => {
              if (
                selectable &&
                onFolderSelect
              ) {
                onFolderSelect(folder);
              }
            }}
          >
            {renderFolder ? (
              renderFolder(
                folder,
                node,
                level
              )
            ) : (
              <>
                <p className="truncate text-sm font-medium text-gray-800">
                  {folder.fname}
                </p>

                {folder.fnamedesc && (
                  <p className="truncate text-xs text-gray-500">
                    {folder.fnamedesc}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Children */}

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(
              (child) =>
                renderNode(
                  child,
                  level + 1
                )
            )}
          </div>
        )}
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
        <Folder
          size={28}
          className="mx-auto text-gray-300"
        />

        <p className="mt-2 text-sm text-gray-500">
          No folders found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.map((node) =>
        renderNode(node, 0)
      )}
    </div>
  );
}