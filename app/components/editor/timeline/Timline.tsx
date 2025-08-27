import { useAppSelector, deleteFile } from "@/app/store";
import { setAnimations, setHistory, setFuture, setMarkerTrack, setTextElements, setMediaFiles, setTimelineZoom, setCurrentTime, setIsPlaying, setActiveElement, setActiveAnimationIndex, setActiveFrameIndex, setCharacters } from "@/app/store/slices/projectSlice";
import { memo, useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { useAppDispatch } from '@/app/store';
import Image from "next/image";
import Header from "./Header";
import FramesTimeline from "./elements-timeline/FramesTimeline";
import ImageTimeline from "./elements-timeline/ImageTimeline";
import { throttle } from 'lodash';
import GlobalKeyHandlerProps from "../../../components/editor/keys/GlobalKeyHandlerProps";
import {getUpdatedHistory} from "../../../utils/callHuggingface";
import { ProjectState, Animation } from "@/app/types";
import toast from "react-hot-toast";
export const Timeline = () => {
    const projectState = useAppSelector((state) => state.projectState);
    const { currentTime, timelineZoom, enableMarkerTracking, activeElement, activeElementIndex, activeAnimationIndex, activeFrameIndex, mediaFiles, textElements, duration, isPlaying, history, future } = projectState;
    const dispatch = useDispatch();
    const appDispatch = useAppDispatch();
    const timelineRef = useRef<HTMLDivElement>(null)
    
    const { animations } = useAppSelector((state) => state.projectState);
    const aniRev = [...animations].reverse();

    const throttledZoom = useMemo(() =>
        throttle((value: number) => {
            dispatch(setTimelineZoom(value));
        }, 100),
        [dispatch]
    );


    const handleDelete = () => {
        // @ts-ignore
        let element = null;
        let elements = null;
        let setElements = null;

        if (activeElement === 'media') {
            elements = [...mediaFiles];
            element = elements[activeElementIndex];
            setElements = setMediaFiles;
        } else if (activeElement === 'text') {
            elements = [...textElements];
            element = elements[activeElementIndex];
            setElements = setTextElements;
        }

        if (!element) {
            toast.error('No element selected.');
            return;
        }

        if (elements) {
            // @ts-ignore
            elements = elements.filter(ele => ele.id !== element.id)
        }

        if (elements && setElements) {
            dispatch(setElements(elements as any));
            dispatch(setActiveElement(null));
            toast.success('Element deleted successfully.');
        }
    };
    
    const onDeleteFrame = () => {
        
        
        const animation = animations[activeAnimationIndex];
        const frame = animation.frames[activeFrameIndex];
        console.log("delete", frame);
        const updated = animation.frames.filter(f => f.id !== frame.id);
        
        //deleteFile(frame.image.fileId);
        //deleteFile(frame.thumbnail.fileId);
        const toDelete = [];
        toDelete.push(frame.image.fileId);
        toDelete.push(frame.thumbnail.fileId);
        if (frame.reference) {
            //deleteFile(frame.reference.fileId);
            toDelete.push(frame.reference.fileId);
        }
        dispatch(setHistory(getUpdatedHistory(projectState, toDelete)));
        
        if (updated.length < animation.frames.length) {
          dispatch(setActiveFrameIndex(0));
          
          dispatch(setAnimations(animations.map(ani =>
              ani.id === animation.id ? { ...ani, frames: updated } : ani
          )));
        }
        console.log(animation);
        
    };


    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;

        dispatch(setIsPlaying(false));
        const rect = timelineRef.current.getBoundingClientRect();

        const scrollOffset = timelineRef.current.scrollLeft;
        const offsetX = e.clientX - rect.left + scrollOffset;

        const seconds = offsetX / timelineZoom;
        const clampedTime = Math.max(0, Math.min(duration, seconds));
        
        dispatch(setCurrentTime(clampedTime));
    };
    
    const updateAll = (state: ProjectState) => {
        dispatch(setAnimations(state.animations));
        dispatch(setCharacters(state.characters));
        dispatch(setActiveFrameIndex(state.activeFrameIndex));
        dispatch(setActiveAnimationIndex(state.activeAnimationIndex));
    };
    
    const handleUndo = () => {
        if (!history || history.length==0) {
            toast.error("Nothing to undo");
            return;
        }
        
        //dispatch(setHistory([]));
        //return;
        
        const updatedHistory: ProjectState[] = [...history];
        const state = updatedHistory.pop();
        if (!state) {
            return;
        }
        
        dispatch(setHistory(updatedHistory));
        
        const updatedFuture: ProjectState[] = [...future];
        const animationsState: Animation[] = animations.map(ani => {
          return {...ani, frames: ani.frames.map(fr => {
            return {...fr}
          })}
        });
        const st: ProjectState = {...projectState, animations: animationsState};
        updatedFuture.push(st);
        dispatch(setFuture(updatedFuture));
        
        
        updateAll(state);
        //console.log(state);
        
        //console.log(updatedHistory, updatedFuture);
    };
    
    const handleRedo = () => {
        if (!future || future.length==0) {
            toast.error("Nothing to redo");
            return;
        }
        
        const updatedFuture = [...future];
        const state = updatedFuture.pop();
        if (!state) {
            return;
        }
        
        dispatch(setFuture(updatedFuture));
        
        dispatch(setHistory(getUpdatedHistory(projectState)));
        
        updateAll(state);
        
        //console.log(updatedFuture);
    };
    

    return (

        <div className="flex w-full flex-col gap-2">
            <div className="flex flex-row items-center justify-between gap-12 w-full">
                <div className="flex flex-row items-center gap-2">
                    
                    <button
                        onClick={handleUndo}
                        className="bg-white border rounded-md border-transparent transition-colors flex flex-row items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] mt-2 font-medium text-sm sm:text-base h-auto px-2 py-1 sm:w-auto"
                    >
                        <Image
                            alt="cut"
                            className="h-auto w-auto max-w-[20px] max-h-[20px]"
                            height={30}
                            width={30}
                            src="https://www.svgrepo.com/show/529263/undo-left.svg"
                        />
                        <span className="ml-2">Undo</span>
                    </button>
                    
                    <button
                        onClick={handleRedo}
                        className="bg-white border rounded-md border-transparent transition-colors flex flex-row items-center justify-center text-gray-800 hover:bg-[#ccc] dark:hover:bg-[#ccc] mt-2 font-medium text-sm sm:text-base h-auto px-2 py-1 sm:w-auto"
                    >
                        <Image
                            alt="cut"
                            className="h-auto w-auto max-w-[20px] max-h-[20px]"
                            height={30}
                            width={30}
                            src="https://www.svgrepo.com/show/529267/undo-right.svg"
                        />
                        <span className="ml-2">Redo</span>
                    </button>
                    
                    
                </div>

                {/* Timeline Zoom */}
                {/*<div className="flex flex-row justify-between items-center gap-2 mr-4">
                    <label className="block text-sm mt-1 font-semibold text-white">Zoom</label>
                    <span className="text-white text-lg">-</span>
                    <input
                        type="range"
                        min={30}
                        max={120}
                        step="1"
                        value={timelineZoom}
                        onChange={(e) => throttledZoom(Number(e.target.value))}
                        className="w-[100px] bg-darkSurfacePrimary border border-white border-opacity-10 shadow-md text-white rounded focus:outline-none focus:border-white-500"
                    />
                    <span className="text-white text-lg">+</span>
                </div>*/}
            </div>

            <div
                className="relative overflow-x-auto w-full border-t border-gray-800 bg-[#1E1D21] z-10"
                ref={timelineRef}
                onClick={handleClick}
            >
                {/* Timeline Header */}
                <Header />

                <div className="bg-[#1E1D21]"

                    style={{
                        width: "100%", /* or whatever width your timeline requires */
                    }}
                >
                    {/* Timeline cursor */}
                    <div
                        className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50"
                        style={{
                            left: `${currentTime * timelineZoom}px`,
                        }}
                    />
                    {/* Timeline elements */}
                    <div className="w-full h-96">
                    
                      <ImageTimeline />
                      
                      {aniRev.map((ani) => (
                        <div key={ani.id} >
                            
                            <FramesTimeline aniId={ani.id} />
                          
                        </div>
                        
                      ))}

                    </div>
                </div>
            </div >
            <GlobalKeyHandlerProps handleDelete={onDeleteFrame} handleUndo={handleUndo} handleRedo={handleRedo} />
        </div>

    );
};

export default memo(Timeline)
