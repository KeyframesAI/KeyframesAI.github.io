import { Player, PlayerRef } from "@remotion/player";
import Composition from "./sequence/composition";
import { useAppSelector, useAppDispatch } from "@/app/store";
import { useRef, useState, useEffect } from "react";
import { setIsPlaying, setCurrentTime } from "@/app/store/slices/projectSlice";
import { useDispatch } from "react-redux";


export const PreviewPlayer = () => {
    const projectState = useAppSelector((state) => state.projectState);
    const { duration, currentTime, isPlaying, isMuted, fps, animations } = projectState;
    const playerRef = useRef<PlayerRef>(null);
    const dispatch = useDispatch();

    // update frame when current time with marker
    useEffect(() => {
        const frame = Math.floor(currentTime * fps);
        //console.log(currentTime, frame);
        if ((frame || frame===0) && playerRef.current && !isPlaying) {
            playerRef.current.pause();
            playerRef.current.seekTo(frame);
        }
    }, [currentTime, fps]);
    
    useEffect(() => {
        
        //console.log(currentTime);
        if (playerRef.current && playerRef.current.isPlaying()) {
            console.log(Math.round(currentTime * fps), playerRef.current.getCurrentFrame());
        }
    }, [playerRef]);
    
    /*const onFrameUpdate: CallbackListener<'frameupdate'> = (e) => {
      console.log('frame has updated to ' + e.detail.frame);
      dispatch(setCurrentTime(e.detail.frame/fps));
    };*/
      
    //console.log(currentTime);

    useEffect(() => {
        playerRef?.current?.addEventListener("play", () => {
            dispatch(setIsPlaying(true));
        });
        playerRef?.current?.addEventListener("pause", () => {
            dispatch(setIsPlaying(false));
        });
        playerRef?.current?.addEventListener("ended", () => {
            dispatch(setCurrentTime(0));
        });
        //playerRef?.current?.addEventListener('timeupdate', onTimeupdate);
        //playerRef?.current?.addEventListener('frameupdate', onFrameUpdate);
        return () => {
            playerRef?.current?.removeEventListener("play", () => {
                dispatch(setIsPlaying(true));
            });
            playerRef?.current?.removeEventListener("pause", () => {
                dispatch(setIsPlaying(false));
            });
            playerRef?.current?.removeEventListener("ended", () => {
                dispatch(setCurrentTime(0));
            });
            //playerRef?.current?.removeEventListener('frameupdate', onFrameUpdate);
        };
    }, [playerRef]);

    // to control with keyboard
    useEffect(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.mute();
        } else {
            playerRef.current.unmute();
        }
    }, [isMuted]);
    
    //console.log(duration, fps);
    

    return (
        <Player
            ref={playerRef}
            component={Composition}
            inputProps={{}}
            durationInFrames={Math.floor(duration * fps) + 1}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={fps}
            style={{ width: "100%", height: "100%" }}
            clickToPlay={false}
            controls
        />
    )
};