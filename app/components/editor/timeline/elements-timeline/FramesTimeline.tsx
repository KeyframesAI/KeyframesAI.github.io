import React, { useRef, useCallback, useMemo } from "react";
import Moveable, { OnScale, OnDrag, OnResize, OnRotate } from "react-moveable";
import { useAppSelector, deleteFile } from "@/app/store";
import { setAnimations, setActiveElement, setActiveAnimationIndex, setActiveFrameIndex, setMediaFiles, setTimelineZoom, setCurrentTime } from "@/app/store/slices/projectSlice";
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
    
    const frameSize = 150;


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
    
    useEffect(() => {
        for (const clip of mediaFiles) {
            moveableRef.current[clip.id]?.updateRect();
        }
    }, [frameSize]);
    
    
    const ani = animations.find(an => an.id === aniId);
    if (!ani) return;
    
    const frames = [...(ani ? ani.frames : [])];
    
    

    const handleClick = (aniIndex: string, index: number | string) => {
        //appDispatch(setActiveElement('frame'));
        appDispatch(setAnimations(animations));
        dispatch(setTimelineZoom(frameSize*fps));
        if (aniIndex === ani.id) {
            const actualAniIndex = animations.findIndex(a => a.id === aniIndex as unknown as string);
            dispatch(setActiveAnimationIndex(actualAniIndex) as any);
            // TODO: cause we pass id when media to find the right index i will change this later (this happens cause each timeline pass its index not index from mediaFiles array)
            const actualIndex = frames.findIndex(frame => frame.id === index as unknown as string);
            dispatch(setActiveFrameIndex(actualIndex));
            
            //console.log(frames[actualIndex].order / fps);
            //dispatch(setCurrentTime(frames[actualIndex].order / fps));
        }
    };

    const handleDrag = (clip: MediaFile, frameIndex: number, target: HTMLElement, left: number) => {
        // no negative left
        const constrainedLeft = Math.max(left, 0);
        const newPositionStart = constrainedLeft / frameSize;
        
        
        const newOrder = Math.floor(constrainedLeft/frameSize);
        const diff = newOrder - frames[frameIndex].order;
        //console.log(constrainedLeft, newOrder, diff);
        
        if (diff==0) {
          return;
        }
        
        const activeId = frames[frameIndex].id;
        frames[frameIndex] = {...frames[frameIndex], order: newOrder};
        frames.sort((a, b) => a.order - b.order);
        
        const newIndex = frames.findIndex(fr => fr.id === activeId);
        dispatch(setActiveFrameIndex(newIndex));
        
        
        appDispatch(setAnimations(animations.map(an =>
            ani.id === an.id ? { ...an, frames: frames } : an
        )));
        
        /*
        const updatedAnimation = {...animations[activeAnimationIndex], frames: frames};
        const updatedAnimations = [...animations];
        updatedAnimations[activeAnimationIndex] = updatedAnimation;
        console.log(updatedAnimation, updatedAnimations);
        appDispatch(setAnimations(updatedAnimations));
        */
        //console.log(frames, newPositionStart);

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

    
    
    //console.log(ani);
    

    return (  
              
        < >
          {ani != undefined && (<div>
        
            

            <div className="relative h-48 z-10">  

                
              {frames
                  .filter(frame => frame.isKeyframe === true && frame.thumbnail)
                  .map((frame, frameIndex) => (
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
                                  style={{
                                      objectFit: "contain",
                                  }}
                                  src={frame.thumbnail.src ? frame.thumbnail.src : ""}//"https://www.svgrepo.com/show/535454/image.svg"
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
                                  handleDrag(frame.image, frameIndex, target as HTMLElement, left);
                                  //console.log(left);
                              }}
                              onDragEnd={({ target, isDrag, clientX, clientY }) => {
                                  /*for (var i = 0; i<frames.length; i++) {
                                      onUpdateMedia(frames[i].image.id, frames[i].image);
                                      onUpdateMedia(frames[i].thumbnail.id, frames[i].thumbnail);
                                      onUpdateMedia(frames[i].reference.id, frames[i].reference);
                                  }*/
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
                                  /*if (direction[0] === 1) {
                                      handleClick(ani.id, frame.id)
                                      delta[0] && (target!.style.width = `${width}px`);
                                      handleRightResize(frame, target as HTMLElement, width);

                                  }*/

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
