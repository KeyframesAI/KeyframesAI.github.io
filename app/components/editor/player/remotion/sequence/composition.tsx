import { storeProject, useAppDispatch, useAppSelector } from "@/app/store";
import { SequenceItem } from "./sequence-item";
import { PoseSequenceItem } from "./pose-sequence-item";
import { MediaFile, TextElement, Frame } from "@/app/types";
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { use, useCallback, useEffect, useRef, useState } from "react";
import { setCurrentTime, setMediaFiles, setActiveFrameIndex } from "@/app/store/slices/projectSlice";

const Composition = () => {
    const projectState = useAppSelector((state) => state.projectState);
    const { animations, mediaFiles, textElements, fps, activeAnimationIndex, isPlaying, currentTime } = projectState;
    const frame = useCurrentFrame();
    const dispatch = useAppDispatch();

    const THRESHOLD = 1/fps; // Minimum change to trigger dispatch (in seconds)
    const previousTime = useRef(0); // Store previous time to track changes

    useEffect(() => {
        if (isPlaying) {
          const currentTimeInSeconds = frame / fps;
          if (Math.abs(currentTimeInSeconds - previousTime.current) > THRESHOLD) {
              //console.log(currentTimeInSeconds, previousTime.current);
              if (currentTimeInSeconds !== undefined) {
                  //console.log(frame, currentTimeInSeconds, previousTime.current);
                  dispatch(setCurrentTime(currentTimeInSeconds));
                  //console.log(animations);
                  //if (animations.length>0 && frame < animations[activeAnimationIndex].frames.length) {
                  //  dispatch(setActiveFrameIndex(frame));
                  //}
              }
          }
        }

    }, [frame, dispatch]);
    
    //console.log(animations);
    
    const getFrameSequenceItem = (item: MediaFile | undefined, order: number, duration: number, opacity: number | undefined) => {
    
        if (!item) return;
        const trackItem = {
            ...item,
            opacity: opacity,
        } as MediaFile;
        
        
        return SequenceItem[trackItem.type](trackItem, {
            fps,
            order,
            duration,
        });
      
    };
    
    
    const getPoseSequenceItem = (f: Frame, index: number) => {
        const item = f.reference;
        
        if (!item) return;
        const trackItem = {
            ...item,
        } as MediaFile;
        
        
        return PoseSequenceItem(trackItem, {
            fps: fps, 
            order: f.order,
            duration: f.duration,
            pose_raw: f.pose?.body,
            animations: animations,
            activeAnimationIndex: activeAnimationIndex,
            frame_index: index,
        }, f);
      
    };
      
    return (
        <>
            {/* frame */}
            {animations
              .map((ani) => {
                if (!ani.hidden) {
                    return ani.frames
                      .map((fr) => {
                          return getFrameSequenceItem(fr.thumbnail, fr.order, fr.duration, fr.thumbnail.opacity);
                      })
                }
              })
            }
            
            
            {/* reference */}
            {animations
              .map((ani) => {
                if (animations[activeAnimationIndex].id == ani.id && ani.referenceOpacity>0 && !ani.hidden) {
                  return ani.frames
                    .map((fr) => {
                        return getFrameSequenceItem(fr.reference, fr.order, fr.duration, ani.referenceOpacity);
                    })
                }
              })
            }
            
            
            {/* onion skinning */}
            {animations
              .map((ani) => {
                if (!ani.hidden && animations[activeAnimationIndex].id == ani.id) {
                    var items = [];
                    for (const [index, f] of ani.frames.entries()) {
                      for (var layer=(-1*ani.onionSkinning); layer<=ani.onionSkinning; layer++) {
                        const i = index+layer;
                        if (layer==0 || i<0 || i>=ani.frames.length) {
                          continue;
                        }
                        const fr = {...ani.frames[i].thumbnail, id:crypto.randomUUID(), positionStart: f.thumbnail.positionStart, positionEnd: f.thumbnail.positionEnd};
                        const opacity = (1.0 - Math.abs(layer) / (ani.onionSkinning+1)) / 2.0;
                        //console.log(opacity);
                        if (f.thumbnail.opacity) {
                          items.push(getFrameSequenceItem(fr, f.order, f.duration, f.thumbnail.opacity * opacity));
                        }
                      }
                    }
                    return items;
                }
              })
            }
            
            
            {/* pose */}
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
