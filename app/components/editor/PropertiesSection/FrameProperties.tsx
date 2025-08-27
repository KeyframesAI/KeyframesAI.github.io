"use client";

import { useAppSelector, deleteFile } from '../../../store';
import { setActiveAnimationIndex, setActiveFrameIndex, setAnimations, setFilesID } from '../../../store/slices/projectSlice';
import { MediaFile } from '../../../types';
import { useAppDispatch, storeFile, getFile } from '../../../store';

import Image from 'next/image';
import ToggleSwitch from "./components/ToggleSwitch";
import toast from 'react-hot-toast';

import { useState, useEffect } from 'react';

import { Scatter } from "react-chartjs-2";
import "chartjs-plugin-dragdata";
import "chart.js/auto";

import {generateFrame, saveMediaFile} from "../../../utils/callHuggingface";


export default function FrameProperties() {
    const { activeAnimationIndex, activeFrameIndex, animations, characters, fps, filesID, resolution } = useAppSelector((state) => state.projectState);
    const animation = animations[activeAnimationIndex];
    
    const frame = animation.frames[activeFrameIndex];
    //console.log(animation, frame);
    const dispatch = useAppDispatch();
    
    const [deleteFrom, setDeleteFrom] = useState(activeFrameIndex);
    const [deleteTo, setDeleteTo] = useState(activeFrameIndex);
    useEffect(() => {
        setDeleteFrom(activeFrameIndex);
        setDeleteTo(activeFrameIndex);

    }, [activeFrameIndex]);
    
    if (!animation) return null;
    
    
    const onUpdateFrame = (id: string, updates: Partial<Frame>) => {
        var updatedFrames = animation.frames.map(fr =>
            fr.id === id ? { ...fr, ...updates } : fr
        );
    
        dispatch(setAnimations(animations.map(ani =>
            ani.id === animation.id ? { ...ani, frames: updatedFrames } : ani
        )));
    };
    
    const onUpdateAllFrames = (id: string, updates: Partial<Frame>) => {
        var updatedFrames = animation.frames.map(fr => true ? { ...fr, ...updates, thumbnail: {...fr.thumbnail, ...updates.thumbnail} } : fr);
        
        dispatch(setAnimations(animations.map(ani =>
            ani.id === id ? { ...ani, frames: updatedFrames } : ani
        )));
    };
    
    const onUpdateAnimation = (id: string, updates: Partial<Animation>) => {
        //console.log(updates);
    
        dispatch(setAnimations(animations.map(ani =>
            ani.id === id ? { ...ani, ...updates } : ani
        )));
    };
    
    const onDeleteAni = async (id: string) => {
        console.log("delete", id);
        const updated = animations.filter(f => f.id !== id);
        for (const frame of animation.frames) {
            deleteFile(frame.image.fileId);
            deleteFile(frame.thumbnail.fileId);
            if (frame.reference) {
                deleteFile(frame.reference.fileId);
            }
        }
        if (updated.length < animations.length) {
          dispatch(setActiveAnimationIndex(0));
          dispatch(setActiveFrameIndex(0));
          dispatch(setAnimations(updated));
        }
        console.log(animations);
    };
    
    const onDeleteFrame = async (id: string) => {
        console.log("delete", id);
        const updated = animation.frames.filter(f => f.id !== id);
        deleteFile(frame.image.fileId);
        deleteFile(frame.thumbnail.fileId);
        if (frame.reference) {
            deleteFile(frame.reference.fileId);
        }
        
        if (updated.length < animation.frames.length) {
          dispatch(setActiveFrameIndex(0));
          
          dispatch(setAnimations(animations.map(ani =>
              ani.id === animation.id ? { ...ani, frames: updated } : ani
          )));
        }
        console.log(animation);
    };
    
    const onDeleteFrames = async () => {
        const updated = [...animation.frames];
        updated.splice(deleteFrom, deleteTo-deleteFrom+1);
        
        /*
        for (var i = deleteFrom; i<=deleteTo; i++) {
            const frame = animation.frames[i];
            deleteFile(frame.image.fileId);
            deleteFile(frame.thumbnail.fileId);
            if (frame.reference) {
                deleteFile(frame.reference.fileId);
            }
        }*/
        
        if (updated.length < animation.frames.length) {
          dispatch(setActiveFrameIndex(0));
          
          dispatch(setAnimations(animations.map(ani =>
              ani.id === animation.id ? { ...ani, frames: updated } : ani
          )));
        }
    };
    
    const createDuplicateFrame = async (frame) => {
        const imgId = crypto.randomUUID();
        const thumbId = crypto.randomUUID();
        const refId = crypto.randomUUID();
        const newFrame = {...frame, 
          id: crypto.randomUUID(), 
          image: {...frame.image, id: imgId, fileId: imgId},
          thumbnail: {...frame.thumbnail, id: thumbId, fileId: thumbId},
          reference: {...frame.reference, id: refId, fileId: refId},
        };
        
        const img = await getFile(frame.image.fileId);
        const thumb = await getFile(frame.thumbnail.fileId);
        const ref = await getFile(frame.reference.fileId);
        await storeFile(img, newFrame.image.fileId);
        await storeFile(thumb, newFrame.thumbnail.fileId);
        await storeFile(ref, newFrame.reference.fileId);
        
        return newFrame;
    };
    
    const onDuplicateFrame = async () => {
        
        const newFrame = await createDuplicateFrame(frame);
        
        const updatedFrames = [...animation.frames];
        updatedFrames.splice(activeFrameIndex+1, 0, newFrame);
        
        //console.log(frame, newFrame);
        
        for (var i = activeFrameIndex+1; i<updatedFrames.length; i++) {
            updatedFrames[i] = {...updatedFrames[i], order: updatedFrames[i].order+1};
        }
        
        console.log(updatedFrames);
        
        dispatch(setAnimations(animations.map(ani =>
            ani.id === animation.id ? { ...ani, frames: updatedFrames } : ani
        )));
        
    };
    
    const onDuplicateAnimation = async () => {
        
        const newFrames = []
        for (const frame of animation.frames) {
            const newFrame = await createDuplicateFrame(frame);
            newFrames.push(newFrame);
        }
        
        const newAnimation = {...animation, id: crypto.randomUUID(), frames: newFrames};
        const updated = [...animations];
        updated.splice(activeAnimationIndex+1, 0, newAnimation);
        
        console.log(updated);

        dispatch(setAnimations(updated));
        
    };
    
    
    
    const onGenerateFrame = async () => {
        const toast_id = toast.loading('Generating frames...');
        
        try {
          const character = characters.find(char => char.id === animation.character);
          
          const pose = {
              bodies: frame.pose.body, 
              body_scores: [frame.pose.body.map((coord, index) => index)], 
              hands: [frame.pose.hand1, frame.pose.hand2], 
              hands_scores: [frame.pose.hand1.map(coord => 1.0), frame.pose.hand2.map(coord => 1.0)],
              faces: [],
              faces_scores: [],
          };
          /*
          body: pose["bodies"][0],
          hand1: pose["hands"][0],
          hand2: pose["hands"][1],
          */
          
          const [frames, thumbnails] = await generateFrame(JSON.stringify([pose]), character.images, character.modelId, frame.image.crop.width, frame.image.crop.height);
          //console.log(frames)
          
          const updatedFiles = [...filesID || []];
          const img = await saveMediaFile(frames[0], activeFrameIndex, updatedFiles, fps, resolution);
          const thumb = await saveMediaFile(thumbnails[0], activeFrameIndex, updatedFiles, fps, resolution);
          
          dispatch(setFilesID(updatedFiles));
          onUpdateFrame(frame.id, {image: img, thumbnail: thumb});
          
          toast.success('Frames generated successfully.', { id: toast_id });
        } catch(err) {
          toast.error('Error generating the animation', { id: toast_id });
          throw err;
        }
    };
    

    if (!frame) return null;
    
    
    
    
    const data = {
      datasets: [{
        label: 'Scatter Dataset',
        data: [{ x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 60 }],
        backgroundColor: 'rgba(255, 99, 132, 1)',
        lineColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 10,
        showLine: true,
        pointRadius: 10,
        type: "bubble",
      }],
    };

    const config = {
      responsive: false,
      plugins: {
        dragData: {
          dragX: true, // Enable dragging along the x-axis
          dragY: true,
          round: 0, // Round dragged values to whole numbers
          // Add callbacks for onDragStart, onDrag, onDragEnd as needed
          onDragEnd: function(e, datasetIndex, index, value) {
            // Handle data update after drag ends
            console.log('Dragged value:', value);
          }
        },
        legend: {
          display: false
        },
        tooltip: {
            enabled: false
        },
      },
      animation: false,
      scales: {
          x: {
              display: false
          },
          y: {
              display: false
          }
      },
    };
    
    
    
    //console.log(animation);
    
    

    return (
        <div className="space-y-4">
        
            <div className="grid grid-cols-1 gap-8">
                
                {/* Generate Frame */}
                <div className="space-y-2">
                    <label
                        onClick={() => onGenerateFrame()}
                        className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                    >
                        <Image
                            alt="Add Project"
                            className="Black"
                            height={24}
                            width={24}
                            src="https://www.svgrepo.com/show/506366/wand.svg"
                        />
                        <span className="text-sm">Generate Frame</span>
                    </label>
                
                    
                </div>
                
                
            
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-8">
                        
                        

                        <div>
                            <label className="block text-sm">Hide Layer</label>
                            <ToggleSwitch 
                                label="visibility" 
                                checked={animation.hidden}
                                onChange={(e) => onUpdateAnimation(animation.id, { hidden: e.target.checked })}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm">Show Poses</label>
                            <ToggleSwitch 
                                label="pose" 
                                checked={animation.showPose}
                                onChange={(e) => onUpdateAnimation(animation.id, { showPose: e.target.checked })}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm">Onion Skinning</label>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                value={animation.onionSkinning}
                                onChange={(e) => onUpdateAnimation(animation.id, { onionSkinning: Number(e.target.value) })}
                                className="w-full bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:border-white-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm">Reference Frame Opacity</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={animation.referenceOpacity}
                                onChange={(e) => onUpdateAnimation(animation.id, { referenceOpacity: Number(e.target.value) })}
                                className="w-full bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:border-white-500"
                            />
                        </div>
                        
                        
                        <div>
                            <label className="block text-sm">Layer Opacity</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={frame.thumbnail.opacity}
                                onChange={(e) => onUpdateAllFrames(animation.id, { thumbnail: {opacity: Number(e.target.value)} })}
                                className="w-full bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:border-white-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm">Order Layer</label>
                            <input
                                type="number"
                                value={animations.length - activeAnimationIndex}
                                min={1}
                                max={animations.length}
                                onChange={(e) => {
                                    const newIndex = (e.target.value - animations.length) * -1;
                                    const updated = [...animations];
                                    updated[newIndex] = animations[activeAnimationIndex];
                                    updated[activeAnimationIndex] = animations[newIndex];
                                    //console.log(newIndex, activeAnimationIndex)
                                    //console.log(updated);
                                    dispatch(setActiveAnimationIndex(newIndex));
                                    dispatch(setAnimations(updated));
                                    
                                }}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm">Shift Frames</label>
                            <input
                                type="number"
                                value={activeFrameIndex == 0 ? frame.order : frame.order - animation.frames[activeFrameIndex-1].order - 1}
                                min={0}
                                onChange={(e) => {
                                    const prev = activeFrameIndex == 0 ? frame.order : frame.order - animation.frames[activeFrameIndex-1].order - 1;
                                    const shift = e.target.value - prev;
                                    
                                    const updatedFrames = [...animation.frames];
                                    for (var i = activeFrameIndex; i<animation.frames.length; i++) {
                                        const fr = animation.frames[i];
                                        updatedFrames[i] = {...fr, order: fr.order+shift};
                                    }
                                    
                                    dispatch(setAnimations(animations.map(ani =>
                                        ani.id === animation.id ? { ...ani, frames: updatedFrames } : ani
                                    )));
                                }}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        
                        
                    </div>
                    
                </div>
                
            
                
                
                
                
                {/* Delete Frames */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Delete Frames</h4>
                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="block text-sm">From</label>
                            <input
                                type="number"
                                value={deleteFrom}
                                min={0}
                                onChange={(e) => setDeleteFrom(event.target.value)}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm">To</label>
                            <input
                                type="number"
                                value={deleteTo}
                                min={0}
                                max={animation.frames.length-1}
                                onChange={(e) => setDeleteTo(event.target.value)}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label
                                onClick={() => onDeleteFrames()}
                                className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                            >
                                <Image
                                    alt="Add Project"
                                    className="Black"
                                    height={24}
                                    width={24}
                                    src="https://www.svgrepo.com/show/502614/delete.svg"
                                />
                                <span className="text-sm"> Delete </span>
                            </label>
                        
                            
                        </div>
                
                    </div>
                </div>
                
                {/* Duplicate Frame */}
                <div className="space-y-2">
                    <label
                        onClick={() => onDuplicateFrame()}
                        className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                    >
                        <Image
                            alt="Add Project"
                            className="Black"
                            height={24}
                            width={24}
                            src="https://www.svgrepo.com/show/521623/duplicate.svg"
                        />
                        <span className="text-sm">Duplicate Frame</span>
                    </label>
                
                    
                </div>
                
                {/* Duplicate Animation */}
                <div className="space-y-2">
                    <label
                        onClick={() => onDuplicateAnimation()}
                        className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                    >
                        <Image
                            alt="Add Project"
                            className="Black"
                            height={24}
                            width={24}
                            src="https://www.svgrepo.com/show/521623/duplicate.svg"
                        />
                        <span className="text-sm">Duplicate Layer</span>
                    </label>
                
                    
                </div>
                
                
                {/* Delete Animation */}
                <div className="space-y-2">
                    <label
                        onClick={() => onDeleteAni(animation.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                    >
                        <Image
                            alt="Add Project"
                            className="Black"
                            height={24}
                            width={24}
                            src="https://www.svgrepo.com/show/502614/delete.svg"
                        />
                        <span className="text-sm">Delete Layer</span>
                    </label>
                
                    
                </div>
                
                {/*
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-8">
                        <Scatter 
                            data={data} 
                            options={config}
                        />
                        
                        
                    </div>
                </div>
                */}

            </div>
        </div >
    );
}