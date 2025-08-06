"use client";

import MotionVideoUploader from "../Character/MotionVideoUploader";
import { getFile, useAppDispatch, useAppSelector } from "../../../../store";
import { setMediaFiles } from "../../../../store/slices/projectSlice";
import { storeFile } from "../../../../store";
import { categorizeFile } from "../../../../utils/utils";
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useState } from "react";



export default function AddMotionVideo({ charId }: { charId: string }) {

  const { mediaFiles } = useAppSelector((state) => state.projectState);
  const dispatch = useAppDispatch();


  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  
  return (
      <div
      >
          <label
              className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-col items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium sm:text-base py-2 px-2"
          >
              <Image
                  alt="Add Project"
                  className="Black"
                  height={12}
                  width={12}
                  src="https://www.svgrepo.com/show/513803/add.svg"
              />
              {/* <span className="text-xs">Add Media</span> */}
              <button
                  onClick={handleOpenModal}
              >
              </button>
          </label>
          
          <MotionVideoUploader
            charId={charId}
            isOpen={isModalOpen}
            onRequestClose={handleCloseModal}
            contentLabel="My Modal Content"
          />
      </div>
  );
}

