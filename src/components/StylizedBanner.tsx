import * as React from "react";

export type severity = "warning" | "error" | "success" | "info";

export interface IStylizedBannerProps extends React.ComponentProps<'div'>{
  label: string | JSX.Element;
  linkLabel?: string;
  link?: string;
  severity?: severity;
}

const severitySymbols = {
  warning: '!',
  error: 'X',
  success: '✓',
  info: "i"
}

const StylizedBanner = ({label, link, severity="info", linkLabel="DETAILS", ...props}: IStylizedBannerProps) => {
  return (
    <div className={`stylized-banner ${severity}`} {...props}>
      <div className="icon">
        {severitySymbols[severity]}
      </div>
      <div className="label">{label}</div>
      {link
        ?  <div className="link">
          <a target="_blank" rel="noreferrer noopener" href={link}>{linkLabel.toUpperCase()}</a>
        </div>
        : undefined
      }
    </div>
  )
}

export default StylizedBanner
