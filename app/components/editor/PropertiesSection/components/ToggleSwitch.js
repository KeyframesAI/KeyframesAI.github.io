import React from "react";
import "./ToggleSwitch.css";

const ToggleSwitch = ({ label, onChange, checked }) => {
  return (
    <div className="container">
      <div className="toggle-switch">
        <input type="checkbox" className="checkbox" 
               name={label} id={label} 
               onChange={onChange}
               checked={checked}
        />
        <label className="label" htmlFor={label}>
          <span className="inner text-xs" />
          <span className="switch" />
        </label>
      </div>
    </div>
  );
};

export default ToggleSwitch;