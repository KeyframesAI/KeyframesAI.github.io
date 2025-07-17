"use client";

import CharacterEditor from "./CharacterEditor";
import { useState } from "react";
import Image from 'next/image';

export default function EditCharacter({ charId }: { charId: string }) {
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
          className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-col items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium sm:text-base py-2 px-2"
      >
          <Image
              alt="Add Project"
              className="Black"
              height={12}
              width={12}
              src="https://www.svgrepo.com/show/521620/edit.svg"
          />
          {/* <span className="text-xs">Add Media</span> */}
          <button
              onClick={handleOpenModal}
          >
          </button>
      </label>

      <CharacterEditor
        charId={charId}
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        contentLabel="My Modal Content"
      />
    </div>
  );
}
