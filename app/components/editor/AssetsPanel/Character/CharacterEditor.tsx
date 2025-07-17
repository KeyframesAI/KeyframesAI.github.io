import React, { useRef, useState, useEffect } from "react";
import Modal from "react-modal";
import { ErrorMessage, Field, Formik } from "formik";
import * as Yup from "yup";
import toast from 'react-hot-toast';

import { useAppDispatch, useAppSelector } from "../../../../store";
import { setCharacters } from "../../../../store/slices/projectSlice";
import { storeFile } from "../../../../store";

import {finetuneModel} from "../../../../utils/callHuggingface";

interface CustomModalProps {
  isOpen: boolean;

  // onRequestClose does not return anything (indicated by void)
  // The void keyword means that the function does not return any value.

  onRequestClose: () => void;
  contentLabel: string;
}

const CharacterEditor: React.FC<CustomModalProps> = ({
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
  
  const onDeleteChars = async (id: string) => {
      const onUpdateChars = characters.filter(f => f.id !== id);
      
      console.log(id);
      console.log(charId);
      
      if (onUpdateChars.length < characters.length) {
        dispatch(setCharacters(onUpdateChars));
        onRequestClose();
        toast.success('Character deleted successfully.');
      }
  };

  const { characters } = useAppSelector((state) => state.projectState);
  const dispatch = useAppDispatch();
  
  const modalStyle = {
    overlay: {zIndex: 1000}
  };
  
  
  const [char, setChar] = useState<Character>(null);
  
  useEffect(() => {
      const selected = characters.find((c) => c.id == charId);
      setChar(selected);

  }, [characters]);
  

  return (
    <Formik
      initialValues={{
        charName: char ? char.name : "",
        charType: char ? char.type : "",
        images: char ? char.images.map(img => img.file) : (null as File | null),
      }}
      // In summary, Yup is responsible for the schema-based validation, while Formik handles form management and state. Combining Yup with Formik provides a robust solution for building forms with client-side validation.

      validationSchema={Yup.object({
        charName: Yup.string().required("Required"),
        charType: Yup.string().required("Required"),
        images: Yup.mixed()
          .required("Required")
          .test("numImages", "Add more images", (value) => {
            return value.length >= 2;
            
          })
          .test("fileSize", "File size is too large", (value) => {
            // Size less than or equal to 100,000,000 bytes (100MB).
            return Array.from(value).every(val => val instanceof File && val.size <= 100000000);
            
          }),
      })}
      
      
      onSubmit =  {async (values, { setSubmitting, resetForm }) => {
        const result = { ...values };
        // console.log(result); // The is the result object for the form.
        setSubmitting(false);
        
        const updatedChars = [...characters || []];
        const newChar = {
            id: charId,
            name: result.charName,
            images: [],
            type: result.charType,
        };
        
        var imgChanged = false;
        var key = -1;
        
        if (charId != "") {
          Object.keys(updatedChars).forEach((i) => {
              if (updatedChars[i].id === charId) {
                  key = i;
              }
          });
        }
        
        if (updatedChars[key].images.length != result.images.length) {
            imgChanged=true;
        }
        
        for (const file of result.images) {
            if (key!=-1) {
              const exists = updatedChars[key].images.find((img) => img.name == file.name);
          
              if (exists) {
                newChar.images.push(exists)
                continue;
              }
            }
            
            
            const fileId = crypto.randomUUID();
            //await storeFile(file, fileId);
            const newImg = {
                id: fileId,
                file: file,
                name: file.name,
                type: 'image',
            };
    
            newChar.images.push(newImg)
            imgChanged = true;
        }
        
        
        
        if (imgChanged) {
          
          if (key != -1 && updatedChars[key].modelId) {
            newChar.modelId = updatedChars[key].modelId;
          } else {
            newChar.modelId = crypto.randomUUID();
          }
          
          finetuneModel(newChar.images.map(img => img.file), newChar.modelId);
        }
        
        if (key==-1) {
          newChar.id = crypto.randomUUID();
          updatedChars.push(newChar);
        } else {
          updatedChars[key] = newChar;
        }
        
        console.log(updatedChars);
        
        dispatch(setCharacters(updatedChars));
        toast.success('Character saved successfully.');
        
        resetForm();
        onRequestClose();
        
        
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
            Character Editor
          </p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="block py-2">
              <label className="py-2 text-sm font-semibold text-gray-500">
                Name
              </label>

              <Field
                type="text"
                name="charName"
                placeholder="Character name"
                onChange={handleChange}
                value={values.charName}
                className="w-full px-4 py-2 border border-gray-300 rounded"
              />

              <ErrorMessage
                name="charName"
                component="div"
                className="py-1 text-sm italic font-semibold text-red-500"
              />
            </div>
          
          
            <div className="block py-2">
              <label className="text-sm font-semibold text-gray-500 ">
                Character Type
              </label>

              <Field
                as="select"
                name="charType"
                onChange={handleChange}
                value={values.charType}
                className="w-full px-4 py-2 border border-gray-300 rounded "
              >
                <option value="">Select Character Type</option>
                <option value="Humanoid">Humanoid</option>
                <option value="Animal">Animal</option>
                <option value="Other">Other</option>
              </Field>

              <ErrorMessage
                name="charType"
                component="div"
                className="py-1 text-sm italic font-semibold text-red-500"
              />
            </div>

            <div className="block py-2">
              <div className="mb-3">
                <label className="text-sm font-semibold text-gray-500 ">
                  Images
                </label>
              </div>

              <div className="block w-full py-8 text-sm text-center border-2 border-dashed text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:text-sm file:font-semibold file:bg-violet-50 file:text-gray-500 hover:file:bg-violet-100">
                <label
                  className="flex items-center justify-center w-full h-full font-semibold text-gray-500 cursor-pointer"
                  htmlFor="file"
                  onClick={handleFileInputClick}
                >
                  <span className="flex items-center justify-center w-full h-full">
                    <p className="text-sm font-semibold">
                      Add at least 2 images of the character
                    </p>
                  </span>
                </label>
                <input
                  type="file"
                  className="hidden"
                  name="images"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    var selectedValue = e.target.files;
                    if (values.images) {
                      selectedValue = [...values.images, ...selectedValue];
                    }
                    setFieldValue("images", selectedValue);
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
            
            {charId!="" && (
              <button
                  onClick={() => onDeleteChars(charId)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                  aria-label="Delete file"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
              </button>
            )}

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
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Formik>
  );
};

export default CharacterEditor;
