"use client";

//import React from "react";
import { Client, handle_file } from "@gradio/client";
import { storeFile, deleteFile, getFile } from "../store";
import { MediaFile, Frame, ProjectState } from "@/app/types";


/*
const https = require('https'); // Use https for secure URLs
const fs = require('fs');


var request = require('request');
*/


const hg_space = "acmyu/KeyframesAI2"
const train_steps = 100

async function getFileFromUrl(url: string, name: string, defaultType:string = 'image/png'){

  //console.log(url);
  const response = await fetch(url);
  //console.log(response);
  
  const data = await response.blob();
  return new File([data], name, {
    type: data.type || defaultType,
  });
  
}

async function getFrames(data: any[]){
  var frames = [];
  var c = 0;
  for (const frame of data) {
      const url = frame.image.url;
      if (url) {
        const img = await getFileFromUrl(url, 'frame'+c+url.substring(url.lastIndexOf('.')));
        frames.push(img);
      }
      c++;
  }
  return frames;
}

const getImageDimensions = (url: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({
      width: img.width,
      height: img.height,
    });
    img.onerror = (error) => reject(error);
    img.src = url;
  });
};

export const saveMediaFile = async (file: File, i: number, updatedFiles: string[], fps: number, resolution: any) => {
    
    const fileId = crypto.randomUUID();
    await storeFile(file, fileId);
  
  
    updatedFiles.push(fileId);
  
    //console.log('save media file');
    //console.log(updatedFiles);
    
    const url = URL.createObjectURL(file);
    const {width, height} = await getImageDimensions(url);
    
    const img: MediaFile = {
        id: fileId,
        fileName: file.name,
        fileId: fileId,
        startTime: 0,
        endTime: 1/fps,
        src: url,
        positionStart: i/fps,
        positionEnd: (i+1)/fps,
        includeInMerge: true,
        x: 0,
        y: 0,
        width: width,
        height: height,
        rotation: 0,
        opacity: 100,
        crop: { x: 0, y: 0, width: resolution.width, height: resolution.height },
        playbackSpeed: 1,
        volume: 100,
        type: 'frame',
        zIndex: 0,
    };
    
    return img;
};


export const getUpdatedHistory = (state: ProjectState, deleted: string[] = []) => {
    const animations = state.animations.map(ani => {
      return {...ani, frames: ani.frames.map(fr => {
        return {...fr}
      })}
    });
    const st = {...state, animations: animations, lastModified: Date.now().toString()};
    
    if (deleted) {
        st.deletedFiles = deleted;
    }
    
    const updatedHistory = [...Array.from(state.history)];
    updatedHistory.push(st);
    
    while (updatedHistory.length > 10) {
        const removed = updatedHistory.shift();
        if (removed && removed.deletedFiles) {
          for (const file of removed.deletedFiles) {
              deleteFile(file);
          }
        }
    }
    
    //console.log(updatedHistory);
    
    return updatedHistory;
};


export const finetuneModel = async (images: File[], modelId: string) => {

  console.log("finetuneModel");
  const hgToken = (process.env.NEXT_PUBLIC_HG_TOKEN as `hf_${string}`);
  //console.log(hgToken);
  
  
  const app = await Client.connect(hg_space, { hf_token: hgToken, events: ["status", "data"]}); //await Client.duplicate("acmyu/KeyframesAI", { hf_token: hgToken });
  
  const imgs: any[] = []
  images.forEach((img) => {
      imgs.push({"image":handle_file(img),"caption":""});
  });
  
  
  const result = await app.predict("/run_train", { 		
      images: imgs, /*[
        {"image":handle_file(images[0]),"caption":""},
        {"image":handle_file(images[1]),"caption":""},
        {"image":handle_file(images[2]),"caption":""}
        
      ],*/
      train_steps: train_steps, 		
      modelId: modelId, 
      resize_inputs: false,
  });


  console.log(result);

  return modelId;
};




