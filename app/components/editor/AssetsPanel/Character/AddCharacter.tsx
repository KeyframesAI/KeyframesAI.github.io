"use client";

import CharacterEditor from "./CharacterEditor";
import { useState } from "react";
import Image from 'next/image';

export default function AddCharacter() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="px-1">
      <label
          onClick={handleOpenModal}
          className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
      >
          <Image
              alt="Add Project"
              className="Black"
              height={12}
              width={12}
              src="https://www.svgrepo.com/show/535560/person.svg"
          />
          <span className="text-xs">Add Character</span>
      </label>

      <CharacterEditor
        charId=""
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        contentLabel="My Modal Content"
      />
    </div>
  );
}
