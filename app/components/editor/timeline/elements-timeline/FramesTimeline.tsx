import React, { useRef, useCallback, useMemo } from "react";
import Moveable, { OnScale, OnDrag, OnResize, OnRotate } from "react-moveable";
import { useAppSelector, deleteFile } from "@/app/store";
import { setAnimations, setActiveAnimationIndex, setActiveFrameIndex, setMediaFiles, setTimelineZoom } from "@/app/store/slices/projectSlice";
import { memo, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppDispatch } from '@/app/store';
import Image from "next/image";
import Header from "../Header";
import { MediaFile } from "@/app/types";
import { debounce, throttle } from "lodash";


export default function FramesTimeline({ aniId }: { aniId: string }) {
    const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const { mediaFiles, textElements, activeAnimationIndex, activeFrameIndex, animations, timelineZoom, fps } = useAppSelector((state) => state.projectState);
    const dispatch = useDispatch();
    const appDispatch = useAppDispatch();
    const moveableRef = useRef<Record<string, Moveable | null>>({});
    
    const [anis, setAnis] = useState<Animation[]>([]);
    const ani = animations.find(an => an.id === aniId);
    const frames = ani ? ani.frames : [];
    
    const frameSize = 150;
    
    //console.log(animations);
    
    useEffect(() => {
        setAnis(animations);

    }, [animations]);


    // this affect the performance cause of too much re-renders

    // const onUpdateMedia = (id: string, updates: Partial<MediaFile>) => {
    //     dispatch(setMediaFiles(mediaFiles.map(media =>
    //         media.id === id ? { ...media, ...updates } : media
    //     )));
    // };

    // TODO: this is a hack to prevent the mediaFiles from being updated too often while dragging or resizing
    const mediaFilesRef = useRef(mediaFiles);
    useEffect(() => {
        mediaFilesRef.current = mediaFiles;
    }, [mediaFiles]);

    const onUpdateMedia = useMemo(() =>
        throttle((id: string, updates: Partial<MediaFile>) => {
            const currentFiles = mediaFilesRef.current;
            const updated = currentFiles.map(media =>
                media.id === id ? { ...media, ...updates } : media
            );
            dispatch(setMediaFiles(updated));
        }, 100), [dispatch]
    );
    
    
    const onDeleteAni = async (id: string) => {
        console.log("delete");
        console.log(id);
        console.log(anis);
        const updated = animations.filter(f => f.id !== id);
        for (const frame of ani.frames) {
            deleteFile(frame.image.fileId);
            deleteFile(frame.thumbnail.fileId);
        }
        if (updated.length < animations.length) {
          appDispatch(setActiveAnimationIndex(0));
          appDispatch(setActiveFrameIndex(0));
          appDispatch(setAnimations(updated));
        }
        console.log(anis);
    };
      

    const handleClick = (aniIndex: number, index: number | string) => {
        appDispatch(setAnimations(animations));
        dispatch(setTimelineZoom(frameSize*fps));
        if (aniIndex === ani.id) {
            const actualAniIndex = animations.findIndex(a => a.id === aniIndex as unknown as string);
            dispatch(setActiveAnimationIndex(actualAniIndex) as any);
            // TODO: cause we pass id when media to find the right index i will change this later (this happens cause each timeline pass its index not index from mediaFiles array)
            const actualIndex = frames.findIndex(frame => frame.id === index as unknown as string);
            dispatch(setActiveFrameIndex(actualIndex));
        }
    };

    const handleDrag = (clip: MediaFile, target: HTMLElement, left: number) => {
        // no negative left
        const constrainedLeft = Math.max(left, 0);
        const newPositionStart = constrainedLeft / frameSize;
        onUpdateMedia(clip.id, {
            positionStart: newPositionStart,
            positionEnd: (newPositionStart - clip.positionStart) + clip.positionEnd,
            endTime: (newPositionStart - clip.positionStart) + clip.endTime
        })

        target.style.left = `${constrainedLeft}px`;
    };

    const handleRightResize = (clip: MediaFile, target: HTMLElement, width: number) => {
        const newPositionEnd = width / frameSize;

        onUpdateMedia(clip.id, {
            positionEnd: clip.positionStart + newPositionEnd,
            endTime: clip.positionStart + newPositionEnd,
        })
    };
    const handleLeftResize = (clip: MediaFile, target: HTMLElement, width: number) => {
        const newPositionEnd = width / frameSize;
        // Ensure we do not resize beyond the right edge of the clip
        const constrainedLeft = Math.max(clip.positionStart + ((clip.positionEnd - clip.positionStart) - newPositionEnd), 0);

        onUpdateMedia(clip.id, {
            positionStart: constrainedLeft,
            // startTime: constrainedLeft,
        })
    };

    useEffect(() => {
        for (const clip of mediaFiles) {
            moveableRef.current[clip.id]?.updateRect();
        }
    }, [frameSize]);
    
    //console.log(ani);
    

    return (  
              
        < >
          {ani != undefined && (<div>
        
            <button
                onClick={() => onDeleteAni(ani.id)}
                className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                aria-label="Delete file"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </button>

            <div className="relative h-48 z-10">  

                
              {ani.frames
                  .filter(frame => frame.isKeyframe === true)
                  .map((frame) => (
                      <div key={frame.id} className="bg-green-500">
                          <div
                              key={frame.id}
                              ref={(el: HTMLDivElement | null) => {
                                  if (el) {
                                      targetRefs.current[frame.id] = el;
                                  }
                                  
                              }}
                              onClick={() => handleClick(ani.id, frame.id)}
                              className={`absolute border border-gray-500 border-opacity-50 rounded-md top-2 h-32 rounded bg-[#27272A] text-white text-sm flex items-center justify-center cursor-pointer ${animations[activeAnimationIndex].id === ani.id && ani.frames[activeFrameIndex].id === frame.id ? 'bg-[#3F3F46] border-blue-500' : ''}`}
                              style={{
                                  left: `${frame.order * frameSize}px`,
                                  width: `${frameSize}px`, //`${(clip.positionEnd - clip.positionStart) * timelineZoom}px`,
                                  //zIndex: clip.zIndex,
                              }}
                          >
                              {/* <MoveableTimeline /> */}
                              <Image
                                  alt="Image"
                                  className="max-h-32 max-w-32 min-w-6 flex-shrink-0"
                                  height={frameSize}
                                  width={frameSize}
                                  src={frame.thumbnail.src}//"https://www.svgrepo.com/show/535454/image.svg"
                              />
                              
                              
                              

                          </div>
                          
                          
                          
                          <Moveable
                              ref={(el: Moveable | null) => {
                                  if (el) {
                                      moveableRef.current[frame.id] = el;
                                  }
                              }}
                              target={targetRefs.current[frame.id] || null}
                              container={null}
                              renderDirections={animations[activeAnimationIndex].id === ani.id && frames[activeFrameIndex].id === frame.id ? ['w', 'e'] : []}
                              draggable={true}
                              throttleDrag={0}
                              rotatable={false}
                              onDragStart={({ target, clientX, clientY }) => {
                              }}
                              onDrag={({
                                  target,
                                  beforeDelta, beforeDist,
                                  left,
                                  right,
                                  delta, dist,
                                  transform,
                              }: OnDrag) => {
                                  handleClick(ani.id, frame.id)
                                  handleDrag(frame, target as HTMLElement, left);
                              }}
                              onDragEnd={({ target, isDrag, clientX, clientY }) => {
                              }}

                              /* resizable*/
                              resizable={false}
                              throttleResize={0}
                              onResizeStart={({ target, clientX, clientY }) => {
                              }}
                              onResize={({
                                  target, width,
                                  delta, direction,
                              }: OnResize) => {
                                  if (direction[0] === 1) {
                                      handleClick(ani.id, frame.id)
                                      delta[0] && (target!.style.width = `${width}px`);
                                      handleRightResize(frame, target as HTMLElement, width);

                                  }

                              }}
                              onResizeEnd={({ target, isDrag, clientX, clientY }) => {
                              }}
                              className={animations[activeAnimationIndex].id === ani.id && frames[activeFrameIndex].id === frame.id ? '' : 'moveable-control-box-hidden'}

                          />

                          
                      </div>

                  ))}
          
            </div>
          </div>)}
        </>
      
    );
}
