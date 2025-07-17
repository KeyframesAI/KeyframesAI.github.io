import { Client, handle_file } from "@gradio/client";

export const finetuneModel = async (images: File[]) => {
  const modelId = crypto.randomUUID();
  
  /*
  const app = await Client.connect("acmyu/KeyframesAI", { hf_token: "" }, {events: ["status", "data"]}); //await Client.duplicate("acmyu/KeyframesAI", { hf_token: "" });

  const result = await app.predict(
    "/run_app", {
      images: [
        {"image":handle_file(selectedImgs[0]),"caption":""},
        {"image":handle_file(selectedImgs[1]),"caption":""},
        {"image":handle_file(selectedImgs[2]),"caption":""}
        
      ],
      video_path: {"video":handle_file(selectedVid),"caption":""},
      train_steps: 10,
      inference_steps: 10,
      fps: 12,
      bg_remove: false,
      resize_inputs: true,
  });


  console.log(result);*/

  return modelId;
};