import * as React from "react";
import OutsideAlerter from "./OutsideAlerter";

const INPUT_TEXT = "stylized-inputs";

export interface IStylizedDropdownProps extends React.ComponentProps<any>{
  label: string;
  value: any;
  options: Array<string>;
  onChange: (selected: string) => void;
  isRequired?: boolean;
  allowEmpty?: boolean
}

const StylizedDropdown = ({label, value, onChange, isRequired, options, allowEmpty=false, ...props}: IStylizedDropdownProps) => {
  const [focus, setFocus] = React.useState<boolean>(false)
  const [hover, setHover] = React.useState<boolean>(false)

  return (
    <OutsideAlerter callback={() => setFocus(false)} {...props}>
      <div className={INPUT_TEXT}>
        <div id="container" className={focus ? "active" : hover ? "hover" : ""}>
          <i className="icon">▼</i>
          <div
            onClick={() => setFocus(!focus)}
            onMouseOver={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            tabIndex={0}
            className={`selector ${value !== "" ? "not-empty" : ""}`}
          >{value}</div>
          <div id="outline">
            <div className="notched left"/>
            <div className={`notched middle ${value !== "" ? "not-empty" : ""}`}>
              <label className={value !== "" ? "not-empty" : ""}>{label}{isRequired ? "*" : ""}</label>
            </div>
            <div className="notched right"/>
          </div>
          <div className="dropdown">
            <ul>
              {allowEmpty
                ? <li onClick={() => {
                  onChange("")
                  setFocus(false)
                }} className={value === "" ? "selected" : ""} />
                : undefined
              }
              {options.map(option => {
                return (
                  <li onClick={() => {
                    onChange(option)
                    setFocus(false)
                  }} className={value === option ? "selected" : ""}>
                    {option}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </OutsideAlerter>
  )
}

export default StylizedDropdown
