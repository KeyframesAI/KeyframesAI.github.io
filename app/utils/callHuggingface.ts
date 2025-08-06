"use client";

//import React from "react";
import { Client, handle_file } from "@gradio/client";

export const finetuneModel = async (images: File[], modelId: string) => {

  
  const hgToken = process.env.NEXT_PUBLIC_HG_TOKEN;
  console.log(hgToken);
  
  
  const app = await Client.connect("acmyu/KeyframesAI", { hf_token: hgToken }, {events: ["status", "data"]}); //await Client.duplicate("acmyu/KeyframesAI", { hf_token: hgToken });
  
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
      train_steps: 10, 		
      modelId: modelId, 
  });


  console.log(result);

  return modelId;
};


export const poseTransfer = async (video: File, images: File[], modelId: string) => {

  
  const hgToken = process.env.NEXT_PUBLIC_HG_TOKEN;
  console.log(hgToken);
  
  
  const app = await Client.connect("acmyu/KeyframesAI", { hf_token: hgToken }, {events: ["status", "data"]}); //await Client.duplicate("acmyu/KeyframesAI", { hf_token: hgToken });
  
  
  const imgs = []
  images.forEach((img) => {
      imgs.push({"image":handle_file(img.file),"caption":""});
  });
  
  const result = await app.predict("/run_inference", { 		
      images: imgs,
      video_path: {"video":handle_file(video.video)},
      train_steps: 10, 
      inference_steps: 10, 		
      fps: 12,
      modelId: modelId, 
  });

  console.log("done pose transfer");
  console.log(result);

  return result.data[1];
};


