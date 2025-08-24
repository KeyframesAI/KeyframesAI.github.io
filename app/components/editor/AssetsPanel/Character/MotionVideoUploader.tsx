import React, { useRef, useState, useEffect } from "react";
import Modal from "react-modal";
import { ErrorMessage, Field, Formik } from "formik";
import * as Yup from "yup";
import toast from 'react-hot-toast';

import { getFile, useAppDispatch, useAppSelector } from "../../../../store";
import { setAnimations, setFilesID } from "../../../../store/slices/projectSlice";
import { storeFile } from "../../../../store";

import {poseTransfer, saveMediaFile} from "../../../../utils/callHuggingface";

interface CustomModalProps {
  isOpen: boolean;

  // onRequestClose does not return anything (indicated by void)
  // The void keyword means that the function does not return any value.

  onRequestClose: () => void;
  contentLabel: string;
}

const zipArrays = (...arr) => Array.from({ length: Math.max(...arr.map(a => a.length)) }, (_, i) => arr.map(a => a[i]));



const MotionVideoUploader: React.FC<CustomModalProps> = ({
  charId,
  isOpen,
  onRequestClose,
  contentLabel,
}) => {
  // Ref for the file Input element.
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };
  

  const { characters, animations, fps, filesID, resolution } = useAppSelector((state) => state.projectState);
  const dispatch = useAppDispatch();
  
  const modalStyle = {
    overlay: {zIndex: 1000}
  };
  
  
  const [char, setChar] = useState<Character>(null);
  
  useEffect(() => {
      const selected = characters.find((c) => c.id == charId);
      setChar(selected);

  }, [characters]);
  
  
  
  //getFileFromUrl("https://acmyu-keyframesai.hf.space/gradio_api/file=/tmp/gradio/6ec812eefefdcb1da6c9cb9f728b6954750506d22f771de050d322371e14ee50/image.png", "t.png");

  return (
    <Formik
      initialValues={{
        video: (null as File | null),
      }}
      // In summary, Yup is responsible for the schema-based validation, while Formik handles form management and state. Combining Yup with Formik provides a robust solution for building forms with client-side validation.

      validationSchema={Yup.object({
        video: Yup.mixed()
          .required("Required")
          .test("fileSize", "File size is too large", (value) => {
            // Size less than or equal to 100,000,000 bytes (100MB).
            return Array.from(value).every(val => val instanceof File && val.size <= 100000000);
            
          }),
      })}
      
      
      onSubmit =  {async (values, { setSubmitting, resetForm }) => {
        const result = { ...values };
        // console.log(result); // The is the result object for the form.
        setSubmitting(false);
        
        const toast_id = toast.loading('Generating animation...');
        
        
        resetForm();
        onRequestClose();
        
        try {
          const ch = characters.find((c) => c.id == charId);
          const [frames, thumbnails, coords, reference] = await poseTransfer(result, ch.images, ch.modelId, resolution);
          
          /*var frames_zipped = frames.map(function(e, i) {
            return [e, thumbnails[i]];
          });*/
          
          const frames_zipped = zipArrays(frames, thumbnails, coords, reference);
        
          const updatedAnimations = [...animations || []];
          const newAnimation = {
              id: crypto.randomUUID(),
              name: ch.name,
              frames: [],
              order: 0,
              startTime: 0,
              character: charId,
              referenceOpacity: 0,
              showPose: false,
              hidden: false,
          };
          
          var c = 0;
          const updatedFiles = [...filesID || []];
          for (const f of frames_zipped) {
              const frameId = crypto.randomUUID();
              
              const img = await saveMediaFile(f[0], c, updatedFiles, fps, resolution);
              const thumb = await saveMediaFile(f[1], c, updatedFiles, fps, resolution);
              const ref_img = await saveMediaFile(f[3], c, updatedFiles, fps, resolution);
              
              const pose = JSON.parse(f[2]);
              console.log(pose);
              const newPose = {
                  id: frameId,
                  body: pose["bodies"][0],
                  hand1: pose["hands"][0],
                  hand2: pose["hands"][1],
              }
              
              const newFrame = {
                  id: frameId,
                  order: c,
                  image: img,
                  thumbnail: thumb,
                  isKeyframe: true,
                  pose: newPose,
                  reference: ref_img,
              };
              
              newAnimation.frames.push(newFrame);
              
              c++;
          }
          
          updatedAnimations.push(newAnimation);
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
            Motion Video Upload
          </p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            

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
                    var selectedValue = e.target.files;
                    
                    if (values.video) {
                      selectedValue = [...values.video, ...selectedValue];
                    }
                    setFieldValue("video", selectedValue[0]);
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
  );
};

export default MotionVideoUploader;
