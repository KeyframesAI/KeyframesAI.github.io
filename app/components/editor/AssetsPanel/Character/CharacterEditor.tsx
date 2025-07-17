"use client";

import CharacterModal from "./Modal";
import { useState } from "react";

export default function CharacterEditor() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="">
      <button
        className="px-4 py-2 text-white bg-blue-500 rounded-md ml "
        onClick={handleOpenModal}
      >
        Open Modal
      </button>

      <CharacterModal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        contentLabel="My Modal Content"
      />
    </div>
  );
}
