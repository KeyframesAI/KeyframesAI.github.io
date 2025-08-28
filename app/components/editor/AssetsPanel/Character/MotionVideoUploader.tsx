import React, { useRef, useState, useEffect } from "react";
import Modal from "react-modal";
import { ErrorMessage, Field, Formik } from "formik";
import * as Yup from "yup";
import toast from 'react-hot-toast';

import { getFile, useAppDispatch, useAppSelector } from "../../../../store";
import { setAnimations, setFilesID, setHistory } from "../../../../store/slices/projectSlice";
import { storeFile } from "../../../../store";
import { Character, CharacterType, Frame, Pose } from "@/app/types";

import {poseTransfer, saveMediaFile, getUpdatedHistory} from "../../../../utils/callHuggingface";

interface CustomModalProps {
  isOpen: boolean;

  // onRequestClose does not return anything (indicated by void)
  // The void keyword means that the function does not return any value.

  onRequestClose: () => void;
  contentLabel: string;
}

const zipArrays = (...arr: any[]) => Array.from({ length: Math.max(...arr.map(a => a.length)) }, (_, i) => arr.map(a => a[i]));



const MotionVideoUploader: React.FC<CustomModalProps> = ({
  isOpen,
  onRequestClose,
  contentLabel,
}) => {
  // Ref for the file Input element.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const charId = contentLabel;
  

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };
  const handleImgInputClick = () => {
    imgInputRef.current?.click();
  };
  
  const projectState = useAppSelector((state) => state.projectState);
  const { characters, animations, fps, filesID, resolution, activeAnimationIndex } = projectState;
  const dispatch = useAppDispatch();
  
  const modalStyle = {
    overlay: {zIndex: 1000}
  };
  
  
  const [char, setChar] = useState<Character | null | undefined>(null);
  
  useEffect(() => {
      const selected = characters.find((c) => c.id == charId);
      setChar(selected);

  }, [characters]);
  
  
  
  
  //getFileFromUrl("https://acmyu-keyframesai.hf.space/gradio_api/file=/tmp/gradio/6ec812eefefdcb1da6c9cb9f728b6954750506d22f771de050d322371e14ee50/image.png", "t.png");

  return (
    < >
    <Formik
      initialValues={{
        video: (null as File | null),
        images: (null as File[] | null),
        addToAnimation: "new",
      }}
      // In summary, Yup is responsible for the schema-based validation, while Formik handles form management and state. Combining Yup with Formik provides a robust solution for building forms with client-side validation.

      validationSchema={Yup.object({
        video: Yup.mixed()
          //.required("Required")
          .nullable()
          /*.test("fileSize", "File size is too large", (value) => {
            // Size less than or equal to 100,000,000 bytes (100MB).
            return Array.from(value).every(val => val instanceof File && val.size <= 100000000);
            
          })*/,
        images: Yup.mixed().nullable(),
        addToAnimation: Yup.mixed().notRequired(),
      })}
      
      
      onSubmit =  {async (values, { setSubmitting, resetForm }) => {
        dispatch(setHistory(getUpdatedHistory(projectState)));
      
        const result = { ...values };
         console.log(result); // The is the result object for the form.
         //return;
        setSubmitting(false);
        
        var aniIndex = -1;
        if (result.addToAnimation == "selected" && animations.length>0) {
          aniIndex = activeAnimationIndex;
        }
        
        
        const toast_id = toast.loading('Generating animation...');
        
        
        resetForm();
        onRequestClose();
        
        try {
          const ch = characters.find((c) => c.id == charId);
          
          if (!ch) {
            throw new Error("Unable to find character");
          }
          
          const [frames, thumbnails, coords, reference] = await poseTransfer(result.video, result.images, ch.images, ch.modelId, resolution);
          
          const updatedAnimations = [...animations || []];
          var newAnimation = null;
          if (aniIndex == -1) {
              newAnimation = {
                  id: crypto.randomUUID(),
                  name: ch.name,
                  frames: [],
                  order: 0,
                  character: charId,
                  referenceOpacity: 0,
                  onionSkinning: 0,
                  showPose: false,
                  hidden: false,
              };
          } else {
              newAnimation = {...animations[aniIndex]};
          }
          
          
          
          /*var frames_zipped = frames.map(function(e, i) {
            return [e, thumbnails[i]];
          });*/
          
          const frames_zipped = zipArrays(frames, thumbnails, coords, reference);
        
          
          
          var c = newAnimation.frames.length;
          const updatedFiles = [...filesID || []];
          const updatedFrames = [...newAnimation.frames]
          for (const f of frames_zipped) {
              const frameId = crypto.randomUUID();
              
              const img = await saveMediaFile(f[0], c, updatedFiles, fps, resolution);
              const thumb = await saveMediaFile(f[1], c, updatedFiles, fps, resolution);
              const ref_img = await saveMediaFile(f[3], c, updatedFiles, fps, resolution);
              
              const pose = JSON.parse(f[2]);
              //console.log(pose);
              const newPose: Pose = {
                  id: frameId,
                  body: pose["bodies"][0],
                  hand1: pose["hands"][0],
                  hand2: pose["hands"][1],
              }
              
              const newFrame: Frame = {
                  id: frameId,
                  order: c,
                  image: img,
                  thumbnail: thumb,
                  isKeyframe: true,
                  duration: 1,
                  pose: newPose,
                  reference: ref_img,
              };
              
              updatedFrames.push(newFrame);
              
              c++;
          }
          
          newAnimation.frames = updatedFrames;
          if (aniIndex == -1) {
            updatedAnimations.push(newAnimation);
          } else {
            updatedAnimations[aniIndex] = newAnimation;
          }
          dispatch(setAnimations(updatedAnimations));
          dispatch(setFilesID(updatedFiles));
          
          
          
          toast.success('Animation added successfully.', { id: toast_id });
          console.log(updatedAnimations);
        
        } catch(err) {
          toast.error('Error generating the animation', { id: toast_id });
          throw err;
        }
        
      }}
      enableReinitialize={true} // Enable reinitialization of initial values
    >
      {({
        values,
        setFieldValue,
        handleChange,
        handleReset,
        handleSubmit,
        isSubmitting,
      }) => (
        <Modal
          ariaHideApp={false}
          isOpen={isOpen}
          onRequestClose={onRequestClose}
          contentLabel={contentLabel}
          style={modalStyle}
        >
          <p className="w-full pb-8 text-sm text-gray-800 fon">
            Create Animation
          </p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          
            <div className="block py-2">
              <label className="text-sm font-semibold text-gray-500 ">
                Add to Layer
              </label>

              <Field
                as="select"
                name="addToAnimation"
                onChange={handleChange}
                value={values.addToAnimation}
                className="w-full px-4 py-2 border border-gray-300 rounded "
              >
                <option value="new">New Layer</option>
                <option value="selected">Selected Layer</option>
              </Field>

              <ErrorMessage
                name="charType"
                component="div"
                className="py-1 text-sm italic font-semibold text-red-500"
              />
            </div>
            

            <div className="block py-2">

              <div className="block w-full py-8 text-sm text-center border-2 border-dashed text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:text-sm file:font-semibold file:bg-violet-50 file:text-gray-500 hover:file:bg-violet-100">
                <label
                  className="flex items-center justify-center w-full h-full font-semibold text-gray-500 cursor-pointer"
                  htmlFor="file"
                  onClick={handleFileInputClick}
                >
                  <span className="flex items-center justify-center w-full h-full">
                    <p className="text-sm font-semibold">
                      Add a motion-capture video
                    </p>
                  </span>
                </label>
                <input
                  type="file"
                  className="hidden"
                  name="video"
                  accept="video/*"
                  ref={fileInputRef}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const selectedValue = e.target.files;

                    if (selectedValue) {
                      setFieldValue("video", selectedValue[0]);
                    }
                  }}
                />
                
                {values.video && (
                  <div>
                    <video 
                      width="400" 
                      style={{display: 'inline'}} 
                      className="block p-2" 
                      src={URL.createObjectURL(values.video)} 
                      controls>
                    </video>
                    
                    <div className="block py-2">
                      <button onClick={() => {
                        setFieldValue("video", null);
                      }}>Clear</button>
                    </div>
                  </div>
                )}
                
              </div>
              <ErrorMessage
                name="video"
                component="div"
                className="py-1 text-sm italic font-semibold text-red-500 "
              />
            </div>
            
            
            

            
            
            
            <div className="block py-2 text-center justify-center">
              <label className="py-2 text-lg font-semibold text-gray-500 items-center justify-center">
                - or -
              </label>
            </div>
            
            
            <div className="block py-2">

              <div className="block w-full py-8 text-sm text-center border-2 border-dashed text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:text-sm file:font-semibold file:bg-violet-50 file:text-gray-500 hover:file:bg-violet-100">
                <label
                  className="flex items-center justify-center w-full h-full font-semibold text-gray-500 cursor-pointer"
                  htmlFor="file"
                  onClick={handleImgInputClick}
                >
                  <span className="flex items-center justify-center w-full h-full">
                    <p className="text-sm font-semibold">
                      Add pose reference images for each frame
                    </p>
                  </span>
                </label>
                <input
                  type="file"
                  className="hidden"
                  name="images"
                  multiple
                  accept="image/*"
                  ref={imgInputRef}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const selectedValue = e.target.files;
                    if (selectedValue) {
                      if (values.images) {
                        const imgs = (values.images as File[]);
                        setFieldValue("images", [...imgs, ...Array.from(selectedValue)]);
                      } else {
                        setFieldValue("images", selectedValue);
                      }
                    }
                  }}
                />
                
                {values.images && (
                  <div>
                    {
                      Array.from(values.images).map(
                        (image, index) =>    
                        <img
                          key={index}
                          alt="preview"
                          width={"250px"}
                          src={URL.createObjectURL(image)}
                          style={{display: 'inline'}}
                          className="block p-2"
                        />
                      )
                    }
                    <div className="block py-2">
                    <button onClick={() => {
                      setFieldValue("images", null);
                    }}>Clear</button>
                    </div>
                  </div>
                )}
                
              </div>
              <ErrorMessage
                name="images"
                component="div"
                className="py-1 text-sm italic font-semibold text-red-500 "
              />
            </div>
            
            <img id="server-result-frame"></img>
            
            
            <div className="flex justify-end mt-4 space-x-4 text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-700">
              <button
                onClick={() => {
                  handleReset();
                  onRequestClose();
                }}
                className="mt-4 font-semibold text-gray-500 hover:text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 mt-4 font-medium text-white bg-indigo-400 rounded-md "
              >
                Generate Animation
              </button>
            </div>
  
          </form>
        </Modal>
      )}
    </Formik>
    
    
    </>
  );
};

export default MotionVideoUploader;
