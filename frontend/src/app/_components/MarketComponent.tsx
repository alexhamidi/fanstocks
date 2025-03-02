"use client";

import { X } from "lucide-react";

export default function MarketComponent({
  title,
  items,
  newItem,
  deleteItemFunction,
  addNewFunction,
  setNewFunction,
  defaultItem,
  itemColumns, // Define column configuration for rendering items
  NewComponents,
}: {
  title: string;
  items: any[]; // Make generic to handle both Integration[] and Stock[]
  newItem: any;
  deleteItemFunction: (index: number) => void;
  addNewFunction: () => void;
  setNewFunction: React.Dispatch<React.SetStateAction<any>>; // Generic to handle both types
  defaultItem: any;
  itemColumns: {
    key: string;
    label: string;
    render?: (item: any) => React.ReactNode;
  }[]; // Column configuration
  NewComponents: React.ReactNode;
}) {
  return (
    <div className="my-4">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>

      {items.length > 0 && (
        <div className="w-full">
          <div className="grid grid-cols-2 text-gray-700 font-mono p-2 border-b border-zinc-400">
            {itemColumns.map((column) => (
              <span key={column.key}>{column.label}</span>
            ))}
          </div>
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-2 relative p-2 border-b border-zinc-400"
            >
              {itemColumns.map((column) => (
                <span key={column.key}>
                  {column.render ? column.render(item) : item[column.key]}
                </span>
              ))}
              <button
                onClick={() => deleteItemFunction(index)}
                className="absolute right-3 top-3"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {newItem ? (
        <div className="flex flex-col rounded mt-1 border border-zinc-400">
          <h4 className="text-lg  mt-2 text-center mb-2">
            New {title.slice(0, -1)}
          </h4>

          {NewComponents}

          {/* Action Buttons */}
          <div className="flex justify-end m-2">
            <button
              className="p-1 px-3 rounded"
              onClick={addNewFunction}
              disabled={!addNewFunction}
            >
              Add
            </button>
            <button
              className="p-1 px-3 rounded"
              onClick={() => setNewFunction(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="mt-2" onClick={() => setNewFunction(defaultItem)}>
          + Add {title.slice(0, -1)}
        </button>
      )}
    </div>
  );
}
