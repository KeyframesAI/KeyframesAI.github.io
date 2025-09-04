"use client";

import { useAppSelector, deleteFile } from '../../../store';
import { setActiveAnimationIndex, setActiveFrameIndex, setAnimations, setFilesID, setHistory } from '../../../store/slices/projectSlice';
import { MediaFile, Frame, Animation } from '../../../types';
import { useAppDispatch, storeFile, getFile } from '../../../store';

import Image from 'next/image';
import ToggleSwitch from "./components/ToggleSwitch";
import toast from 'react-hot-toast';

import { useState, useEffect } from 'react';

import { Scatter } from "react-chartjs-2";
import "chartjs-plugin-dragdata";
import "chart.js/auto";

import {generateFrame, interpolateFrames, saveMediaFile, getUpdatedHistory} from "../../../utils/callHuggingface";

const zipArrays = (...arr: any[]) => Array.from({ length: Math.max(...arr.map(a => a.length)) }, (_, i) => arr.map(a => a[i]));

export default function FrameProperties() {
    const projectState = useAppSelector((state) => state.projectState);
    const { activeAnimationIndex, activeFrameIndex, animations, characters, fps, filesID, resolution } = projectState;

    //console.log(animation, frame);
    const dispatch = useAppDispatch();
    
    const [deleteFrom, setDeleteFrom] = useState(activeFrameIndex);
    const [deleteTo, setDeleteTo] = useState(activeFrameIndex);
    const [applyFrom, setApplyFrom] = useState(activeFrameIndex);
    const [applyTo, setApplyTo] = useState(activeFrameIndex);
    const [interpTimes, setInterpTimes] = useState(activeFrameIndex);
    useEffect(() => {
        setDeleteFrom(activeFrameIndex);
        setDeleteTo(activeFrameIndex);
        setApplyFrom(activeFrameIndex);
        setApplyTo(activeFrameIndex);
        setInterpTimes(1);

    }, [activeFrameIndex]);
    
    const animation: Animation = animations[activeAnimationIndex];
    if (!animation) return null;
    const frame: Frame = animation.frames[activeFrameIndex];
    
    
    /*const onUpdateFrame = (id: string, updates: Partial<Frame>) => {
    
        var updatedFrames = animation.frames.map(fr =>
            fr.id === id ? { ...fr, ...updates } : fr
        );
    
        dispatch(setAnimations(animations.map(ani =>
            ani.id === animation.id ? { ...ani, frames: updatedFrames } : ani
        )));
        
        
    };*/
    
    /*
    const onUpdateFrame2 = () => {
        const updated = animations.map(ani => {return { ...ani, 
            frames: ani.frames.map(fr => {return { ...fr, duration: 1 }})
            
        }}
        );
        console.log(updated);

        dispatch(setAnimations(updated));
        
        
    };*/
    
    const onUpdateAnimation = (id: string, updates: Partial<Animation>) => {
        //console.log(updates);
    
        dispatch(setAnimations(animations.map(ani =>
            ani.id === id ? { ...ani, ...updates } : ani
        )));
    };
    
    
    const onShiftFrame = (shift: number, index: number, duration: number | null = null) => {
        //console.log(shift, index);
    
        const updatedFrames = [...animation.frames];
        
        if (duration) {
          updatedFrames[activeFrameIndex] = {...updatedFrames[activeFrameIndex], duration: duration};
        }
        
        //console.log(updatedFrames);
        for (var i = index; i<animation.frames.length; i++) {
            const fr = animation.frames[i];
            updatedFrames[i] = {...fr, order: fr.order+shift};
            //console.log(i, fr.order, updatedFrames[i].order);
        }
        //console.log(updatedFrames);
        dispatch(setAnimations(animations.map(ani =>
            ani.id === animation.id ? { ...ani, frames: updatedFrames } : ani
        )));
    };
    
    const onDeleteAni = async (id: string) => {
        console.log("delete", id);
        const updated = animations.filter(f => f.id !== id);
        const toDelete = [];
        for (const frame of animation.frames) {
            //deleteFile(frame.image.fileId);
            //deleteFile(frame.thumbnail.fileId);
            toDelete.push(frame.image.fileId);
            toDelete.push(frame.thumbnail.fileId);
            if (frame.reference) {
                //deleteFile(frame.reference.fileId);
                toDelete.push(frame.reference.fileId);
            }
        }
        dispatch(setHistory(getUpdatedHistory(projectState, toDelete)));
        
        if (updated.length < animations.length) {
          dispatch(setActiveAnimationIndex(0));
          dispatch(setActiveFrameIndex(0));
          dispatch(setAnimations(updated));
        }
        console.log(animations);
        
    };
    
    
    
    const onDeleteFrames = async () => {
        const updated = [...animation.frames];
        updated.splice(deleteFrom, deleteTo-deleteFrom+1);
        
        const toDelete = [];
        for (var i = deleteFrom; i<=deleteTo; i++) {
            const frame = animation.frames[i];
            //deleteFile(frame.image.fileId);
            //deleteFile(frame.thumbnail.fileId);
            toDelete.push(frame.image.fileId);
            toDelete.push(frame.thumbnail.fileId);
            if (frame.reference) {
                //deleteFile(frame.reference.fileId);
                toDelete.push(frame.reference.fileId);
            }
        }
        
        dispatch(setHistory(getUpdatedHistory(projectState, toDelete)));
        
        if (updated.length < animation.frames.length) {
          dispatch(setActiveFrameIndex(0));
          
          dispatch(setAnimations(animations.map(ani =>
              ani.id === animation.id ? { ...ani, frames: updated } : ani
          )));
          
          if (updated.length == 0) {
              dispatch(setAnimations(animations.filter(f => f.id !== animation.id)));
              dispatch(setActiveAnimationIndex(0));
          }
        }
        
        
    };
    
    const createDuplicateFrame = async (frame: Frame) => {
        const imgId = crypto.randomUUID();
        const thumbId = crypto.randomUUID();
        const refId = crypto.randomUUID();
        const newFrame = {...frame, 
          id: crypto.randomUUID(), 
          image: {...frame.image, id: imgId, fileId: imgId},
          thumbnail: {...frame.thumbnail, id: thumbId, fileId: thumbId},
          
        };
        
        const img = await getFile(frame.image.fileId);
        const thumb = await getFile(frame.thumbnail.fileId);
        if (frame.reference) {
            const ref = await getFile(frame.reference.fileId);
            await storeFile(ref, refId);
            newFrame.reference = {...frame.reference, id: refId, fileId: refId};
        }
        await storeFile(img, newFrame.image.fileId);
        await storeFile(thumb, newFrame.thumbnail.fileId);
        
        
        return newFrame;
    };
    
    
    const onReverseFrames = async () => {
        dispatch(setHistory(getUpdatedHistory(projectState)));
        
        const start = Number(applyFrom);
        const end = Number(applyTo);
        
        const updatedFrames = [...animation.frames];
        for (var i = start; i<=end; i++) {
          const j = end - (i-start);
          console.log(i, j);
          updatedFrames[i] = {...updatedFrames[i], order: animation.frames[j].order};
        }
        updatedFrames.sort((a, b) => a.order - b.order);
        
        dispatch(setAnimations(animations.map(ani =>
            ani.id === animation.id ? { ...ani, frames: updatedFrames } : ani
        )));
    };
    
    
    const onDuplicateFrames = async () => {
        //onUpdateFrame2();
        //console.log(animations);
        
        dispatch(setHistory(getUpdatedHistory(projectState)));
        
        const start = Number(applyFrom);
        const end = Number(applyTo);
        
        const newFrames = [];
        for (var i = start; i<=end; i++) {
          const newFrame: Frame = await createDuplicateFrame(animation.frames[i]);
          if (newFrame) {
            newFrames.push(newFrame);
          }
        }
        
        const updatedFrames = [...animation.frames];
        updatedFrames.splice(end+1, 0, ...newFrames);
        
        
        console.log(end+1, updatedFrames.length);
        
        for (var i = end+1; i<updatedFrames.length; i++) {
            console.log(updatedFrames[i].order, newFrames.length);
            updatedFrames[i] = {...updatedFrames[i], order: updatedFrames[i].order + newFrames.length};
            console.log(updatedFrames[i].order);
        }
        
        console.log(updatedFrames);
        
        dispatch(setAnimations(animations.map(ani =>
            ani.id === animation.id ? { ...ani, frames: updatedFrames } : ani
        )));
        
    };
    
    const onDuplicateAnimation = async () => {
        dispatch(setHistory(getUpdatedHistory(projectState)));
        
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
    
    const onReplaceFrame = async (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setHistory(getUpdatedHistory(projectState)));
        
        console.log('onReplaceFrame');
        
        const uploadedFiles = Array.from(e.target.files || []);
        console.log(e.target);
        if (uploadedFiles.length!=1) {
            return;
        }
        e.target.value = "";
        e.target.files = null;
        
        var updatedFiles = [...filesID || []];
        const img = await saveMediaFile(uploadedFiles[0], frame.order, updatedFiles, fps, resolution);
        
        const updatedFrames = [...animation.frames].map(fr =>
            fr.id === frame.id ? { ...fr, image: img, thumbnail: img } : fr
        );
        
        dispatch(setFilesID(updatedFiles));
          
        dispatch(setAnimations(animations.map(ani =>
            ani.id === animation.id ? { ...ani, frames: updatedFrames } : ani
        )));
        
    };
    
    const onChangeCharacterImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('onChangeCharacterImages');
        
        const uploadedFiles = Array.from(e.target.files || []);
        console.log(e.target);
        if (uploadedFiles.length==0) {
            return;
        }
        const imgFiles = uploadedFiles.map(f => {return {file: f}});
        e.target.value = "";
        e.target.files = null;
        
        const character = characters.find(char => char.id === animation.character);
        if (character) {
            imgFiles.unshift(character.images[0]);
        }
        
        
        console.log(imgFiles);
        
        const updateFrames = [];
        for (var i = applyFrom; i<=applyTo; i++) {
            updateFrames.push(animation.frames[i].id);
        }
        
        console.log(updateFrames);
        
        onGenerateFrame(frame, updateFrames, imgFiles, crypto.randomUUID());
    };
    
    const onGenerateFrame = async (frame: Frame, toUpdate: string[], charImages: any[], modelId: string|undefined) => {
        dispatch(setHistory(getUpdatedHistory(projectState)));
        
        console.log('onGenerateFrame');
        
        const aniId = animation.id;
    
        const toast_id = toast.loading('Updating frames...');
        
        try {
          
          if (!frame.reference) {
              throw Error("No reference image");
          }
          
          const poses = [];
          for (const id of toUpdate) {
              const fr = animation.frames.find((c) => c.id == id);
              if (!fr || !fr.pose) {
                  throw Error("No pose available");
              }
              const pose = {
                  bodies: fr.pose.body, 
                  body_scores: [fr.pose.body.map((coord, index) => index)], 
                  hands: [fr.pose.hand1, fr.pose.hand2], 
                  hands_scores: [fr.pose.hand1.map(coord => 1.0), fr.pose.hand2.map(coord => 1.0)],
                  faces: [],
                  faces_scores: [],
              };
              poses.push(pose);
          }
          /*
          body: pose["bodies"][0],
          hand1: pose["hands"][0],
          hand2: pose["hands"][1],
          */
          
          const [frames, thumbnails] = await generateFrame(JSON.stringify(poses), charImages, modelId, frame.reference.width, frame.reference.height);
          //console.log(frames)
          
          var updatedFiles = [...filesID || []];
          
          var updatedFrames = [...animation.frames];
          
          for (var i = 0; i<toUpdate.length; i++) {
              const img = await saveMediaFile(frames[i], frame.order, updatedFiles, fps, resolution);
              const thumb = await saveMediaFile(thumbnails[i], frame.order, updatedFiles, fps, resolution);
              
              updatedFrames = updatedFrames.map(fr =>
                  fr.id === toUpdate[i] ? { ...fr, image: img, thumbnail: thumb } : fr
              );
          }
          
          dispatch(setAnimations(animations.map(ani =>
              ani.id === aniId ? { ...ani, frames: updatedFrames } : ani
          )));
          
          dispatch(setFilesID(updatedFiles));
          //onUpdateFrame(updateIds[0], {image: img, thumbnail: thumb});
          
          toast.success('Frames updated successfully.', { id: toast_id });
        } catch(err) {
          toast.error('Error regenerating the frames', { id: toast_id });
          throw err;
        }
    };
    
    const onInterpolateFrame = async (frame: Frame) => {
        dispatch(setHistory(getUpdatedHistory(projectState)));
        
        const toast_id = toast.loading('Interpolating frames...');
        
        try {
          if (activeFrameIndex >= animation.frames.length-1) {
              throw Error("Nothing to interpolate");
          }
          
          const removebg = frame.pose != null;
          
          const [frames, thumbnails] = await interpolateFrames(frame.image, animation.frames[activeFrameIndex+1].image, interpTimes, removebg);
          //console.log(frames)
          const frames_zipped = zipArrays(frames, thumbnails);
          
          const updatedFiles = [...filesID || []];
          
          var c = 0;
          const newFrames = [];
          for (const f of frames_zipped) {
              const frameId = crypto.randomUUID();
              const order = frame.order+c+1;
              
              const img = await saveMediaFile(f[0], order, updatedFiles, fps, resolution);
              const thumb = await saveMediaFile(f[1], order, updatedFiles, fps, resolution);
              
              
              const newFrame: Frame = {
                  id: frameId,
                  order: order,
                  image: img,
                  thumbnail: thumb,
                  isKeyframe: true,
                  duration: 1,
              };
              
              if (frame.reference) {
                const reffile = await getFile(frame.reference.fileId);
                const ref = await saveMediaFile(reffile, order, updatedFiles, fps, resolution);
                newFrame.reference = ref;
              }
              
              newFrames.push(newFrame);
              
              c++;
          }
          
          const frameIndex = animation.frames.findIndex((c) => c.id == frame.id);
          
          const updatedFrames = [...animation.frames];
          for (var i = frameIndex+1; i<updatedFrames.length; i++) {
              updatedFrames[i] = {...updatedFrames[i], order: updatedFrames[i].order+c};
          }
          updatedFrames.splice(frameIndex+1, 0, ...newFrames);
          
          console.log(updatedFrames);
          
          
          dispatch(setFilesID(updatedFiles));
          
          dispatch(setAnimations(animations.map(ani =>
              ani.id === animation.id ? { ...ani, frames: updatedFrames } : ani
          )));
          
          
          toast.success('Frames interpolated successfully.', { id: toast_id });
        } catch(err) {
          toast.error('Error interpolating the frames', { id: toast_id });
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
          onDragEnd: function(e: any, datasetIndex: number, index: number, value: any) {
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
                {frame.pose && (
                  <>
                    <div className="space-y-2">
                        <label
                            onClick={() => {
                                const character = characters.find(char => char.id === animation.character);
                                if (character) {
                                    onGenerateFrame(frame, [frame.id], character.images, character.modelId);
                                }
                            }}
                            className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                        >
                            <Image
                                alt="Add Project"
                                className="Black"
                                height={24}
                                width={24}
                                src="https://www.svgrepo.com/show/506366/wand.svg"
                            />
                            <span className="text-sm">Update Pose</span>
                        </label>
                    
                        
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="font-semibold">Change Character Reference Images</h4>
                        <div className="flex items-center space-x-4">
                            <div style={{width: '30%'}}>
                                <label className="block text-sm">From</label>
                                <input
                                    type="number"
                                    value={applyFrom}
                                    min={0}
                                    onChange={(e:any) => setApplyFrom(e.target.value)}
                                    className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                                />
                            </div>
                            <div style={{width: '30%'}}>
                                <label className="block text-sm">To</label>
                                <input
                                    type="number"
                                    value={applyTo}
                                    min={0}
                                    max={animation.frames.length-1}
                                    onChange={(e:any) => setApplyTo(e.target.value)}
                                    className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                                />
                            </div>
                            
                            
                    
                        </div>
                        <div className="space-y-2">
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                            >
                                <Image
                                    alt="Add Project"
                                    className="Black"
                                    height={24}
                                    width={24}
                                    src="https://www.svgrepo.com/show/506366/wand.svg"
                                />
                                <span className="text-sm"> Change </span>
                            </label>
                        
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={onChangeCharacterImages}
                                className="hidden"
                                id="file-upload"
                            />
                        </div>
                    </div>
                  </>
                )}
                
                {/* Interpolate Frame */}
                {(<div className="space-y-2">
                      
                      <label
                          onClick={() => onInterpolateFrame(frame)}
                          className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                      >
                          <Image
                              alt="Add Project"
                              className="Black"
                              height={24}
                              width={24}
                              src="https://www.svgrepo.com/show/506366/wand.svg"
                          />
                          <span className="text-sm">Interpolate Frames</span>
                      </label>
                      
                      <div>
                          <label className="block text-sm">Times to Interpolate</label>
                          <input
                              type="number"
                              value={interpTimes}
                              min={1}
                              max={8}
                              onChange={(e:any) => setInterpTimes(e.target.value)}
                              className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                          />
                      </div>
                      
                </div>)}
                
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <a href={frame.image.src} download={frame.image.src}>
                      <label
                          className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                      >
                          <Image
                              alt="Add Project"
                              className="Black"
                              height={24}
                              width={24}
                              src="https://www.svgrepo.com/show/528952/download.svg"
                          />
                          <span className="text-sm">Download Frame</span>
                      </label>
                    </a>
                    
                    
                    <label
                        htmlFor="file-upload2"
                        className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                    >
                        <Image
                            alt="Add Project"
                            className="Black"
                            height={24}
                            width={24}
                            src="https://www.svgrepo.com/show/529274/upload.svg"
                        />
                        <span className="text-sm">Replace Frame </span>
                    </label>
                
                    <input
                        type="file"
                        accept="image/*"
                        onChange={onReplaceFrame}
                        className="hidden"
                        id="file-upload2"
                    />
                  </div>  
                </div>
                
            
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-8">
                        
                        

                        <div>
                            <label className="block text-sm">Hide Layer</label>
                            <ToggleSwitch 
                                label="visibility" 
                                checked={animation.hidden}
                                onChange={(e:any) => onUpdateAnimation(animation.id, { hidden: e.target.checked })}
                            />
                        </div>
                        
                        {frame.pose && (<div>
                            <label className="block text-sm">Show Poses</label>
                            <ToggleSwitch 
                                label="pose" 
                                checked={animation.showPose}
                                onChange={(e:any) => onUpdateAnimation(animation.id, { showPose: e.target.checked })}
                            />
                        </div>)}
                        
                        <div>
                            <label className="block text-sm">Onion Skinning</label>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                value={animation.onionSkinning}
                                onChange={(e:any) => onUpdateAnimation(animation.id, { onionSkinning: Number(e.target.value) })}
                                className="w-full bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:border-white-500"
                            />
                        </div>
                        
                        {frame.pose && (<div>
                            <label className="block text-sm">Pose Reference Frame Opacity</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={animation.referenceOpacity}
                                onChange={(e:any) => onUpdateAnimation(animation.id, { referenceOpacity: Number(e.target.value) })}
                                className="w-full bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:border-white-500"
                            />
                        </div>)}
                        
                        
                        <div>
                            <label className="block text-sm">Layer Opacity</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={frame.thumbnail.opacity}
                                onChange={(e:any) => {
                                    var updatedFrames = animation.frames.map(fr => true ? { ...fr, thumbnail: {...fr.thumbnail, opacity: Number(e.target.value)} } : fr);
        
                                    dispatch(setAnimations(animations.map(ani =>
                                        ani.id === animation.id ? ({ ...ani, frames: updatedFrames } as Animation) : ani
                                    )));
                                    
                                }}
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
                                onChange={(e:any) => {
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
                            <label className="block text-sm">Frame Duration</label>
                            <input
                                type="number"
                                value={frame.duration}
                                min={1}
                                onChange={(e:any) => {
                                    onShiftFrame(Number(e.target.value)-frame.duration, activeFrameIndex+1, Number(e.target.value));
                                    
                                    //onUpdateFrame(frame.id, { duration: Number(e.target.value) });
                                    /*if (activeFrameIndex < animation.frames.length-1) {
                                      
                                    }*/
                                    
                                }}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm">Shift Frames</label>
                            <input
                                type="number"
                                value={activeFrameIndex == 0 ? frame.order : frame.order - (animation.frames[activeFrameIndex-1].order + animation.frames[activeFrameIndex-1].duration)}
                                onChange={(e:any) => {
                                    const prev = activeFrameIndex == 0 ? frame.order : frame.order - (animation.frames[activeFrameIndex-1].order + animation.frames[activeFrameIndex-1].duration);
                                    const shift = Number(e.target.value) - prev;
                                    onShiftFrame(shift, activeFrameIndex);
                                }}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        
                        
                    </div>
                    
                </div>
                
                
                
                {/* Duplicate Frames */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Duplicate Frames</h4>
                    <div className="flex items-center space-x-4">
                        <div style={{width: '30%'}}>
                            <label className="block text-sm">From</label>
                            <input
                                type="number"
                                value={applyFrom}
                                min={0}
                                onChange={(e:any) => setApplyFrom(e.target.value)}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div style={{width: '30%'}}>
                            <label className="block text-sm">To</label>
                            <input
                                type="number"
                                value={applyTo}
                                min={0}
                                max={animation.frames.length-1}
                                onChange={(e:any) => setApplyTo(e.target.value)}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                    </div>
                        
                    <div className="flex items-center space-x-4">
                        <div className="space-y-2">
                            <label
                                onClick={() => onDuplicateFrames()}
                                className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                            >
                                <Image
                                    alt="Add Project"
                                    className="Black"
                                    height={24}
                                    width={24}
                                    src="https://www.svgrepo.com/show/521623/duplicate.svg"
                                />
                                <span className="text-sm"> Duplicate </span>
                            </label>
                        
                            
                        </div>
                        
                        
                        <div className="space-y-2">
                            <label
                                onClick={() => onReverseFrames()}
                                className="cursor-pointer rounded-full bg-white border border-solid border-transparent transition-colors flex flex-row gap-2 items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-auto py-2 px-2 sm:px-5 sm:w-auto"
                            >
                                <Image
                                    alt="Add Project"
                                    className="Black"
                                    height={24}
                                    width={24}
                                    src="https://www.svgrepo.com/show/343271/reverse.svg"
                                />
                                <span className="text-sm"> Mirror </span>
                            </label>
                        
                            
                        </div>
                
                    </div>
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
                
                
                {/* Delete Frames */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Delete Frames</h4>
                    <div className="flex items-center space-x-4">
                        <div style={{width: '30%'}}>
                            <label className="block text-sm">From</label>
                            <input
                                type="number"
                                value={deleteFrom}
                                min={0}
                                onChange={(e:any) => setDeleteFrom(e.target.value)}
                                className="w-full p-2 bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:ring-2 focus:ring-white-500 focus:border-white-500"
                            />
                        </div>
                        <div style={{width: '30%'}}>
                            <label className="block text-sm">To</label>
                            <input
                                type="number"
                                value={deleteTo}
                                min={0}
                                max={animation.frames.length-1}
                                onChange={(e:any) => setDeleteTo(e.target.value)}
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