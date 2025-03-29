import React from "react";

interface ErrorDisplayProps {
  errorMessage: string;
}

/**
 * A reusable component for displaying error messages
 * @param errorMessage The error message to display
 */
export default function ErrorDisplay({ errorMessage }: ErrorDisplayProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Error</h2>
      <div className="bg-white shadow-md rounded p-4 overflow-auto">
        <p className="text-red-500">{errorMessage}</p>
      </div>
    </div>
  );
}
