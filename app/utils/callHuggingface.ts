"use client";

//import React from "react";
import { Client, handle_file } from "@gradio/client";
import { storeFile } from "../store";

/*
const https = require('https'); // Use https for secure URLs
const fs = require('fs');


var request = require('request');
*/


const hg_space = "acmyu/KeyframesAI2"
const train_steps = 100

async function getFileFromUrl(url, name, defaultType = 'image/png'){

  //console.log(url);
  const response = await fetch(url);
  //console.log(response);
  
  const data = await response.blob();
  return new File([data], name, {
    type: data.type || defaultType,
  });
  
}

async function getFrames(data){
  var frames = [];
  var c = 0;
  for (const frame of data) {
      const url = frame.image.url;
      const img = await getFileFromUrl(url, 'frame'+c+url.substring(url.lastIndexOf('.')));
      frames.push(img);
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

export const saveMediaFile = async (file, i, updatedFiles, fps, resolution) => {
    const fileId = crypto.randomUUID();
    await storeFile(file, fileId);
    
    updatedFiles.push(fileId);
    //console.log('save media file');
    //console.log(updatedFiles);
    
    const url = URL.createObjectURL(file);
    const {width, height} = await getImageDimensions(url);
    
    const img = {
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



export const finetuneModel = async (images: File[], modelId: string) => {

  console.log("finetuneModel");
  const hgToken = process.env.NEXT_PUBLIC_HG_TOKEN;
  //console.log(hgToken);
  
  
  const app = await Client.connect(hg_space, { hf_token: hgToken }, {events: ["status", "data"]}); //await Client.duplicate("acmyu/KeyframesAI", { hf_token: hgToken });
  
  const imgs = []
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
  });


  console.log(result);

  return modelId;
};




export const poseTransfer = async (video: File, images: File[], modelId: string, resolution) => {
  /*var frames = [];
  const img = await getFileFromUrl('https://tmpfiles.org/dl/9447583/41976c0d-67b0-42cc-8179-03a72f55dfac.png', 'test.png');
  frames.push(img);*/

  console.log("poseTransfer");
  const hgToken = process.env.NEXT_PUBLIC_HG_TOKEN;
  //console.log(hgToken);
  
  
  const app = await Client.connect(hg_space, { hf_token: hgToken }, {events: ["status", "data"]}); //await Client.duplicate("acmyu/KeyframesAI", { hf_token: hgToken });
  
  
  const imgs = []
  images.forEach((img) => {
      imgs.push({"image":handle_file(img.file),"caption":""});
  });
  
  const result = await app.predict("/run_inference", { 		
      images: imgs,
      video_path: {"video":handle_file(video.video)},
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

  
  const frames = await getFrames(result.data[1]);
  const thumbnails = await getFrames(result.data[2]);
  
  const coords = result.data[3]
  const reference = await getFrames(result.data[4]);
  
  
  console.log(frames);
  console.log(thumbnails)
  console.log(coords)

  return [frames, thumbnails, coords, reference];
};


export const generateFrame = async (poses: string, images: File[], modelId: string, width, height) => {
  /*var frames = [];
  const img = await getFileFromUrl('https://tmpfiles.org/dl/9447583/41976c0d-67b0-42cc-8179-03a72f55dfac.png', 'test.png');
  frames.push(img);*/

  console.log("generateFrame");
  const hgToken = process.env.NEXT_PUBLIC_HG_TOKEN;
  //console.log(hgToken);
  
  
  const app = await Client.connect(hg_space, { hf_token: hgToken }, {events: ["status", "data"]}); //await Client.duplicate("acmyu/KeyframesAI", { hf_token: hgToken });
  
  
  const imgs = []
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

  
  const frames = await getFrames(result.data[0]);
  const thumbnails = await getFrames(result.data[1]);

  //console.log(frames);
  //console.log(thumbnails)

  return [frames, thumbnails];
};




