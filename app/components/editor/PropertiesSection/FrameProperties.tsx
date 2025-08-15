"use client";

import { useAppSelector, deleteFile } from '../../../store';
import { setActiveAnimationIndex, setActiveFrameIndex, setAnimations } from '../../../store/slices/projectSlice';
import { MediaFile } from '../../../types';
import { useAppDispatch } from '../../../store';

import Image from 'next/image';
import ToggleSwitch from "./components/ToggleSwitch";


import { Scatter } from "react-chartjs-2";
import "chartjs-plugin-dragdata";
import "chart.js/auto";


export default function FrameProperties() {
    const { activeAnimationIndex, activeFrameIndex, animations } = useAppSelector((state) => state.projectState);
    const animation = animations[activeAnimationIndex];
    if (!animation) return null;
    const frame = animation.frames[activeFrameIndex];
    //console.log(animation, frame);
    const dispatch = useAppDispatch();
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
        }
        if (updated.length < animations.length) {
          dispatch(setActiveAnimationIndex(0));
          dispatch(setActiveFrameIndex(0));
          dispatch(setAnimations(updated));
        }
        console.log(animations);
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
    
    
    
    
    
    

    return (
        <div className="space-y-4">
        
            <div className="grid grid-cols-1 gap-8">
                
                
            
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold mb-4">Layer Properties</h2>
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
                            <label className="block text-sm">Reference Frame Opacity</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={frame.referenceOpacity}
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
                    </div>
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
                
                
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold mb-4">Frame Properties</h2>
                    <div className="grid grid-cols-1 gap-8">
                        <Scatter 
                            data={data} 
                            options={config}
                        />
                        
                        
                    </div>
                </div>

            </div>
        </div >
    );
}