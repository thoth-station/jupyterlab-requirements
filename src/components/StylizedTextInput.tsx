import * as React from "react";

const INPUT_TEXT = "stylized-inputs";

export interface IStylizedTextInputProps extends React.ComponentProps<'div'>{
  label: string;
  value: any;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isRequired?: boolean;
  helperText?: string;
  suffix?: string;
}

const StylizedTextInput = ({label, value, onChange, isRequired, helperText, suffix, ...props}: IStylizedTextInputProps) => {
  const [focus, setFocus] = React.useState<boolean>(false)
  const [hover, setHover] = React.useState<boolean>(false)


  return (
    <div className={INPUT_TEXT} {...props}>
      <div id="container" className={focus ? "active" : hover ? "hover" : ""}>
        <input
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onMouseOver={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          value={value}
          onChange={onChange}
        />
        <div id="outline">
            <div className="notched left"/>
            <div className={`notched middle ${value !== "" ? "not-empty" : ""}`}>
              <label className={value !== "" ? "not-empty" : ""}>{label}{isRequired ? "*" : ""}</label>
            </div>
            <div className="notched right">
              <p className="suffix">{suffix}</p>
            </div>
        </div>
      </div>
      {helperText ? <p className="helper-text">{helperText}</p> : undefined}
    </div>
  )
}

export default StylizedTextInput
