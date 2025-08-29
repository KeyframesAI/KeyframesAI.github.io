"use client";

import { listFiles, deleteFile, useAppSelector, storeFile, getFile } from '@/app/store';
import { setMediaFiles, setFilesID, setActiveAnimationIndex, setActiveFrameIndex, setAnimations, setHistory } from '@/app/store/slices/projectSlice';
import { MediaFile, UploadedFile, Frame } from '@/app/types';
import { useAppDispatch } from '@/app/store';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';

import {saveMediaFile, getUpdatedHistory} from "../../../../utils/callHuggingface";

export default function KeyframesList() {
    const projectState = useAppSelector((state) => state.projectState);
    const { mediaFiles, filesID, keyframes, activeAnimationIndex, activeFrameIndex, animations, fps, resolution } = projectState;
    const dispatch = useAppDispatch();
    const [files, setFiles] = useState<UploadedFile[]>([]);

    useEffect(() => {
        let mounted = true;

        const fetchFiles = async () => {
            try {
                const storedFilesArray: UploadedFile[] = [];

                for (const fileId of keyframes || []) {
                    const file = await getFile(fileId);
                    if (file && mounted) {
                        storedFilesArray.push({
                            file: file,
                            id: fileId,
                            src: URL.createObjectURL(file),
                        });
                    }
                }

                if (mounted) {
                    setFiles(storedFilesArray);
                }
            } catch (error) {
                toast.error("Error fetching files");
                console.error("Error fetching files:", error);
            }
        };

        fetchFiles();

        // Cleanup
        return () => {
            mounted = false;
        };
    }, [keyframes]);

    const onDeleteMedia = async (id: string) => {
        const onUpdateMedia = mediaFiles.filter(f => f.fileId !== id);
        dispatch(setMediaFiles(onUpdateMedia));
        dispatch(setFilesID(keyframes?.filter(f => f !== id) || []));
        await deleteFile(id);
    };
    
    const addToAnimation = async (fileId: string, index: number, order: number) => {
        if (index!=-1 && animations.length==0) {
            await addToNewAnimation(fileId);
            return [];
        }
    
        const file = await getFile(fileId);
        const updatedFiles = [...filesID || []];
        
        const frames = index >= 0 && index < animations.length ? [...animations[index].frames] : [];
        
        const newFrame: Frame = {
            id: crypto.randomUUID(),
            order: order,
            image: await saveMediaFile(file, order, updatedFiles, fps, resolution),
            thumbnail: await saveMediaFile(file, order, updatedFiles, fps, resolution),
            reference: await saveMediaFile(file, order, updatedFiles, fps, resolution),
            isKeyframe: true,
            duration: 1,
        };
              
        if (frames.length==0 || activeFrameIndex > frames.length) {
            frames.push(newFrame);
        } else {
            frames.splice(order, 0, newFrame);
            for (var i = order+1; i<frames.length; i++) {
                frames[i] = {...frames[i], order: frames[i].order+1};
            }
        }
        
        if (index >= 0 && index < animations.length) {
            dispatch(setHistory(getUpdatedHistory(projectState)));
            dispatch(setAnimations(animations.map(ani =>
                ani.id === animations[index].id ? { ...ani, frames: [...frames] } : ani
            )));
        }
        dispatch(setFilesID(updatedFiles));
        
        return frames;
    };
    
    const addToNewAnimation = async (fileId: string) => {
        console.log(fileId);
        dispatch(setHistory(getUpdatedHistory(projectState)));
        
        const updated = [...animations];
        const newAnimation = {
            id: crypto.randomUUID(),
            name: "",
            frames: await addToAnimation(fileId, -1, 0),
            order: 0,
            referenceOpacity: 0,
            onionSkinning: 0,
            showPose: false,
            hidden: false,
        };
        updated.push(newAnimation);
        dispatch(setAnimations(updated));
        
        dispatch(setActiveAnimationIndex(animations.length));
        dispatch(setActiveFrameIndex(0));
        
    };

    return (
        <>
            {files.length > 0 && (
                <div className="space-y-4">
                    {files.map((mediaFile) => (
                        <div key={mediaFile.id} className="border border-gray-700 p-3 rounded bg-black bg-opacity-30 hover:bg-opacity-40 transition-all">
                            <div className="block items-center justify-between">
                                <div className="py-1 px-1 text-sm flex-1 truncate" title={mediaFile.file.name}>
                                    <Image
                                        alt="Add Project"
                                        className="Black"
                                        height={150}
                                        width={150}
                                        src={mediaFile.src ? mediaFile.src : ""}
                                    />
                                </div>
                                
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    
                                
                                    <div title="Add to New Layer">
                                        <label
                                            className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-col items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium sm:text-base py-2 px-2"
                                        >
                                            <Image
                                                alt="Add Project"
                                                className="Black"
                                                height={12}
                                                width={12}
                                                src="https://www.svgrepo.com/show/449161/new-window.svg"
                                            />
                                            {/* <span className="text-xs">Add Media</span> */}
                                            <button
                                                onClick={() => addToNewAnimation(mediaFile.id)}
                                            >
                                            </button>
                                        </label>
                                    </div>
                                    
                                    
                                    <div title="Add to Selected Layer">
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
                                                onClick={() => addToAnimation(mediaFile.id, activeAnimationIndex, activeFrameIndex+1)}
                                            >
                                            </button>
                                        </label>
                                    </div>
                                    
                                    <div className="py-1 px-1 text-sm flex-1 truncate" title={mediaFile.file.name}>
                                        {mediaFile.file.name}
                                    </div>
                                    
                                    <button
                                        onClick={() => onDeleteMedia(mediaFile.id)}
                                        className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                                        aria-label="Delete file"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    
                                </div>
                                
                                
                                
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}