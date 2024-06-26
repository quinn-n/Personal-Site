import type React from "react";

export function SkillPage(props: {
  children?: React.ReactNode;
  professionalExperience: number;
  personalExperience: number;
  pluralsightIQ?: number;
}) {
  return (
    <div className="flex flex-col p-12 sm:p-16 space-y-4">
      <div>
        <h1>{props.professionalExperience} years of professional experience</h1>
        <h1>{props.personalExperience} years personal / hobbyist experience</h1>
        {props.pluralsightIQ ? (
          <h1>Pluralsight IQ of {props.pluralsightIQ}</h1>
        ) : undefined}
      </div>
      <div className="flex flex-col space-y-4">{props.children}</div>
    </div>
  );
}
