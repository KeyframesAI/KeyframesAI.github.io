import { storeProject, useAppDispatch, useAppSelector } from "@/app/store";
import { SequenceItem } from "./sequence-item";
import { PoseSequenceItem } from "./pose-sequence-item";
import { MediaFile, TextElement } from "@/app/types";
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { use, useCallback, useEffect, useRef, useState } from "react";
import { setCurrentTime, setMediaFiles, setActiveFrameIndex } from "@/app/store/slices/projectSlice";

const Composition = () => {
    const projectState = useAppSelector((state) => state.projectState);
    const { animations, mediaFiles, textElements, fps, activeAnimationIndex, isPlaying } = projectState;
    const frame = useCurrentFrame();
    const dispatch = useAppDispatch();

    const THRESHOLD = 1/fps; // Minimum change to trigger dispatch (in seconds)
    const previousTime = useRef(0); // Store previous time to track changes

    useEffect(() => {
        const currentTimeInSeconds = frame / fps;
        if (Math.abs(currentTimeInSeconds - previousTime.current) > THRESHOLD) {
            if (currentTimeInSeconds !== undefined) {
                //console.log(frame, currentTimeInSeconds, previousTime.current);
                dispatch(setCurrentTime(currentTimeInSeconds));
                //console.log(animations);
                if (animations.length>0 && frame < animations[activeAnimationIndex].frames.length) {
                  dispatch(setActiveFrameIndex(frame));
                }
            }
        }

    }, [frame, dispatch]);
    
    //console.log(animations);
    
    const getFrameSequenceItem = (item, opacity=100) => {
    
        if (!item) return;
        const trackItem = {
            ...item,
            opacity: opacity,
        } as MediaFile;
        
        
        return SequenceItem[trackItem.type](trackItem, {
            fps
        });
      
    };
    
    
    const getPoseSequenceItem = (frame, index) => {
        const item = frame.reference;
        
        if (!item) return;
        const trackItem = {
            ...item,
        } as MediaFile;
        
        
        return PoseSequenceItem[trackItem.type](trackItem, {
            fps: fps, 
            pose_raw: frame.pose.body,
            animations: animations,
            activeAnimationIndex: activeAnimationIndex,
            frame_index: index,
        });
      
    };
      
    return (
        <>
            {animations
              .map((ani) => {
                if (animations[activeAnimationIndex].id == ani.id && ani.showPose) {
                  return ani.frames
                    .map((fr, index) => {
                      if (fr.pose) {
                        return getPoseSequenceItem(fr, index);
                      }
                    })
                }
              })
            }
            
        
            {animations
              .map((ani) => {
                if (!ani.hidden) {
                    return ani.frames
                      .map((fr) => {
                          return getFrameSequenceItem(fr.thumbnail, fr.thumbnail.opacity);
                      })
                }
              })
            }
            
            {animations
              .map((ani) => {
                if (animations[activeAnimationIndex].id == ani.id && ani.referenceOpacity>0 && !ani.hidden) {
                  return ani.frames
                    .map((fr) => {
                        return getFrameSequenceItem(fr.reference, ani.referenceOpacity);
                    })
                }
              })
            }
            
            
        
        
        
        
            {mediaFiles
                .map((item: MediaFile) => {
                    if (!item) return;
                    const trackItem = {
                        ...item,
                    } as MediaFile;
                    return SequenceItem[trackItem.type](trackItem, {
                        fps
                    });
                })}
            {textElements
                .map((item: TextElement) => {
                    if (!item) return;
                    const trackItem = {
                        ...item,
                    } as TextElement;
                    return SequenceItem["text"](trackItem, {
                        fps
                    });
                })}
        </>
    );
};

export default Composition;
