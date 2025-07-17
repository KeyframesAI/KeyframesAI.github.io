import React, { useRef, useState } from "react";
import Modal from "react-modal";
import { ErrorMessage, Field, Formik } from "formik";
import * as Yup from "yup";

interface CustomModalProps {
  isOpen: boolean;

  // onRequestClose does not return anything (indicated by void)
  // The void keyword means that the function does not return any value.

  onRequestClose: () => void;
  contentLabel: string;
}

const CharacterModal: React.FC<CustomModalProps> = ({
  isOpen,
  onRequestClose,
  contentLabel,
}) => {
  // Ref for the file Input element.
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [preview, setPreview] = useState(null);

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };
  
  const modalStyle = {
    overlay: {zIndex: 1000}
  };

  return (
    <Formik
      initialValues={{
        requestType: "",
        file: null as File | null,
      }}
      // In summary, Yup is responsible for the schema-based validation, while Formik handles form management and state. Combining Yup with Formik provides a robust solution for building forms with client-side validation.

      validationSchema={Yup.object({
        requestType: Yup.string().required("Required"),
        file: Yup.mixed()
          .required("Required")
          .test("numImages", "Add more images", (value) => {
            // Size less than or equal to 1,000,000 bytes (1MB).
            return value.length >= 2;
            
          })
          .test("fileSize", "File size is too large", (value) => {
            // Size less than or equal to 1,000,000 bytes (1MB).
            return Array.from(value).every(val => val instanceof File && val.size <= 1000000);
            
          }),
      })}
      onSubmit={(values, { setSubmitting }) => {
        setTimeout(() => {
          const result = { ...values };
          // console.log(result); // The is the result object for the form.
          setSubmitting(false);
        }, 400);
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
              <label className="text-sm font-semibold text-gray-500 ">
                Character Type
              </label>

              <Field
                as="select"
                name="requestType"
                onChange={handleChange}
                value={values.requestType}
                className="w-full px-4 py-2 border border-gray-300 rounded "
              >
                <option value="">Select Character Type</option>
                <option value="Humanoid">Humanoid</option>
                <option value="Animal">Animal</option>
                <option value="Other">Other</option>
              </Field>

              <ErrorMessage
                name="requestType"
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
                  name="file"
                  multiple
                  ref={fileInputRef}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    var selectedValue = e.target.files;
                    if (values.file) {
                      selectedValue = [...values.file, ...selectedValue];
                    }
                    setFieldValue("file", selectedValue);
                  }}
                />
                
                {values.file && (
                  <div>
                    {
                      Array.from(values.file).map(
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
                      setPreview(null);
                      setFieldValue("file", null);
                    }}>Clear</button>
                    </div>
                  </div>
                )}
                
              </div>
              <ErrorMessage
                name="file"
                component="div"
                className="py-1 text-sm italic font-semibold text-red-500 "
              />
            </div>

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

export default CharacterModal;