export const poseTransfer = async (video: File | null, refFrames: File[] | null, images: any[], modelId: string | undefined, resolution: any) => {
  /*var frames = [];
  const img = await getFileFromUrl('https://tmpfiles.org/dl/9447583/41976c0d-67b0-42cc-8179-03a72f55dfac.png', 'test.png');
  frames.push(img);*/

  console.log("poseTransfer");
  const hgToken = (process.env.NEXT_PUBLIC_HG_TOKEN as `hf_${string}`);
  //console.log(hgToken);
  
  
  const app = await Client.connect(hg_space, { hf_token: hgToken, events: ["status", "data"]}); //await Client.duplicate("acmyu/KeyframesAI", { hf_token: hgToken });
  
  
  const imgs: any[] = [];
  images.forEach((img) => {
      imgs.push({"image":handle_file(img.file),"caption":""});
  });
  
  console.log(video, refFrames);
  
  const fr: any[] = [];
  if (refFrames) {
    [...refFrames].forEach((img) => {
        fr.push({"image":handle_file(img),"caption":""});
    });
  }
  
  var vid = null;
  if (video) {
    vid = {"video":handle_file(video)};
  }
  
  console.log(vid, fr);
  
  const result = await app.predict("/run_inference", { 		
      images: imgs,
      video_path: vid,
      frames: fr,
      train_steps: train_steps, 
      inference_steps: 10, 		
      fps: 12,
      modelId: modelId, 
      img_width: resolution.width,
      img_height: resolution.height,
      resize_inputs: false,
  });

  console.log("done pose transfer");
  console.log(result);
  
  const data = (result.data as any)

  
  const frames = await getFrames(data[1]);
  const thumbnails = await getFrames(data[2]);
  
  const coords = data[3]
  const reference = await getFrames(data[4]);
  
  
  console.log(frames);
  console.log(thumbnails)
  console.log(coords)

  return [frames, thumbnails, coords, reference];
};


export const generateFrame = async (poses: any, images: any[], modelId: string | undefined, width: number | undefined, height: number | undefined) => {
  /*var frames = [];
  const img = await getFileFromUrl('https://tmpfiles.org/dl/9447583/41976c0d-67b0-42cc-8179-03a72f55dfac.png', 'test.png');
  frames.push(img);*/

  console.log("generateFrame");
  const hgToken = (process.env.NEXT_PUBLIC_HG_TOKEN as `hf_${string}`);
  //console.log(hgToken);
  
  
  const app = await Client.connect(hg_space, { hf_token: hgToken, events: ["status", "data"]}); //await Client.duplicate("acmyu/KeyframesAI", { hf_token: hgToken });
  
  
  const imgs: any[] = [];
  images.forEach((img) => {
      imgs.push({"image":handle_file(img.file),"caption":""});
  });
  
  const result = await app.predict("/run_generate_frame", { 		
      images: imgs,
      target_poses: poses,
      train_steps: train_steps, 
      inference_steps: 10, 		
      modelId: modelId, 
      img_width: width,
      img_height: height,
      resize_inputs: false,
  });

  console.log("done generateFrame");
  console.log(result);

  const data = (result.data as any)
  
  const frames = await getFrames(data[0]);
  const thumbnails = await getFrames(data[1]);

  //console.log(frames);
  //console.log(thumbnails)

  return [frames, thumbnails];
};


export const interpolateFrames = async (frame1: MediaFile, frame2: MediaFile, times_to_interp: number, removebg: boolean) => {

  console.log("interpolateFrames");
  const hgToken = (process.env.NEXT_PUBLIC_HG_TOKEN as `hf_${string}`);
  //console.log(hgToken);
  
  
  const app = await Client.connect(hg_space, { hf_token: hgToken, events: ["status", "data"]}); //await Client.duplicate("acmyu/KeyframesAI", { hf_token: hgToken });
  
  
  const img1 = await getFile(frame1.id);
  const img2 = await getFile(frame2.id);
  //console.log(img1, img2);
  
  const result = await app.predict("/run_interpolate_frames", { 		
      frame1: handle_file(img1),
      frame2: handle_file(img2),
      times_to_interp: times_to_interp,
      remove_bg: removebg,
  });

  console.log("done interpolateFrames");
  console.log(result);

  const data = (result.data as any)
  
  const frames = await getFrames(data[0]);
  const thumbnails = await getFrames(data[1]);

  //console.log(frames);
  //console.log(thumbnails)

  return [frames, thumbnails];
};





